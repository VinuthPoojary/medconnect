import { Router } from 'express';
import { getNotifications, markNotificationRead, deleteNotification } from '../controllers/notificationController.js';

const router = Router();

router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);
router.delete('/:id', deleteNotification);

export default router;
