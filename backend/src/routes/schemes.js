import { Router } from 'express';
import { getHospitalSchemes, createHospitalScheme, deleteHospitalScheme } from '../controllers/schemeController.js';

const router = Router();

router.get('/', getHospitalSchemes);
router.post('/', createHospitalScheme);
router.delete('/:id', deleteHospitalScheme);

export default router;
