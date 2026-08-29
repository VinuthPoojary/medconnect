import express from 'express';
import jwt from 'jsonwebtoken';
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

// Doctor Profile & Identity Route
router.get('/me', requireDoctorAuth, getDoctorMe);

// Hospital / Admin: Add Doctor
router.post('/hospital/add-doctor', requireDoctorAuth, createDoctorByHospital);

// Doctor Dashboard Routes (Strictly Isolated by Verified JWT req.user.id)
router.get('/queue-dashboard', requireDoctorAuth, getDoctorQueueDashboard);
router.post('/update-queue-status', requireDoctorAuth, updateQueueStatus);
router.patch('/queue/status', requireDoctorAuth, updateQueueStatus);
router.get('/overview', requireDoctorAuth, getDoctorOverview);
router.get('/appointments', requireDoctorAuth, getDoctorAppointments);
router.get('/appointments/today', requireDoctorAuth, getDoctorAppointmentsToday);
router.get('/patients', requireDoctorAuth, getDoctorPatients);
router.get('/reports', requireDoctorAuth, getDoctorReports);
router.get('/prescriptions', requireDoctorAuth, getDoctorPrescriptions);
router.post('/prescriptions', requireDoctorAuth, createDoctorPrescription);
router.get('/profile', requireDoctorAuth, getDoctorProfile);

export default router;
