// File Path: server/src/controllers/clientController.js

const Client = require('../models/Client');
const PaymentReminder = require('../models/PaymentReminder');
const { createNotification } = require('./notificationController');
const fs = require('fs').promises;
const googleVisionService = require('../services/googleVisionService');
const geminiService = require('../services/geminiService');
const duplicateDetectionService = require('../services/duplicateDetectionService');
const { validateBusinessCardImages } = require('../utils/imageValidator');
const { logBusinessCardExtraction } = require('../utils/apiUsageTracker');

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
exports.getAllClients = async (req, res) => {
  try {
    const { search, isActive, page = 1, limit = 10, sortBy = '-createdAt' } = req.query;
    
    const query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { 'contactPersons.name': { $regex: search, $options: 'i' } },
        { 'contactPersons.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const clients = await Client.find(query)
      .populate('createdBy', 'name email')
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Client.countDocuments(query);
    
    res.json({
      success: true,
      count: clients.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: clients
    });
  } catch (error) {
    console.error('Get all clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching clients',
      error: error.message
    });
  }
};

// @desc    Get single client by ID
// @route   GET /api/clients/:id
// @access  Private
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('createdBy', 'name email avatar');
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Get client by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching client',
      error: error.message
    });
  }
};

// @desc    Create new client
// @route   POST /api/clients
// @access  Private
exports.createClient = async (req, res) => {
  try {
    const clientData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    // Validate at least one contact person
    if (!clientData.contactPersons || clientData.contactPersons.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one contact person is required'
      });
    }
    
    // Ensure at least one primary contact
    const hasPrimary = clientData.contactPersons.some(contact => contact.isPrimary);
    if (!hasPrimary) {
      clientData.contactPersons[0].isPrimary = true;
    }
    
    const client = await Client.create(clientData);
    
    // Populate created client
    await client.populate('createdBy', 'name email');
    
    // Emit socket notification
    if (req.io) {
      req.io.emit('client:created', {
        client,
        createdBy: req.user
      });
    }

    // Create notification for user
    await createNotification({
      userId: req.user.id,
      type: 'success',
      category: 'client',
      title: 'Client Created',
      message: `Client "${client.companyName}" has been added to your clients list`,
      entityType: 'client',
      entityId: client._id,
      actionUrl: '/clients',
      createdBy: req.user.name || 'System'
    }, req.io);

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client
    });
  } catch (error) {
    console.error('Create client error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating client',
      error: error.message
    });
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
exports.updateClient = async (req, res) => {
  try {
    let client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'createdBy') {
        client[key] = req.body[key];
      }
    });
    
    // Ensure at least one primary contact
    if (client.contactPersons && client.contactPersons.length > 0) {
      const hasPrimary = client.contactPersons.some(contact => contact.isPrimary);
      if (!hasPrimary) {
        client.contactPersons[0].isPrimary = true;
      }
    }
    
    await client.save();
    await client.populate('createdBy', 'name email');
    
    // Emit socket notification
    if (req.io) {
      req.io.emit('client:updated', {
        client,
        updatedBy: req.user
      });
    }

    // Create notification for user
    await createNotification({
      userId: req.user.id,
      type: 'success',
      category: 'client',
      title: 'Client Updated',
      message: `Client "${client.companyName}" has been updated successfully`,
      entityType: 'client',
      entityId: client._id,
      actionUrl: '/clients',
      createdBy: req.user.name || 'System'
    }, req.io);

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: client
    });
  } catch (error) {
    console.error('Update client error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating client',
      error: error.message
    });
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private (Admin only)
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    const clientName = client.companyName;
    await client.deleteOne();

    // Emit socket notification
    if (req.io) {
      req.io.emit('client:deleted', {
        clientId: req.params.id,
        deletedBy: req.user
      });
    }

    // Create notification for user
    await createNotification({
      userId: req.user.id,
      type: 'warning',
      category: 'client',
      title: 'Client Deleted',
      message: `Client "${clientName}" has been deleted from the system`,
      entityType: 'client',
      entityId: null,
      actionUrl: '/clients',
      createdBy: req.user.name || 'System'
    }, req.io);

    res.json({
      success: true,
      message: 'Client deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting client',
      error: error.message
    });
  }
};

// @desc    Toggle client active status
// @route   PATCH /api/clients/:id/toggle-active
// @access  Private
exports.toggleClientActive = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    client.isActive = !client.isActive;
    await client.save();

    // Create notification for user
    await createNotification({
      userId: req.user.id,
      type: client.isActive ? 'success' : 'warning',
      category: 'client',
      title: `Client ${client.isActive ? 'Activated' : 'Deactivated'}`,
      message: `Client "${client.companyName}" has been ${client.isActive ? 'activated' : 'deactivated'}`,
      entityType: 'client',
      entityId: client._id,
      actionUrl: '/clients',
      createdBy: req.user.name || 'System'
    }, req.io);

    res.json({
      success: true,
      message: `Client ${client.isActive ? 'activated' : 'deactivated'} successfully`,
      data: client
    });
  } catch (error) {
    console.error('Toggle client active error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling client status',
      error: error.message
    });
  }
};

