import multer from 'multer';
import { config } from './index.js';

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
	const allowed = new Set(config.allowedFileTypes);
	if (!allowed.has(file.mimetype)) {
		return cb(new Error('Invalid file type'));
	}
	if (file.originalname.includes('/') || file.originalname.includes('\\')) {
		return cb(new Error('Invalid filename'));
	}
	cb(null, true);
}

export const upload = multer({
	storage,
	limits: { fileSize: config.maxFileBytes },
	fileFilter,
});

export const uploadAssetFiles = upload.fields([
	{ name: 'itemFiles[]', maxCount: 100 },
	{ name: 'billFiles', maxCount: 100 },
]);


