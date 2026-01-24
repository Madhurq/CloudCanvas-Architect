import express from 'express';
import { getPricingData, syncPricingData } from '../controllers/pricingController.js';
import { authMiddleware } from '../middleware/middleware.js';

const router = express.Router();

router.get('/', getPricingData);
router.post('/sync', authMiddleware, syncPricingData); // Admin only in future

export default router;
