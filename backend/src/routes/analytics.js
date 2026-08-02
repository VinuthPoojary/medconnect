import { Router } from 'express';
import { getHospitalAnalytics, getAdminAnalytics } from '../controllers/analyticsController.js';

const router = Router();

router.get('/hospital', getHospitalAnalytics);
router.get('/admin', getAdminAnalytics);

export default router;
