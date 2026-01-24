import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';

export const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );

  return { accessToken, refreshToken };
};

export const hashPassword = async (password) => {
  return bcryptjs.hash(password, 10);
};

export const verifyPassword = async (password, hash) => {
  return bcryptjs.compare(password, hash);
};

export const formatResponse = (success, data, error = null) => ({
  success,
  data,
  error,
  timestamp: new Date().toISOString(),
});
