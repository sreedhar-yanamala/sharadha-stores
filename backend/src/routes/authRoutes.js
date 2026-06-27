import express from 'express';
import {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  verifyOTP,
  resendOTP,
  resetPassword,
  getUsers,
  logoutUser,
  heartbeatUser,
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', authUser);

// Password reset OTP flow
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/reset-password', resetPassword);

// Protected routes
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Session management
router.post('/logout',    protect, logoutUser);
router.post('/heartbeat', protect, heartbeatUser);

// Admin routes
router.route('/users').get(protect, admin, getUsers);

export default router;
