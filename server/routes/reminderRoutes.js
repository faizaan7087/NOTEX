const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder
} = require('../controllers/reminderController');

// All reminder routes require authentication
router.use(protect);

router.route('/')
  .get(getReminders)
  .post(createReminder);

router.route('/:id')
  .put(updateReminder)
  .delete(deleteReminder);

module.exports = router;
