import { Router } from 'express';
import multer from 'multer';
import {
  getReports,
  createReport,
  analyzeReport,
  getReportSignedUrl,
  getSecureFileStream,
  reanalyzeReport,
  deleteReport,
} from '../controllers/reportController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max limit
});

const router = Router();

router.get('/', getReports);
router.post('/', createReport);
router.post('/analyze', upload.single('file'), analyzeReport);
router.post('/upload', upload.single('file'), analyzeReport);
router.get('/secure-file', getSecureFileStream);
router.get('/:id/signed-url', getReportSignedUrl);
router.post('/:id/reanalyze', reanalyzeReport);
router.delete('/:id', deleteReport);

export default router;
