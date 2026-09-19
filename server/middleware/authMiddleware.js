const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from Bearer <token>
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const secret = process.env.JWT_SECRET || 'notex_super_secret_jwt_key_2026_academic_project';
      const decoded = jwt.verify(token, secret);

      // Fetch user from DB without password
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found or authorization token is invalid.'
        });
      }

      // Attach user object to request
      req.user = {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        semester: user.semester
      };

      next();
    } catch (error) {
      console.error('[Auth Middleware] Verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed verification or has expired.'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided in request header.'
    });
  }
};

module.exports = { protect };
