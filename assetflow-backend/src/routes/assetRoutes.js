import express from 'express';
import { createAsset, listAssets, getAsset, updateAsset, deleteAsset, getAssetsSummary } from '../controllers/assetController.js';
import { uploadAssetFiles } from '../config/multer.js';

const router = express.Router();

router.post('/', uploadAssetFiles, createAsset);
router.get('/', listAssets);
// summary must be before :id to avoid route conflict
router.get('/summary/stats', getAssetsSummary);
router.get('/:id', getAsset);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);

export default router;


