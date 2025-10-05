const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'clients routes - coming soon' });
});

module.exports = router;
