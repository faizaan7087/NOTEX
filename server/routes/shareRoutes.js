const express = require('express');
const router = express.Router();
const {
  createShareLink,
  getSharedRepo,
  cloneSharedRepo
} = require('../controllers/shareController');
const { protect } = require('../middleware/authMiddleware');

// Generate a new share link (requires login)
router.post('/create', protect, createShareLink);

// Preview a shared repo (open to anyone who has the link/code)
router.get('/:code', getSharedRepo);

// Clone a shared repo into account (requires login)
router.post('/clone/:code', protect, cloneSharedRepo);

module.exports = router;
