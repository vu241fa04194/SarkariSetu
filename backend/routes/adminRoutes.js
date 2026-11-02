import express from 'express';
import {
  getAdminStats,
  getAdminAnalytics,
  getAdminUsers,
  getAdminApplications,
  updateSchemeVerification,
  updateSchemeStatus,
  getAdminAuditLogs,
} from '../controllers/adminController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce authentication AND admin role on all /api/admin routes
router.use(protect, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/analytics', getAdminAnalytics);
router.get('/users', getAdminUsers);
router.get('/applications', getAdminApplications);
router.get('/audit-logs', getAdminAuditLogs);
router.put('/schemes/:id/verification', updateSchemeVerification);
router.put('/schemes/:id/status', updateSchemeStatus);

export default router;
