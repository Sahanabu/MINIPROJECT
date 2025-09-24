import express from 'express';
import { createAsset, listAssets, getAsset, updateAsset, deleteAsset } from '../controllers/assetController.js';
import { uploadAssetFiles } from '../config/multer.js';

const router = express.Router();

router.post('/', uploadAssetFiles, createAsset);
router.get('/', listAssets);
router.get('/:id', getAsset);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);

export default router;


