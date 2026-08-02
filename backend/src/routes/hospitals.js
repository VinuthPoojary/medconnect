import { Router } from 'express';
import { getHospitals, approveHospital, deleteHospital } from '../controllers/hospitalController.js';

const router = Router();

router.get('/', getHospitals);
router.patch('/:id/approve', approveHospital);
router.delete('/:id', deleteHospital);

export default router;
