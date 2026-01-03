const Quotation = require('../models/Quotation');
const Task = require('../models/Task');
const User = require('../models/User');
const ExcelProcessor = require('../services/excelProcessor');
const QuotationPdfService = require('../services/quotationPdfService');
const { createNotification, notifyMultipleUsers } = require('./notificationController');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Use /tmp for cloud deployments (ephemeral storage)
const UPLOADS_DIR = process.env.NODE_ENV === 'production'
  ? path.join(os.tmpdir(), 'quotations')
  : path.join(__dirname, '../../uploads/quotations');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Helper: Get all admin and manager user IDs (excludes super_admin)
 * @returns {Promise<string[]>} Array of user ID strings
 */
const getAdminManagerIds = async () => {
  const adminManagers = await User.find({
    isActive: true,
    role: { $in: ['admin', 'manager'] }
  }).select('_id');
  return adminManagers.map(u => u._id.toString());
};

// Helper: Upload PDF to Cloudinary
const uploadPdfToCloudinary = async (filePath, fileName) => {
  try {
    // Log upload attempt
    console.log('📤 Uploading PDF to Cloudinary:', {
      fileName,
      fileExists: fs.existsSync(filePath),
      cloudName: process.env.CLOUDINARY_CLOUD_NAME?.substring(0, 5) + '...',
      apiKeyPresent: !!process.env.CLOUDINARY_API_KEY,
      apiKeyPrefix: process.env.CLOUDINARY_API_KEY?.substring(0, 4) + '...'
    });

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'raw',
      type: 'upload',           // Explicitly set as public upload
      folder: 'quotations',
      public_id: fileName.replace('.pdf', ''),
      format: 'pdf',
      access_mode: 'public',    // Ensure public access
      invalidate: true          // Clear CDN cache if re-uploading
    });

    console.log('✅ PDF uploaded successfully:', {
      fileName,
      url: result.secure_url,
      size: result.bytes,
      access_mode: result.access_mode,
      type: result.type
    });

    return result.secure_url;
  } catch (error) {
    console.error('❌ Cloudinary upload error:', {
      fileName,
      message: error.message,
      httpCode: error.http_code,
      errorName: error.name,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKeyLength: process.env.CLOUDINARY_API_KEY?.length,
      apiKeyValue: process.env.CLOUDINARY_API_KEY,
      fullError: JSON.stringify(error, null, 2)
    });
    throw new Error('Failed to upload PDF to cloud storage');
  }
};

// Helper: Delete PDF from Cloudinary
const deletePdfFromCloudinary = async (pdfUrl) => {
  try {
    if (!pdfUrl || !pdfUrl.includes('cloudinary')) return;

    // Extract public_id from URL
    const urlParts = pdfUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const publicId = `quotations/${fileName.replace('.pdf', '')}`;

    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const isConfigured = cloudName &&
    apiKey &&
    apiSecret &&
    cloudName !== 'your-cloudinary-cloud-name' &&
    cloudName !== 'your_cloud_name';

  // Debug logging
  if (!isConfigured) {
    console.log('⚠️  Cloudinary NOT configured:', {
      hasCloudName: !!cloudName,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      cloudNameValue: cloudName ? cloudName.substring(0, 5) + '...' : 'undefined'
    });
  }

  return isConfigured;
};

/**
 * @desc    Get all quotations (optionally filtered by clientName)
 * @route   GET /api/quotations?clientName=...
 * @access  Private
 */
exports.getQuotations = async (req, res) => {
  try {
    // Build query object
    const query = {};

    // Filter by clientName if provided (case-insensitive matching)
    if (req.query.clientName) {
      query.clientName = { $regex: req.query.clientName, $options: 'i' };
    }

    const quotations = await Quotation.find(query)
      .sort({ date: -1 }) // Sort by quotation date, newest first
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      count: quotations.length,
      data: quotations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching quotations',
      error: error.message
    });
  }
};

/**
 * @desc    Get single quotation
 * @route   GET /api/quotations/:id
 * @access  Private
 */
