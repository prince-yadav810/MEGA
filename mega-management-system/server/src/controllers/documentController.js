// File Path: server/src/controllers/documentController.js

const Document = require('../models/Document');
const cloudinary = require('../config/cloudinary');

/**
 * @desc    Get all documents (public + user's private)
 * @route   GET /api/documents
 * @access  Private
 */
exports.getAllDocuments = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all public documents and user's private documents
    const documents = await Document.find({
      $or: [
        { visibility: 'public' },
        { uploadedBy: userId }
      ]
    })
      .sort({ uploadedAt: -1 })
      .populate('uploadedBy', 'name email');

    res.status(200).json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents',
      error: error.message
    });
  }
};

/**
 * @desc    Upload a new document
 * @route   POST /api/documents
 * @access  Private
 */
exports.uploadDocument = async (req, res) => {
  try {
    console.log('=== UPLOAD DOCUMENT REQUEST ===');
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    
    const { note, visibility } = req.body;

    if (!req.files || !req.files.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const file = req.files.file;
    const allowedTypes = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const fileExtension = file.name.split('.').pop().toLowerCase();

    // Validate file type
    if (!allowedTypes.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: `File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      });
    }

    // Validate file size
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File exceeds the maximum size of 10MB`
      });
    }

    // Upload to Cloudinary
    try {
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'mega/documents',
        resource_type: 'auto'
      });

      // Create document record
      const document = await Document.create({
        filename: file.name,
        originalName: file.name,
        url: result.secure_url,
        publicId: result.public_id,
        fileType: fileExtension,
        size: file.size,
        note: note || '',
        visibility: visibility || 'private',
        uploadedBy: req.user._id,
        uploadedByName: req.user.name
      });

      // Populate the uploadedBy field before sending response
      await document.populate('uploadedBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: document
      });
    } catch (uploadError) {
      console.error('Error uploading file to Cloudinary:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Error uploading file to cloud storage'
      });
    }
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a document
 * @route   DELETE /api/documents/:id
 * @access  Private
 */
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user is the owner or an admin
    const isOwner = document.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this document'
      });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(document.publicId);
    } catch (cloudinaryError) {
      console.error('Error deleting from Cloudinary:', cloudinaryError);
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Delete from database
    await Document.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
      error: error.message
    });
  }
};

/**
 * @desc    Rename a document
 * @route   PUT /api/documents/:id/rename
 * @access  Private
 */
exports.renameDocument = async (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename || !filename.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required'
      });
    }

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user is the owner or an admin
    const isOwner = document.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to rename this document'
      });
    }

    document.filename = filename.trim();
    await document.save();

    res.status(200).json({
      success: true,
      message: 'Document renamed successfully',
      data: document
    });
  } catch (error) {
    console.error('Rename document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error renaming document',
      error: error.message
    });
  }
};

/**
 * @desc    Update document visibility
 * @route   PUT /api/documents/:id/visibility
 * @access  Private
 */
exports.updateDocumentVisibility = async (req, res) => {
  try {
    const { visibility } = req.body;

    if (!visibility || !['private', 'public'].includes(visibility)) {
      return res.status(400).json({
        success: false,
        message: 'Valid visibility (private or public) is required'
      });
    }

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user is the owner or an admin
    const isOwner = document.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this document'
      });
    }

    document.visibility = visibility;
    await document.save();

    res.status(200).json({
      success: true,
      message: 'Document visibility updated successfully',
      data: document
    });
  } catch (error) {
    console.error('Update document visibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating document visibility',
      error: error.message
    });
  }
};

