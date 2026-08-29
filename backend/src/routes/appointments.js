import { Router } from 'express';
import {
  getAppointments,
  createAppointment,
  getDoctorQueueStatus,
  cancelAppointment,
  getSlotCounts,
  getLiveQueue,
  updateAppointmentStatus,
} from '../controllers/appointmentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/slot-counts', getSlotCounts);
router.get('/live-queue', getLiveQueue);
router.get('/queue-status', getDoctorQueueStatus);
router.get('/', authenticateToken, getAppointments);
router.post('/', authenticateToken, createAppointment);
router.patch('/:id/status', updateAppointmentStatus);
router.patch('/:id/cancel', cancelAppointment);
router.delete('/:id', cancelAppointment);

export default router;