exports.getQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate({
        path: 'linkedTasks',
        select: 'title status priority dueDate assignees',
        populate: {
          path: 'assignees',
          select: 'name email'
        }
      })
      .populate('advertisementProducts');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching quotation',
      error: error.message
    });
  }
};

/**
 * @desc    Upload Excel, generate PDF, and create quotation
 * @route   POST /api/quotations/upload
 * @access  Private
 */
exports.uploadExcel = async (req, res) => {
  let tempFilePath = null;

  try {
    console.log('📁 Excel upload request received');

    // Check if file exists (using express-fileupload)
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel file'
      });
    }

    const uploadedFile = req.files.file;
    tempFilePath = uploadedFile.tempFilePath;
    console.log('📄 File received:', uploadedFile.name);

    // Step 1: Extract data from Excel
    console.log('🔍 Extracting data from Excel...');
    const extractedData = ExcelProcessor.processQuotationExcel(tempFilePath);
    console.log('✅ Data extracted successfully');

    // Handle advertisement products
    let advertisementProducts = [];
    if (req.body.advertisementProducts) {
      try {
        advertisementProducts = JSON.parse(req.body.advertisementProducts);
        // If it's an array of strings (IDs), we might need to fetch product details for PDF generation
        if (Array.isArray(advertisementProducts) && advertisementProducts.length > 0) {
          const Product = require('../models/Product');
          const products = await Product.find({ _id: { $in: advertisementProducts } });
          // Map products to match order of IDs if important, or just use found products
          extractedData.advertisementProducts = products;
        }
      } catch (e) {
        console.error('Error parsing advertisement products:', e);
      }
    }

    // Step 2: Generate PDF filename
    const sanitizedRefNo = extractedData.refNo.replace(/[^a-z0-9]/gi, '_');
    const sanitizedClient = extractedData.clientName.substring(0, 20).replace(/[^a-z0-9]/gi, '_');
    const pdfFileName = `${sanitizedRefNo}_${sanitizedClient}.pdf`;
    const pdfFilePath = path.join(UPLOADS_DIR, pdfFileName);

    // Step 3: Generate PDF
    console.log('📄 Generating PDF...');
    await QuotationPdfService.generateQuotationPDF(extractedData, pdfFilePath);
    console.log('✅ PDF generated successfully:', pdfFileName);

    // Step 3.5: Upload PDF to Cloudinary
    let pdfUrl = `/uploads/quotations/${pdfFileName}`;
    const cloudinaryConfigured = isCloudinaryConfigured();
    console.log('☁️  Cloudinary configured:', cloudinaryConfigured);

    if (cloudinaryConfigured) {
      try {
        console.log('☁️  Uploading PDF to Cloudinary...');
        pdfUrl = await uploadPdfToCloudinary(pdfFilePath, pdfFileName);
        console.log('✅ PDF uploaded to Cloudinary:', pdfUrl);

        // Delete local temp file after upload
        if (fs.existsSync(pdfFilePath)) {
          fs.unlinkSync(pdfFilePath);
        }
      } catch (uploadError) {
        console.error('❌ Cloudinary upload failed:', uploadError.message);
        // Keep local path as fallback
        console.log('⚠️  Using local path as fallback:', pdfUrl);
      }
    } else {
      console.log('⚠️  Cloudinary not configured - using local storage:', pdfUrl);
    }

    // Step 4: Save quotation to database
    console.log('💾 Saving to database...');
    const quotation = await Quotation.create({
      pdfUrl: pdfUrl,
      fileName: pdfFileName,
      refNo: extractedData.refNo,
      date: extractedData.date,
      clientName: extractedData.clientName,
      items: extractedData.items,
      subtotal: extractedData.subtotal,
      gst: extractedData.gst,
      grandTotal: extractedData.grandTotal,
      paymentTerms: extractedData.paymentTerms,
      offerValidity: extractedData.offerValidity,
      advertisementProducts: advertisementProducts,
      createdBy: req.user?._id
    });
    console.log('✅ Quotation saved to database');

    // Step 5: Delete temporary Excel file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log('🗑️  Temporary Excel file deleted');
    }

    // Step 6: Notify only admin/managers (not employees, not super_admin)
    if (req.user) {
      try {
        const adminManagerIds = await getAdminManagerIds();
        // Exclude self from notifications
        const usersToNotify = adminManagerIds.filter(id => id !== req.user.id?.toString());

        if (usersToNotify.length > 0) {
          await notifyMultipleUsers(
            usersToNotify,
            {
              type: 'success',
              category: 'quotation',
              title: 'New Quotation Created',
              message: `Quotation "${extractedData.refNo}" for ${extractedData.clientName} has been created by ${req.user.name}`,
              entityType: 'quotation',
              entityId: quotation._id,
              actionUrl: '/quotations',
              createdBy: req.user.name || 'System'
            },
            req.io
          );
          console.log(`✉️  Quotation creation notification sent to ${usersToNotify.length} admin/manager(s)`);
        }
      } catch (notifyError) {
        console.error('Error sending quotation creation notifications:', notifyError);
        // Don't fail the request if notification fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      data: quotation
    });

  } catch (error) {
    console.error('❌ Error processing quotation:', error);

    // Clean up temp file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('🗑️  Cleaned up temporary file after error');
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
    }

    res.status(400).json({
      success: false,
      message: error.message || 'Error processing quotation',
      error: error.message
    });
  }
};

