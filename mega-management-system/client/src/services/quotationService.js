import api from './api';

// Get all quotations
export const getQuotations = async () => {
  try {
    const response = await api.get('/quotations');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get single quotation
export const getQuotation = async (id) => {
  try {
    const response = await api.get(`/quotations/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Create quotation
export const createQuotation = async (quotationData) => {
  try {
    const response = await api.post('/quotations', quotationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update quotation
export const updateQuotation = async (id, quotationData) => {
  try {
    const response = await api.put(`/quotations/${id}`, quotationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete quotation
export const deleteQuotation = async (id) => {
  try {
    const response = await api.delete(`/quotations/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Upload Excel file
export const uploadExcel = async (file, onUploadProgress) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/quotations/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onUploadProgress
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export default {
  getQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  uploadExcel
};
