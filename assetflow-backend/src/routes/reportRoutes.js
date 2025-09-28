import express from 'express';
import { generateReport, exportReport } from '../controllers/reportController.js';

const router = express.Router();

router.get('/', generateReport);
router.get('/export/:format', exportReport);

export default router;