/**
 * @desc    Download quotation PDF
 * @route   GET /api/quotations/:id/download
 * @access  Private
 */
exports.downloadPdf = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Check if pdfUrl exists
    if (!quotation.pdfUrl) {
      return res.status(404).json({
        success: false,
        message: 'PDF URL not available for this quotation'
      });
    }

    // If it's a Cloudinary URL, return the URL for frontend to handle
    if (quotation.pdfUrl.includes('cloudinary') || quotation.pdfUrl.startsWith('http')) {
      return res.json({
        success: true,
        isExternal: true,
        downloadUrl: quotation.pdfUrl,
        fileName: quotation.fileName
      });
    }

    // Local file handling (for backward compatibility)
    const pdfPath = path.join(__dirname, '../../', quotation.pdfUrl);

    // In production, if local file doesn't exist, regenerate and upload to Cloudinary
    if (!fs.existsSync(pdfPath)) {
      // Check if we're in production and Cloudinary is configured
      if (process.env.NODE_ENV === 'production' && isCloudinaryConfigured()) {
        console.log('🔄 Regenerating PDF for quotation:', quotation._id);

        try {
          // Ensure temp directory exists
          if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
          }

          // Generate new PDF
          const pdfFileName = quotation.fileName || `quotation_${quotation.refNo}_${Date.now()}.pdf`;
          const tempPdfPath = path.join(UPLOADS_DIR, pdfFileName);

          await QuotationPdfService.generateQuotationPDF(quotation.toObject(), tempPdfPath);

          // Upload to Cloudinary
          const cloudinaryUrl = await uploadPdfToCloudinary(tempPdfPath, pdfFileName);

          // Update quotation with new Cloudinary URL
          quotation.pdfUrl = cloudinaryUrl;
          await quotation.save();

          // Clean up temp file
          if (fs.existsSync(tempPdfPath)) {
            fs.unlinkSync(tempPdfPath);
          }

          console.log('✅ PDF regenerated and uploaded to Cloudinary');

          return res.json({
            success: true,
            isExternal: true,
            downloadUrl: cloudinaryUrl,
            fileName: quotation.fileName
          });
        } catch (regenError) {
          console.error('Error regenerating PDF:', regenError);
          return res.status(500).json({
            success: false,
            message: 'Error regenerating PDF. Please try again.',
            error: regenError.message
          });
        }
      }

      return res.status(404).json({
        success: false,
        message: 'PDF file not found on server. Please regenerate the quotation.'
      });
    }

    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${quotation.fileName || 'quotation.pdf'}"`);

    // Stream the file
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading PDF',
      error: error.message
    });
  }
};

