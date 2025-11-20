const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { logCall, getClientLogs } = require('../controllers/callLogController');

// All routes are protected
router.use(protect);

router.post('/', restrictTo('admin', 'sales'), logCall);
router.get('/:clientId', restrictTo('admin', 'sales'), getClientLogs);

module.exports = router;

