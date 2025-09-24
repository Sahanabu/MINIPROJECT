import mongoose from 'mongoose';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { connectToDatabase } from './config/db.js';

async function start() {
	try {
		if (!config.mongoUri) {
			throw new Error('MONGO_URI is required');
		}
		await connectToDatabase();
		const app = createApp();
		app.listen(config.port, () => {
			console.log(`🚀 Server ready on http://localhost:${config.port}`);
		});
	} catch (err) {
		console.error('Failed to start server:', err);
		process.exit(1);
	}
}

start();
