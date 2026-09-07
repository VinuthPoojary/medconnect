import express from 'express';
import { loginHospital, getHospitalProfile } from '../controllers/authHospitalController.js';
import { requireHospitalAuth } from '../middleware/auth.js';

const router = express.Router();

// Dedicated hospital authentication endpoints
router.post('/login', loginHospital);
router.get('/me', requireHospitalAuth, getHospitalProfile);
router.get('/profile', requireHospitalAuth, getHospitalProfile);

export default router;
