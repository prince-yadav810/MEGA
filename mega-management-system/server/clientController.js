const Client = require('../models/Client');

// @desc    Get all clients
// @route   GET /api/clients
exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}; 

// @desc    Create a new client
// @route   POST /api/clients
exports.createClient = async (req, res) => {
  try {
    const newClient = new Client(req.body);
    const savedClient = await newClient.save();
    res.status(201).json(savedClient);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create client', error: error.message });
  }
};

// @desc    Delete a client
// @route   DELETE /api/clients/:id
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    await client.deleteOne(); // Use deleteOne() instead of remove()
    res.status(200).json({ message: 'Client removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};