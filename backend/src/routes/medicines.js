import { Router } from 'express';
import { getMedicines, createMedicine, toggleMedicine, deleteMedicine } from '../controllers/medicineController.js';

const router = Router();

router.get('/', getMedicines);
router.post('/', createMedicine);
router.patch('/:id/toggle', toggleMedicine);
router.delete('/:id', deleteMedicine);

export default router;
