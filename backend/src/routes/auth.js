import { Router } from 'express';
import { register, login, otpLogin, getCurrentUser } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/otp-login', otpLogin);
router.get('/me', authenticateToken, getCurrentUser);

export default router;
