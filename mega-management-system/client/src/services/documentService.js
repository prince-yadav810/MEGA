// File Path: client/src/services/documentService.js

import api from './api';

const documentService = {
  // Get all documents (public + user's private)
  getAllDocuments: async () => {
    try {
      const response = await api.get('/documents');
      return response.data;
    } catch (error) {
      console.error('Get documents error:', error);
      throw error;
    }
  },

  // Upload a new document
  uploadDocument: async (file, note = '', visibility = 'private') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('note', note);
      formData.append('visibility', visibility);

      const response = await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Upload document error:', error);
      throw error;
    }
  },

  // Delete a document
  deleteDocument: async (documentId) => {
    try {
      const response = await api.delete(`/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Delete document error:', error);
      throw error;
    }
  },

  // Rename a document
  renameDocument: async (documentId, filename) => {
    try {
      const response = await api.put(`/documents/${documentId}/rename`, { filename });
      return response.data;
    } catch (error) {
      console.error('Rename document error:', error);
      throw error;
    }
  },

  // Update document visibility
  updateDocumentVisibility: async (documentId, visibility) => {
    try {
      const response = await api.put(`/documents/${documentId}/visibility`, { visibility });
      return response.data;
    } catch (error) {
      console.error('Update document visibility error:', error);
      throw error;
    }
  }
};

export default documentService;

