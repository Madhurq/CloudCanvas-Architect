import express from 'express';
import {
  getMarketplaceListings,
  getMarketplaceListing,
  publishToMarketplace,
  updateMarketplaceListing,
  deleteMarketplaceListing,
  purchaseFromMarketplace,
  addReview,
  getMyListings,
} from '../controllers/marketplaceController.js';
import { authMiddleware } from '../middleware/middleware.js';

const router = express.Router();

// Public routes
router.get('/', getMarketplaceListings);
router.get('/:id', getMarketplaceListing);

// Protected routes
router.post('/publish', authMiddleware, publishToMarketplace);
router.put('/:id', authMiddleware, updateMarketplaceListing);
router.delete('/:id', authMiddleware, deleteMarketplaceListing);
router.post('/:id/purchase', authMiddleware, purchaseFromMarketplace);
router.post('/:id/review', authMiddleware, addReview);
router.get('/my/listings', authMiddleware, getMyListings);

export default router;
