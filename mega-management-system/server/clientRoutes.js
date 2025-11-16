const express = require('express');
const router = express.Router();
const {
  getClients,
  createClient,
  deleteClient,
} = require('../controllers/clientController');

router.route('/').get(getClients).post(createClient);
router.route('/:id').delete(deleteClient);

module.exports = router;