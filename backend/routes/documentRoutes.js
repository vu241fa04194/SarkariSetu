import express from 'express';
import {
  uploadDocument,
  getMyDocuments,
  downloadDocument,
  deleteDocument,
} from '../controllers/documentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { handleDocumentUpload } from '../middleware/uploadMiddleware.js';
import { uploadLimiter } from '../middleware/securityMiddleware.js';

const router = express.Router();

// Enforce authentication on all document endpoints
router.use(protect);

router
  .route('/')
  .get(getMyDocuments)
  .post(uploadLimiter, handleDocumentUpload(), uploadDocument);

router
  .route('/upload')
  .post(uploadLimiter, handleDocumentUpload(), uploadDocument);

router
  .route('/:id/download')
  .get(downloadDocument);

router
  .route('/:id')
  .delete(deleteDocument);

export default router;