/**
 * @desc    Preview/Get PDF URL (for viewing in browser)
 * @route   GET /api/quotations/:id/preview
 * @access  Private
 */
exports.previewPdf = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    if (!quotation.pdfUrl) {
      return res.status(404).json({
        success: false,
        message: 'PDF not available for this quotation'
      });
    }

    // If it's already a Cloudinary/external URL, return it directly
    if (quotation.pdfUrl.includes('cloudinary') || quotation.pdfUrl.startsWith('http')) {
      return res.json({
        success: true,
        pdfUrl: quotation.pdfUrl,
        fileName: quotation.fileName
      });
    }

    // Local path - check if file exists
    const pdfPath = path.join(__dirname, '../../', quotation.pdfUrl);

    if (fs.existsSync(pdfPath)) {
      // In development, return local URL
      return res.json({
        success: true,
        pdfUrl: quotation.pdfUrl,
        fileName: quotation.fileName,
        isLocal: true
      });
    }

    // File doesn't exist - regenerate in production
    if (process.env.NODE_ENV === 'production' && isCloudinaryConfigured()) {
      console.log('🔄 Regenerating PDF for preview:', quotation._id);

      try {
        if (!fs.existsSync(UPLOADS_DIR)) {
          fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }

        const pdfFileName = quotation.fileName || `quotation_${quotation.refNo}_${Date.now()}.pdf`;
        const tempPdfPath = path.join(UPLOADS_DIR, pdfFileName);

        await QuotationPdfService.generateQuotationPDF(quotation.toObject(), tempPdfPath);
        const cloudinaryUrl = await uploadPdfToCloudinary(tempPdfPath, pdfFileName);

        quotation.pdfUrl = cloudinaryUrl;
        await quotation.save();

        if (fs.existsSync(tempPdfPath)) {
          fs.unlinkSync(tempPdfPath);
        }

        return res.json({
          success: true,
          pdfUrl: cloudinaryUrl,
          fileName: quotation.fileName,
          regenerated: true
        });
      } catch (regenError) {
        console.error('Error regenerating PDF for preview:', regenError);
        return res.status(500).json({
          success: false,
          message: 'Error generating PDF preview',
          error: regenError.message
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: 'PDF file not found. Please regenerate the quotation.'
    });

  } catch (error) {
    console.error('Preview PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting PDF preview',
      error: error.message
    });
  }
};

/**
 * @desc    Update quotation filename
 * @route   PATCH /api/quotations/:id/filename
 * @access  Private
 */
exports.updateFileName = async (req, res) => {
  try {
    const { fileName } = req.body;

    if (!fileName || !fileName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'File name is required'
      });
    }

    // Ensure .pdf extension
    let newFileName = fileName.trim();
    if (!newFileName.endsWith('.pdf')) {
      newFileName += '.pdf';
    }

    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      {
        fileName: newFileName,
        updatedBy: req.user?._id
      },
      { new: true, runValidators: true }
    );

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Filename updated successfully',
      data: quotation
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating filename',
      error: error.message
    });
  }
};

/**
 * @desc    Delete quotation and PDF file
 * @route   DELETE /api/quotations/:id
 * @access  Private
 */
exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Delete PDF from Cloudinary if it's a cloud URL
    if (quotation.pdfUrl && quotation.pdfUrl.includes('cloudinary')) {
      await deletePdfFromCloudinary(quotation.pdfUrl);
      console.log('🗑️  PDF deleted from Cloudinary');
    } else if (quotation.pdfUrl) {
      // Delete PDF file from local filesystem (backward compatibility)
      const pdfPath = path.join(__dirname, '../../', quotation.pdfUrl);
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
        console.log('🗑️  PDF file deleted:', pdfPath);
      }
    }

    // Delete from database
    await Quotation.findByIdAndDelete(req.params.id);

    // --- NOTIFICATION: Notify all admin/managers (exclude self) ---
    if (req.user) {
      try {
        const adminManagerIds = await getAdminManagerIds();
        const usersToNotify = adminManagerIds.filter(id => id !== req.user.id?.toString());

        if (usersToNotify.length > 0) {
          await notifyMultipleUsers(
            usersToNotify,
            {
              type: 'warning',
              category: 'quotation',
              title: 'Quotation Deleted',
              message: `Quotation "${quotation.refNo}" for ${quotation.clientName} has been deleted by ${req.user.name}`,
              entityType: 'quotation',
              entityId: null,
              actionUrl: '/quotations',
              createdBy: req.user.name || 'System'
            },
            req.io
          );
          console.log(`✉️  Quotation deleted notification sent to ${usersToNotify.length} admin/manager(s)`);
        }
      } catch (notifyError) {
        console.error('Error sending quotation delete notifications:', notifyError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Quotation and PDF deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting quotation',
      error: error.message
    });
  }
};

/**
 * @desc    Update quotation status
 * @route   PATCH /api/quotations/:id/status
 * @access  Private
 */
exports.updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!status || !['on_hold', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (on_hold, approved, rejected)'
      });
    }

    // Get the quotation first to store previous status
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const previousStatus = quotation.status;

    // Update the quotation
    quotation.status = status;
    quotation.statusNote = note || '';
    quotation.updatedBy = req.user?._id;
    await quotation.save();

    // --- NOTIFICATION: Notify only admin/managers (exclude self) ---
    try {
      const adminManagerIds = await getAdminManagerIds();
      const usersToNotify = adminManagerIds.filter(id => id !== req.user?.id?.toString());

      if (usersToNotify.length > 0) {
        const statusLabels = {
          on_hold: 'On Hold',
          approved: 'Approved',
          rejected: 'Rejected'
        };

        const previousLabel = statusLabels[previousStatus] || previousStatus;
        const currentLabel = statusLabels[status] || status;

        await notifyMultipleUsers(
          usersToNotify,
          {
            type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning',
            category: 'quotation',
            title: 'Quotation Status Updated',
            message: `Quotation "${quotation.refNo}" for ${quotation.clientName} status changed by ${req.user?.name}: ${previousLabel} → ${currentLabel}`,
            entityType: 'quotation',
            entityId: quotation._id,
            actionUrl: `/quotations`,
            createdBy: req.user?.name || 'System'
          },
          req.io
        );
        console.log(`✉️  Status change notification sent to ${usersToNotify.length} admin/manager(s): ${previousLabel} → ${currentLabel}`);
      }
    } catch (notifyError) {
      console.error('Error sending notifications:', notifyError);
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: quotation
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating status',
      error: error.message
    });
  }
};

/**
 * @desc    Update quotation priority
 * @route   PATCH /api/quotations/:id/priority
 * @access  Private
 */
exports.updatePriority = async (req, res) => {
  try {
    const { priority } = req.body;

    if (!priority || !['low', 'high', 'extreme'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Valid priority is required (low, high, extreme)'
      });
    }

    // Get the quotation first to store previous priority
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const previousPriority = quotation.priority;

    // Update the quotation
    quotation.priority = priority;
    quotation.updatedBy = req.user?._id;
    await quotation.save();

    // --- NOTIFICATION: Notify only admin/managers (exclude self) ---
    try {
      const adminManagerIds = await getAdminManagerIds();
      const usersToNotify = adminManagerIds.filter(id => id !== req.user?.id?.toString());

      if (usersToNotify.length > 0) {
        const priorityLabels = {
          low: 'Low',
          high: 'High',
          extreme: 'Extreme'
        };

        const previousLabel = priorityLabels[previousPriority] || previousPriority;
        const currentLabel = priorityLabels[priority] || priority;

        await notifyMultipleUsers(
          usersToNotify,
          {
            type: priority === 'extreme' ? 'error' : priority === 'high' ? 'warning' : 'info',
            category: 'quotation',
            title: 'Quotation Priority Updated',
            message: `Quotation "${quotation.refNo}" for ${quotation.clientName} priority changed by ${req.user?.name}: ${previousLabel} → ${currentLabel}`,
            entityType: 'quotation',
            entityId: quotation._id,
            actionUrl: `/quotations`,
            createdBy: req.user?.name || 'System'
          },
          req.io
        );
        console.log(`✉️  Priority change notification sent to ${usersToNotify.length} admin/manager(s): ${previousLabel} → ${currentLabel}`);
      }
    } catch (notifyError) {
      console.error('Error sending notifications:', notifyError);
    }

    res.status(200).json({
      success: true,
      message: 'Priority updated successfully',
      data: quotation
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating priority',
      error: error.message
    });
  }
};

