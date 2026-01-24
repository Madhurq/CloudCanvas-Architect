import express from 'express';
import { register, login, refreshToken, getProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.get('/profile', authMiddleware, getProfile);

export default router;
