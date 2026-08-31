import { Router } from 'express';
import { checkSymptoms, getSymptomHistory, recommendDoctors, chatWithAi, queryHospitalRag } from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/symptoms', authenticateToken, checkSymptoms);
router.get('/symptom-history', authenticateToken, getSymptomHistory);
router.post('/recommend-doctors', recommendDoctors);
router.post('/chat', chatWithAi);
router.post('/hospital-rag', queryHospitalRag);

export default router;