/**
 * @desc    Update advertisement products
 * @route   PUT /api/quotations/:id/advertisements
 * @access  Private
 */
exports.updateAdvertisementProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: 'productIds must be an array'
      });
    }

    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      {
        advertisementProducts: productIds,
        updatedBy: req.user?._id
      },
      { new: true }
    ).populate('advertisementProducts');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Advertisement products updated successfully',
      data: quotation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating advertisement products',
      error: error.message
    });
  }
};

/**
 * @desc    Regenerate PDF with updated data
 * @route   POST /api/quotations/:id/regenerate-pdf
 * @access  Private
 */
exports.regenerateQuotationPdf = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('advertisementProducts');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const pdfFilePath = path.join(UPLOADS_DIR, quotation.fileName);

    // Generate new PDF
    await QuotationPdfService.generateQuotationPDF(quotation, pdfFilePath);

    // Upload to Cloudinary if configured
    let pdfUrl = quotation.pdfUrl;
    if (isCloudinaryConfigured()) {
      // Delete old PDF from Cloudinary
      if (quotation.pdfUrl && quotation.pdfUrl.includes('cloudinary')) {
        await deletePdfFromCloudinary(quotation.pdfUrl);
      }

      // Upload new PDF
      pdfUrl = await uploadPdfToCloudinary(pdfFilePath, quotation.fileName);

      // Update quotation with new URL
      quotation.pdfUrl = pdfUrl;
      await quotation.save();

      // Delete local temp file
      if (fs.existsSync(pdfFilePath)) {
        fs.unlinkSync(pdfFilePath);
      }
    }

    res.status(200).json({
      success: true,
      message: 'PDF regenerated successfully',
      data: quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error regenerating PDF',
      error: error.message
    });
  }
};
exports.createLinkedTask = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const { title, description, priority, assignees, dueDate, estimatedTime, tags } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required'
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Due date is required'
      });
    }

    // Create the task
    const task = await Task.create({
      title: title.includes(quotation.refNo) ? title : `[${quotation.refNo}] ${title}`,
      description: description || `Task linked to Quotation ${quotation.refNo} for ${quotation.clientName}`,
      status: 'todo',
      priority: priority || 'medium',
      assignees: assignees || [],
      dueDate,
      estimatedTime: estimatedTime || '0h',
      tags: tags || ['quotation'],
      createdBy: req.user?._id
    });

    // Link task to quotation
    quotation.linkedTasks.push(task._id);
    quotation.updatedBy = req.user?._id;
    await quotation.save();

    // Populate task assignees for response
    await task.populate('assignees', 'name email');

    // Notify assignees (works like workspace tasks)
    if (task.assignees && task.assignees.length > 0) {
      await notifyMultipleUsers(
        task.assignees.map(a => a._id || a),
        {
          type: 'success',
          category: 'task',
          title: 'New Task Assigned',
          message: `You have been assigned to task: "${task.title}" by ${req.user?.name}`,
          entityType: 'task',
          entityId: task._id,
          actionUrl: '/workspace/tasks',
          createdBy: req.user?.name || 'System',
          isAssignment: true
        },
        req.io
      );
      console.log(`✉️  Linked task assignment notification sent to ${task.assignees.length} assignee(s)`);
    }

    res.status(201).json({
      success: true,
      message: 'Task created and linked successfully',
      data: task
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating linked task',
      error: error.message
    });
  }
};
