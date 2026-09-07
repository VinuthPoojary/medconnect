import express from 'express';
import jwt from 'jsonwebtoken';
import { getDoctors, createDoctor, deleteDoctor } from '../controllers/doctorController.js';
import {
  createDoctorByHospital,
  getDoctorMe,
  getDoctorAppointmentsToday,
  getDoctorOverview,
  getDoctorQueueDashboard,
  updateQueueStatus,
  getDoctorAppointments,
  getDoctorPatients,
  getDoctorReports,
  getDoctorPrescriptions,
  createDoctorPrescription,
  getDoctorProfile,
} from '../controllers/doctorDashboardController.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'medconnect_karavali_super_secret_jwt_key_2026';

// Middleware: Authenticate Doctor JWT strictly (No dummy fallback)
const requireDoctorAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Doctor authentication token required. Please sign in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired authentication token. Please sign in again.' });
    }
    req.user = decoded;
    next();
  });
};

// ==========================================
// 1. Doctor Profile & Identity
// ==========================================
router.get('/me', requireDoctorAuth, getDoctorMe);
router.get('/profile', requireDoctorAuth, getDoctorProfile);

// ==========================================
// 2. Doctor Dashboard & Queue Management
// ==========================================
router.get('/queue-dashboard', requireDoctorAuth, getDoctorQueueDashboard);
router.post('/update-queue-status', requireDoctorAuth, updateQueueStatus);
router.patch('/queue/status', requireDoctorAuth, updateQueueStatus);
router.get('/overview', requireDoctorAuth, getDoctorOverview);

// ==========================================
// 3. Appointments & Patient Management
// ==========================================
router.get('/appointments', requireDoctorAuth, getDoctorAppointments);
router.get('/appointments/today', requireDoctorAuth, getDoctorAppointmentsToday);
router.get('/patients', requireDoctorAuth, getDoctorPatients);
router.get('/reports', requireDoctorAuth, getDoctorReports);
router.get('/prescriptions', requireDoctorAuth, getDoctorPrescriptions);
router.post('/prescriptions', requireDoctorAuth, createDoctorPrescription);

// ==========================================
// 4. Doctor Administration / Hospital Addition
// ==========================================
router.post('/hospital/add-doctor', requireDoctorAuth, createDoctorByHospital);

// ==========================================
// 5. Public / Directory Doctor Endpoints
// ==========================================
router.get('/', getDoctors);
router.post('/', createDoctor);
router.delete('/:id', deleteDoctor);

export default router;
