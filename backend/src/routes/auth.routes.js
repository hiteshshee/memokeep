import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register, verifyOtp, resendOtp, login, refresh, logout, me,
  updateProfile, changePassword,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Throttle auth attempts to slow brute force.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
});

router.post('/register', authLimiter, register);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/resend-otp', authLimiter, resendOtp);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, me);
router.patch('/profile', protect, updateProfile);
router.patch('/password', protect, changePassword);

export default router;
