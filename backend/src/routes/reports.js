import { Router } from 'express';
import { getReports, createReport, deleteReport } from '../controllers/reportController.js';

const router = Router();

router.get('/', getReports);
router.post('/', createReport);
router.delete('/:id', deleteReport);

export default router;