// @desc    Get client statistics
// @route   GET /api/clients/stats
// @access  Private
exports.getClientStats = async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();
    const activeClients = await Client.countDocuments({ isActive: true });
    const inactiveClients = await Client.countDocuments({ isActive: false });

    const clientsWithOutstanding = await Client.countDocuments({
      totalOutstanding: { $gt: 0 }
    });

    const totalOutstandingAmount = await Client.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$totalOutstanding' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalClients,
        activeClients,
        inactiveClients,
        clientsWithOutstanding,
        totalOutstandingAmount: totalOutstandingAmount[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get client stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching client statistics',
      error: error.message
    });
  }
};

// @desc    Extract client data from business card images
// @route   POST /api/clients/extract-from-card
// @access  Private
exports.extractFromCard = async (req, res) => {
  const startTime = Date.now();
  let frontImagePath = null;
  let backImagePath = null;

  try {
    // Get uploaded files
    const frontImage = req.files?.frontImage?.[0];
    const backImage = req.files?.backImage?.[0];

    // Validate images
    const validation = validateBusinessCardImages(frontImage, backImage);
    if (!validation.valid) {
      // Clean up uploaded files
      if (frontImage) await fs.unlink(frontImage.path).catch(() => {});
      if (backImage) await fs.unlink(backImage.path).catch(() => {});

      return res.status(400).json({
        success: false,
        message: 'Invalid image files',
        errors: validation.errors
      });
    }

    frontImagePath = frontImage.path;
    backImagePath = backImage?.path || null;

    // Step 1: Extract text using Google Vision API
    const textExtractionResult = await googleVisionService.extractTextFromBusinessCard(
      frontImagePath,
      backImagePath
    );

    if (!textExtractionResult.success) {
      // Delete images immediately
      await fs.unlink(frontImagePath).catch(() => {});
      if (backImagePath) await fs.unlink(backImagePath).catch(() => {});

      // Log failed extraction
      await logBusinessCardExtraction({
        userId: req.user.id,
        success: false,
        errorMessage: textExtractionResult.error,
        frontImageSize: frontImage.size,
        backImageSize: backImage?.size || 0,
        processingTime: Date.now() - startTime,
        ipAddress: req.ip
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to extract text from images',
        error: textExtractionResult.error,
        suggestion: 'Please ensure images are clear and contain text, or try manual entry.'
      });
    }

    // Step 2: Parse extracted text using Gemini AI
    const parsingResult = await geminiService.parseBusinessCardText(
      textExtractionResult.combinedText
    );

    if (!parsingResult.success) {
      // Delete images
      await fs.unlink(frontImagePath).catch(() => {});
      if (backImagePath) await fs.unlink(backImagePath).catch(() => {});

      // Log failed parsing
      await logBusinessCardExtraction({
        userId: req.user.id,
        success: false,
        errorMessage: parsingResult.error,
        frontImageSize: frontImage.size,
        backImageSize: backImage?.size || 0,
        processingTime: Date.now() - startTime,
        extractedTextLength: textExtractionResult.combinedText.length,
        ipAddress: req.ip
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to parse business card data',
        error: parsingResult.error,
        rawText: textExtractionResult.combinedText,
        suggestion: 'AI parsing failed. You can use the extracted text below for manual entry.',
        extractedText: {
          front: textExtractionResult.frontText,
          back: textExtractionResult.backText
        }
      });
    }

    // Step 3: Detect duplicates
    const duplicates = await duplicateDetectionService.detectDuplicates(parsingResult.data);

    // Step 4: Delete images immediately (no storage)
    await fs.unlink(frontImagePath).catch((err) => {
      console.error('Failed to delete front image:', err);
    });

    if (backImagePath) {
      await fs.unlink(backImagePath).catch((err) => {
        console.error('Failed to delete back image:', err);
      });
    }

    // Step 5: Log successful extraction
    const processingTime = Date.now() - startTime;
    await logBusinessCardExtraction({
      userId: req.user.id,
      success: true,
      errorMessage: '',
      frontImageSize: frontImage.size,
      backImageSize: backImage?.size || 0,
      processingTime,
      extractedTextLength: textExtractionResult.combinedText.length,
      companyName: parsingResult.data.companyName,
      ipAddress: req.ip
    });

    // Step 6: Return extracted data with confidence and duplicates
    res.json({
      success: true,
      message: 'Business card data extracted successfully',
      extractedData: parsingResult.data,
      confidence: parsingResult.confidence,
      duplicates: {
        exactMatch: duplicates.exactMatch,
        similarCompanies: duplicates.similarCompanies,
        existingContact: duplicates.existingContact
      },
      requiresOverride: duplicateDetectionService.requiresOverride(duplicates),
      warnings: duplicateDetectionService.generateWarningMessages(duplicates),
      processingTime: processingTime,
      extractedText: {
        front: textExtractionResult.frontText,
        back: textExtractionResult.backText
      }
    });
  } catch (error) {
    console.error('Extract from card error:', error);

    // Clean up uploaded files
    if (frontImagePath) {
      await fs.unlink(frontImagePath).catch(() => {});
    }
    if (backImagePath) {
      await fs.unlink(backImagePath).catch(() => {});
    }

    // Log error
    if (req.files?.frontImage?.[0]) {
      await logBusinessCardExtraction({
        userId: req.user.id,
        success: false,
        errorMessage: error.message,
        frontImageSize: req.files.frontImage[0].size,
        backImageSize: req.files.backImage?.[0]?.size || 0,
        processingTime: Date.now() - startTime,
        ipAddress: req.ip
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while extracting business card data',
      error: error.message,
      suggestion: 'Please try again or use manual entry.'
    });
  }
};