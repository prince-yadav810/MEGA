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

// Get quotations by client name
export const getQuotationsByClient = async (clientName) => {
  try {
    const response = await api.get('/quotations', {
      params: { clientName }
    });
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
export const uploadExcel = async (file, advertisementProducts = [], onUploadProgress) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (advertisementProducts && advertisementProducts.length > 0) {
      formData.append('advertisementProducts', JSON.stringify(advertisementProducts));
    }

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

// Download quotation PDF
export const downloadPdf = async (id, fileName) => {
  try {
    // First check if it's an external URL (Cloudinary)
    const checkResponse = await api.get(`/quotations/${id}/download`);

    if (checkResponse.data.isExternal) {
      // For Cloudinary URLs, open in new tab or download directly
      const link = document.createElement('a');
      link.href = checkResponse.data.downloadUrl;
      link.setAttribute('download', checkResponse.data.fileName || fileName || 'quotation.pdf');
      link.setAttribute('target', '_blank');
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
      return { success: true, message: 'PDF download started' };
    }

    // For local files, download as blob
    const response = await api.get(`/quotations/${id}/download`, {
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || 'quotation.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true, message: 'PDF downloaded successfully' };
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update quotation filename
export const updateFileName = async (id, fileName) => {
  try {
    const response = await api.patch(`/quotations/${id}/filename`, { fileName });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update quotation status with optional note
export const updateStatus = async (id, status, note = '') => {
  try {
    const response = await api.patch(`/quotations/${id}/status`, { status, note });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update quotation priority
export const updatePriority = async (id, priority) => {
  try {
    const response = await api.patch(`/quotations/${id}/priority`, { priority });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Create a task linked to quotation
export const createLinkedTask = async (id, taskData) => {
  try {
    const response = await api.post(`/quotations/${id}/task`, taskData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update advertisement products
export const updateAdvertisementProducts = async (id, productIds) => {
  try {
    const response = await api.put(`/quotations/${id}/advertisements`, { productIds });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Regenerate quotation PDF
export const regenerateQuotationPdf = async (id) => {
  try {
    const response = await api.post(`/quotations/${id}/regenerate-pdf`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get PDF preview URL (auto-regenerates if needed)
export const getPreviewUrl = async (id) => {
  try {
    const response = await api.get(`/quotations/${id}/preview`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const quotationService = {
  getQuotations,
  getQuotationsByClient,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  uploadExcel,
  downloadPdf,
  updateFileName,
  updateStatus,
  updatePriority,
  createLinkedTask,
  updateAdvertisementProducts,
  regenerateQuotationPdf,
  getPreviewUrl
};

export default quotationService;
