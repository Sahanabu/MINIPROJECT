import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env if present
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
	dotenv.config({ path: envPath });
}

export const config = {
	port: parseInt(process.env.PORT || '4000', 10),
	nodeEnv: process.env.NODE_ENV || 'development',
	baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || '4000'}`,
	mongoUri: process.env.MONGO_URI || '',
	allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
	uploadDir: process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads'),
	maxFileBytes: (parseInt(process.env.MAX_FILE_MB || '10', 10)) * 1024 * 1024,
	allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'application/pdf,image/jpeg,image/png,image/jpg')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean),
	s3: {
		bucket: process.env.S3_BUCKET,
		region: process.env.S3_REGION,
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		publicBaseUrl: process.env.S3_PUBLIC_URL_BASE,
	},
};

export function isS3Enabled() {
	return Boolean(config.s3.bucket && config.s3.region && config.s3.accessKeyId && config.s3.secretAccessKey);
}
