import { Router } from 'express';
import { checkSymptoms, recommendDoctors, chatWithAi, queryHospitalRag } from '../controllers/aiController.js';

const router = Router();

router.post('/symptoms', checkSymptoms);
router.post('/recommend-doctors', recommendDoctors);
router.post('/chat', chatWithAi);
router.post('/hospital-rag', queryHospitalRag);

export default router;
