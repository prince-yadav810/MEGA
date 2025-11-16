import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const getClients = async () => {
  try {
    const response = await axios.get(`${API_URL}/clients`);
    return response.data;
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

const createClient = async (clientData) => {
  try {
    const response = await axios.post(`${API_URL}/clients`, clientData);
    return response.data;
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};

const deleteClient = async (clientId) => {
  try {
    const response = await axios.delete(`${API_URL}/clients/${clientId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting client ${clientId}:`, error);
    throw error;
  }
};

export { getClients, createClient, deleteClient };