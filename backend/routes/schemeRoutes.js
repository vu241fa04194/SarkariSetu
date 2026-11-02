import express from 'express';
import {
  getSchemes,
  getSchemeById,
  createScheme,
  updateScheme,
  deleteScheme,
  getFilterOptions,
  trackSchemeView,
} from '../controllers/schemeController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Metadata route for populating frontend filter dropdowns
router.get('/meta/filters', getFilterOptions);

// Standard CRUD endpoints for schemes
router.route('/')
  .get(getSchemes)
  .post(protect, requireAdmin, createScheme);

// View tracking endpoint
router.post('/:id/view', (req, res, next) => {
  // Optional auth: check if Authorization header is passed to link with citizen history
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
}, trackSchemeView);

router.route('/:id')
  .get(getSchemeById)
  .put(protect, requireAdmin, updateScheme)
  .delete(protect, requireAdmin, deleteScheme);

export default router;
