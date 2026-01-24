import express from 'express';
import {
  createArchitecture,
  getArchitectures,
  getArchitecture,
  updateArchitecture,
  deleteArchitecture,
} from '../controllers/architectureController.js';
import { authMiddleware } from '../middleware/middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createArchitecture);
router.get('/', getArchitectures);
router.get('/:id', getArchitecture);
router.put('/:id', updateArchitecture);
router.delete('/:id', deleteArchitecture);

export default router;
