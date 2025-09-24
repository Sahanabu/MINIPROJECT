import mongoose from 'mongoose';
import { config } from './index.js';

export async function connectToDatabase() {
	if (!config.mongoUri) {
		throw new Error('MONGO_URI is not configured');
	}
	mongoose.set('strictQuery', true);
	await mongoose.connect(config.mongoUri, {
		serverSelectionTimeoutMS: 10000,
	});
}


