import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  saveScheme,
  removeSavedScheme,
  getSavedSchemes,
  getRecentlyViewedSchemes,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter, passwordResetLimiter } from '../middleware/securityMiddleware.js';

const router = express.Router();

// Authentication & Session Management (Rate-limited)
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/logout', logoutUser);

// Password Reset (Rate-limited & Secure Token Hashed)
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router
  .route('/reset-password/:token')
  .post(passwordResetLimiter, resetPassword)
  .put(passwordResetLimiter, resetPassword);

// Profile
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Recently Viewed Schemes
router.route('/recently-viewed').get(protect, getRecentlyViewedSchemes);

// Saved Schemes
router.route('/saved-schemes').get(protect, getSavedSchemes);
router
  .route('/saved-schemes/:schemeId')
  .post(protect, saveScheme)
  .delete(protect, removeSavedScheme);

export default router;
