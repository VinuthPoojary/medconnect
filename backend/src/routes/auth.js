import { Router } from 'express';
import { register, login, sendOtp, otpLogin, getCurrentUser } from '../controllers/authController.js';
import { registerDoctor, loginDoctor } from '../controllers/authDoctorController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOtp);
router.post('/otp-login', otpLogin);

// Dedicated Doctor Auth Routes
router.post('/doctor/register', registerDoctor);
router.post('/doctor/login', loginDoctor);

router.get('/me', authenticateToken, getCurrentUser);

export default router;
