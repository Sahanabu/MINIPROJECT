import express from 'express';
import { register, login, getCurrentUser } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no auth required)
router.post('/register', register);
router.post('/login', login);

// Protected routes (auth required)
router.get('/me', verifyToken, getCurrentUser);

export default router;
