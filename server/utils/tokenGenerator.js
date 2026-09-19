const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'notex_super_secret_jwt_key_2026_academic_project';
  const expiresIn = process.env.JWT_EXPIRE || '30d';
  
  return jwt.sign({ id }, secret, {
    expiresIn
  });
};

module.exports = generateToken;
