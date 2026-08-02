import { Router } from 'express';
import { getDoctors, createDoctor, deleteDoctor } from '../controllers/doctorController.js';

const router = Router();

router.get('/', getDoctors);
router.post('/', createDoctor);
router.delete('/:id', deleteDoctor);

export default router;
