import fs from 'fs';
import path from 'path';
import sanitize from 'sanitize-filename';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config, isS3Enabled } from '../config/index.js';
import dayjs from 'dayjs';

let s3Client = null;
if (isS3Enabled()) {
	s3Client = new S3Client({
		region: config.s3.region,
		credentials: {
			accessKeyId: config.s3.accessKeyId,
			secretAccessKey: config.s3.secretAccessKey,
		},
	});
}

export function ensureDirSync(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

export function getYearSubdir(date = new Date()) {
	return String(dayjs(date).year());
}

export async function saveBufferLocal(buffer, originalName, subdir = '') {
	const safe = sanitize(originalName).replace(/\s+/g, '_');
	const yearDir = path.join(config.uploadDir, getYearSubdir());
	const fullDir = path.join(yearDir, subdir || '');
	ensureDirSync(fullDir);
	const fileName = `${Date.now()}_${safe}`;
	const filePath = path.join(fullDir, fileName);
	await fs.promises.writeFile(filePath, buffer);
	// Public URL under /uploads
	const relPath = path.relative(config.uploadDir, filePath).replace(/\\/g, '/');
	return `/uploads/${relPath}`;
}

export async function uploadBufferS3(buffer, originalName, subdir = '') {
	if (!s3Client) throw new Error('S3 is not enabled');
	const safe = sanitize(originalName).replace(/\s+/g, '_');
	const key = `${getYearSubdir()}/${subdir ? subdir + '/' : ''}${Date.now()}_${safe}`;
	await s3Client.send(new PutObjectCommand({
		Bucket: config.s3.bucket,
		Key: key,
		Body: buffer,
		ContentType: undefined,
	}));
	if (config.s3.publicBaseUrl) {
		return `${config.s3.publicBaseUrl.replace(/\/$/, '')}/${key}`;
	}
	return `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${key}`;
}

export async function persistFile({ buffer, originalname, subdir = '' }) {
	if (isS3Enabled()) {
		return uploadBufferS3(buffer, originalname, subdir);
	}
	return saveBufferLocal(buffer, originalname, subdir);
}
