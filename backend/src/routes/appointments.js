import { Router } from 'express';
import { getAppointments, createAppointment, getDoctorQueueStatus, cancelAppointment } from '../controllers/appointmentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/queue-status', getDoctorQueueStatus);
router.get('/', authenticateToken, getAppointments);
router.post('/', authenticateToken, createAppointment);
router.patch('/:id/cancel', cancelAppointment);
router.delete('/:id', cancelAppointment);

export default router;
