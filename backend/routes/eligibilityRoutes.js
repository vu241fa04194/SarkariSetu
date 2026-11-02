import express from 'express';
import {
  checkEligibility,
  getRecommendations,
} from '../controllers/eligibilityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/eligibility/check - Can be used by anyone or prefilled by client
router.post('/check', checkEligibility);

// GET /api/eligibility/recommendations - Personalized recommendations for logged in user
router.get('/recommendations', protect, getRecommendations);

export default router;
