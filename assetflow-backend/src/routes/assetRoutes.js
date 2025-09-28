import express from 'express';
import { createAsset, listAssets, getAsset, updateAsset, deleteAsset, getAssetsSummary, getAssetFile } from '../controllers/assetController.js';
import { uploadAssetFiles } from '../config/multer.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', verifyToken, uploadAssetFiles, createAsset);
router.get('/', listAssets);
// summary must be before :id to avoid route conflict
router.get('/summary/stats', getAssetsSummary);
router.get('/:id/file/:itemIndex', getAssetFile);
router.get('/:id', getAsset);
router.put('/:id', verifyToken, uploadAssetFiles, updateAsset);
router.delete('/:id', verifyToken, deleteAsset);

export default router;
