const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'notifications routes - coming soon' });
});

module.exports = router;
