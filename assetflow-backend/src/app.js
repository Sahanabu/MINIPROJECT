import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
	const app = express();

	// CORS
	app.use(cors({
		origin: (origin, cb) => {
			// In development, allow any origin to ease local testing
			if (config.nodeEnv === 'development') {
				return cb(null, true);
			}
			if (!origin) return cb(null, true);
			if (config.allowedOrigins.length === 0 || config.allowedOrigins.includes(origin)) {
				return cb(null, true);
			}
			cb(new Error('Not allowed by CORS'));
		},
		credentials: true,
	}));

	// Security
	app.use(helmet());
	app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

	// Logging
	if (config.nodeEnv !== 'test') {
		app.use(morgan('combined'));
	}

	// Body parsers
	app.use(express.json({ limit: '5mb' }));
	app.use(express.urlencoded({ extended: true }));

	// Static files for uploaded content (local mode)
	app.use('/uploads', express.static(config.uploadDir));

	// Root info route to avoid "Cannot GET /"
	app.get('/', (_req, res) => {
		res.json({
			name: 'AssetFlow API',
			status: 'ok',
			health: '/health',
			apiBase: '/api',
		});
	});

	// Routes
	app.use('/api', apiRouter);

	// Health
	app.get('/health', (_req, res) => res.json({ status: 'ok' }));

	// Error handler
	app.use(errorHandler);

	return app;
}
