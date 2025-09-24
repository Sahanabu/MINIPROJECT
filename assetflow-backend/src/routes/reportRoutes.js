import express from 'express';
import { getReport, exportReport } from '../controllers/reportController.js';

const router = express.Router();

router.get('/', getReport);
router.get('/export', exportReport);

export default router;


