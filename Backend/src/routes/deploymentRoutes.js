import express from 'express';
import {
  createDeployment,
  getDeployment,
  getDeploymentsByArchitecture,
  checkDeploymentStatus,
  deleteDeployment,
  previewTemplate,
} from '../controllers/deploymentController.js';
import { authMiddleware } from '../middleware/middleware.js';

const router = express.Router();

router.use(authMiddleware);

// Template preview (must come before /:id to avoid route conflict)
router.get('/preview/:architectureId', previewTemplate);

// Deployment CRUD
router.post('/', createDeployment);
router.get('/:id', getDeployment);
router.get('/:id/status', checkDeploymentStatus);
router.get('/architecture/:architectureId', getDeploymentsByArchitecture);
router.delete('/:id', deleteDeployment);

export default router;
