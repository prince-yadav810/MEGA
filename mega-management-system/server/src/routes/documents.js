// File Path: server/src/routes/documents.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllDocuments,
  uploadDocument,
  deleteDocument,
  renameDocument,
  updateDocumentVisibility
} = require('../controllers/documentController');

// All routes require authentication
router.use(protect);

// Get all documents (public + user's private)
router.get('/', getAllDocuments);

// Upload a new document
router.post('/', uploadDocument);

// Delete a document
router.delete('/:id', deleteDocument);

// Rename a document
router.put('/:id/rename', renameDocument);

// Update document visibility
router.put('/:id/visibility', updateDocumentVisibility);

module.exports = router;

