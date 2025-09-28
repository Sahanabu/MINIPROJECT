import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Department } from './src/models/Department.js';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

async function run() {
	const uri = process.env.MONGO_URI;
	if (!uri) {
		console.error('MONGO_URI is required');
		process.exit(1);
	}
	await mongoose.connect(uri);
	const dept = await Department.findOne({});
	console.log(dept._id.toString());
	await mongoose.disconnect();
	process.exit(0);
}

run().catch((e) => {
	console.error(e);
	process.exit(1);
});
