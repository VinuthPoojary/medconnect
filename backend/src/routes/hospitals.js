import { Router } from 'express';
import { getHospitals, approveHospital, deleteHospital } from '../controllers/hospitalController.js';
import {
  getHospitalDashboardMetrics,
  getHospitalDoctors,
  addDoctorByHospital,
  updateDoctorByHospital,
  deleteDoctorByHospital,
  getHospitalAppointments,
  getHospitalPatients,
  getHospitalDocuments,
  uploadHospitalDocument,
  updateHospitalDocument,
  deleteHospitalDocument,
  getHospitalPublicDocuments,
} from '../controllers/hospitalManagementController.js';
import { requireHospitalAuth } from '../middleware/auth.js';

const router = Router();

// Public hospital directory & public documents
router.get('/', getHospitals);
router.get('/:id/documents', getHospitalPublicDocuments);
router.get('/:id/public-documents', getHospitalPublicDocuments);

// Admin-level hospital actions
router.patch('/:id/approve', approveHospital);
router.delete('/:id', deleteHospital);

// Authenticated Hospital Management Endpoints (Strictly scoped to req.hospitalId from JWT)
router.get('/dashboard-metrics', requireHospitalAuth, getHospitalDashboardMetrics);
router.get('/metrics', requireHospitalAuth, getHospitalDashboardMetrics);

// Doctors Management
router.get('/doctors', requireHospitalAuth, getHospitalDoctors);
router.post('/doctors', requireHospitalAuth, addDoctorByHospital);
router.put('/doctors/:id', requireHospitalAuth, updateDoctorByHospital);
router.delete('/doctors/:id', requireHospitalAuth, deleteDoctorByHospital);

// Appointments Queue
router.get('/appointments', requireHospitalAuth, getHospitalAppointments);

// Patients Directory
router.get('/patients', requireHospitalAuth, getHospitalPatients);

// Documents Management (PDF upload, versioning, index, replace, delete)
router.get('/documents', requireHospitalAuth, getHospitalDocuments);
router.post('/documents', requireHospitalAuth, uploadHospitalDocument);
router.put('/documents/:id', requireHospitalAuth, updateHospitalDocument);
router.delete('/documents/:id', requireHospitalAuth, deleteHospitalDocument);

export default router;
