import express from 'express';
import passport from '../config/passport.js';
import { register, login, googleAuthCallback, getCurrentUser } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no auth required)
router.post('/register', register);
router.post('/login', login);

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  googleAuthCallback
);

// Protected routes (auth required)
router.get('/me', verifyToken, getCurrentUser);

export default router;
