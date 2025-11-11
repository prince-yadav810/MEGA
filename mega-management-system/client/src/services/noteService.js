// File path: client/src/services/noteService.js

import api from './api';

const noteService = {
  // Get all notes
  getAllNotes: async () => {
    try {
      const response = await api.get('/notes');
      return response.data;
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  },

  // Create a new note
  createNote: async (noteData, files = null) => {
    try {
      if (files && files.length > 0) {
        const formData = new FormData();
        formData.append('heading', noteData.heading);
        formData.append('content', noteData.content);
        if (noteData.color) formData.append('color', noteData.color);
        
        // Append each file
        for (let i = 0; i < files.length; i++) {
          formData.append('attachments', files[i]);
        }
        
        const response = await api.post('/notes', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } else {
        const response = await api.post('/notes', noteData);
        return response.data;
      }
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  },

  // Update a note
  updateNote: async (noteId, noteData, files = null) => {
    try {
      if (files && files.length > 0) {
        const formData = new FormData();
        if (noteData.heading) formData.append('heading', noteData.heading);
        if (noteData.content) formData.append('content', noteData.content);
        if (noteData.color) formData.append('color', noteData.color);
        if (noteData.isPinned !== undefined) formData.append('isPinned', noteData.isPinned);
        
        // Append each file
        for (let i = 0; i < files.length; i++) {
          formData.append('attachments', files[i]);
        }
        
        const response = await api.put(`/notes/${noteId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } else {
        const response = await api.put(`/notes/${noteId}`, noteData);
        return response.data;
      }
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  },

  // Toggle pin status
  togglePin: async (noteId) => {
    try {
      const response = await api.patch(`/notes/${noteId}/toggle-pin`);
      return response.data;
    } catch (error) {
      console.error('Error toggling pin:', error);
      throw error;
    }
  },

  // Delete a note
  deleteNote: async (noteId) => {
    try {
      const response = await api.delete(`/notes/${noteId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  },

  // Delete an attachment
  deleteAttachment: async (noteId, attachmentId) => {
    try {
      const response = await api.delete(`/notes/${noteId}/attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting attachment:', error);
      throw error;
    }
  },

  // Rename an attachment
  renameAttachment: async (noteId, attachmentId, filename) => {
    try {
      const response = await api.patch(`/notes/${noteId}/attachments/${attachmentId}/rename`, { filename });
      return response.data;
    } catch (error) {
      console.error('Error renaming attachment:', error);
      throw error;
    }
  }
};

export default noteService;