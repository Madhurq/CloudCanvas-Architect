import express from 'express';
import {
  createDeployment,
  getDeployment,
  getDeploymentsByArchitecture,
  getDeploymentsForUser,
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
// Place architecture-scoped listing BEFORE generic :id route to avoid accidental matches
router.get('/architecture/:architectureId', getDeploymentsByArchitecture);
// User-scoped listing: all deployments for authenticated user
router.get('/user', getDeploymentsForUser);
router.get('/:id/status', checkDeploymentStatus);
router.get('/:id', getDeployment);
router.delete('/:id', deleteDeployment);

export default router;
