const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleLoginUser, updateUserProfile, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public endpoints
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLoginUser);

// Protected endpoints
router.get('/me', protect, getMe);
router.put('/profile', protect, updateUserProfile);

module.exports = router;
