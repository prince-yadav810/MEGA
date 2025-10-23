const Quotation = require('../models/Quotation');
const xlsx = require('xlsx');
const { createNotification } = require('./notificationController');

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
exports.getQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find()
      .sort({ createdDate: -1 })
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

// @desc    Get single quotation
// @route   GET /api/quotations/:id
// @access  Private
exports.getQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

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

// @desc    Create quotation
// @route   POST /api/quotations
// @access  Private
exports.createQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.create({
      ...req.body,
      createdBy: req.user?._id
    });

    // Create notification for user
    await createNotification({
      userId: req.user.id,
      type: 'success',
      category: 'quotation',
      title: 'Quotation Created',
      message: `Quotation "${quotation.number}" for ${quotation.client} has been created successfully`,
      entityType: 'quotation',
      entityId: quotation._id,
      actionUrl: '/quotations',
      createdBy: req.user.name || 'System'
    }, req.io);

    res.status(201).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating quotation',
      error: error.message
    });
  }
};

// @desc    Update quotation
// @route   PUT /api/quotations/:id
// @access  Private
exports.updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user?._id
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Create notification for user
    await createNotification({
      userId: req.user.id,
      type: 'success',
      category: 'quotation',
      title: 'Quotation Updated',
      message: `Quotation "${quotation.number}" for ${quotation.client} has been updated successfully`,
      entityType: 'quotation',
      entityId: quotation._id,
      actionUrl: '/quotations',
      createdBy: req.user.name || 'System'
    }, req.io);

    res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating quotation',
      error: error.message
    });
  }
};

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
// @access  Private
exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Create notification for user
    await createNotification({
      userId: req.user.id,
      type: 'warning',
      category: 'quotation',
      title: 'Quotation Deleted',
      message: `Quotation "${quotation.number}" for ${quotation.client} has been deleted from the system`,
      entityType: 'quotation',
      entityId: null,
      actionUrl: '/quotations',
      createdBy: req.user.name || 'System'
    }, req.io);

    res.status(200).json({
      success: true,
      message: 'Quotation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting quotation',
      error: error.message
    });
  }
};

// @desc    Upload Excel and import quotations
// @route   POST /api/quotations/upload
// @access  Private
exports.uploadExcel = async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Files:', req.files);

    if (!req.files || !req.files.file) {
      console.log('No file in request');
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel file'
      });
    }

    const file = req.files.file;
    console.log('File details:', {
      name: file.name,
      mimetype: file.mimetype,
      size: file.size
    });

    // Check if file is Excel (also allow CSV for flexibility)
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ];

    if (!validTypes.includes(file.mimetype) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      console.log('Invalid file type:', file.mimetype);
      return res.status(400).json({
        success: false,
        message: `Please upload a valid Excel file (.xls, .xlsx, or .csv). Received: ${file.mimetype}`
      });
    }

    // Read Excel file
    console.log('Reading Excel file...');
    const workbook = xlsx.read(file.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    console.log('Sheet name:', sheetName);

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    console.log('Parsed rows:', jsonData.length);
    console.log('First row sample:', jsonData[0]);

    if (!jsonData || jsonData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is empty or improperly formatted'
      });
    }

    // Parse and validate Excel data
    const quotations = [];
    const errors = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2; // Excel row number (accounting for header)

      try {
        // Extract data from Excel columns
        // Expected columns: Quote Number, Client, Title/Details, Amount, Status, Valid Until
        const quotationData = {
          number: row['Quote Number'] || row['Quotation Number'] || row['Number'] || '',
          client: row['Client'] || row['Client Name'] || '',
          title: row['Title'] || row['Details'] || row['Quotation Details'] || row['Description'] || '',
          amount: row['Amount'] || row['Total Amount'] || '',
          status: (row['Status'] || 'pending').toLowerCase(),
          validUntil: parseExcelDate(row['Valid Until'] || row['Valid Till'] || row['Expiry Date']),
          items: parseInt(row['Items'] || row['Item Count'] || 0),
          createdDate: parseExcelDate(row['Created Date'] || row['Date']) || new Date(),
          createdBy: req.user?._id
        };

        // Validate required fields
        if (!quotationData.number) {
          errors.push({ row: rowNumber, error: 'Quote Number is required' });
          continue;
        }
        if (!quotationData.client) {
          errors.push({ row: rowNumber, error: 'Client is required' });
          continue;
        }
        if (!quotationData.title) {
          errors.push({ row: rowNumber, error: 'Title/Details is required' });
          continue;
        }
        if (!quotationData.amount) {
          errors.push({ row: rowNumber, error: 'Amount is required' });
          continue;
        }
        if (!quotationData.validUntil) {
          errors.push({ row: rowNumber, error: 'Valid Until date is required' });
          continue;
        }

        // Validate status
        const validStatuses = ['pending', 'approved', 'rejected', 'expired'];
        if (!validStatuses.includes(quotationData.status)) {
          quotationData.status = 'pending';
        }

        quotations.push(quotationData);
      } catch (error) {
        errors.push({ row: rowNumber, error: error.message });
      }
    }

    // Save quotations to database
    const savedQuotations = [];
    const saveErrors = [];

    for (let i = 0; i < quotations.length; i++) {
      try {
        // Check if quotation with same number already exists
        const existing = await Quotation.findOne({ number: quotations[i].number });

        if (existing) {
          // Update existing quotation
          const updated = await Quotation.findOneAndUpdate(
            { number: quotations[i].number },
            { ...quotations[i], updatedBy: req.user?._id },
            { new: true, runValidators: true }
          );
          savedQuotations.push(updated);
        } else {
          // Create new quotation
          const created = await Quotation.create(quotations[i]);
          savedQuotations.push(created);
        }
      } catch (error) {
        saveErrors.push({
          quotation: quotations[i].number,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully processed ${savedQuotations.length} quotations`,
      data: {
        total: jsonData.length,
        saved: savedQuotations.length,
        parseErrors: errors.length,
        saveErrors: saveErrors.length,
        quotations: savedQuotations
      },
      errors: errors.length > 0 || saveErrors.length > 0 ? {
        parseErrors: errors,
        saveErrors: saveErrors
      } : undefined
    });

  } catch (error) {
    console.error('Excel upload error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error uploading Excel file',
      error: error.message,
      details: error.stack
    });
  }
};

// Helper function to parse Excel date
function parseExcelDate(excelDate) {
  if (!excelDate) return null;

  // If it's already a Date object
  if (excelDate instanceof Date) {
    return excelDate;
  }

  // If it's a string
  if (typeof excelDate === 'string') {
    const date = new Date(excelDate);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // If it's an Excel serial number
  if (typeof excelDate === 'number') {
    // Excel date serial number (days since 1900-01-01)
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + excelDate * 86400000);
  }

  return null;
}
