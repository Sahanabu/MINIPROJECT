import express from 'express';
import { listVendors, createVendor, updateVendor, deleteVendor } from '../controllers/vendorController.js';

const router = express.Router();

router.get('/', listVendors);
router.post('/', createVendor);
router.put('/:id', updateVendor);
router.delete('/:id', deleteVendor);

export default router;


