// File Path: server/src/controllers/clientController.js

const Client = require('../models/Client');
const PaymentReminder = require('../models/PaymentReminder');

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
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete clients'
      });
    }
    
    await client.deleteOne();
    
    // Emit socket notification
    if (req.io) {
      req.io.emit('client:deleted', {
        clientId: req.params.id,
        deletedBy: req.user
      });
    }
    
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