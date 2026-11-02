import express from 'express';
import {
  getMyApplications,
  trackApplication,
  updateApplication,
  deleteApplication,
} from '../controllers/applicationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All application routes require authentication

router.route('/')
  .get(getMyApplications)
  .post(trackApplication);

router.post('/track', trackApplication);

router.route('/:id')
  .put(updateApplication)
  .delete(deleteApplication);

export default router;
