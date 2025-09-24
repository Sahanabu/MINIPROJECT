import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Department } from './src/models/Department.js';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const departments = [
	{ name: 'Department of Civil Engineering', type: 'major' },
	{ name: 'Department of Computer Science and Engineering (CSE)', type: 'major' },
	{ name: 'Department of Electronics and Communication Engineering (ECE)', type: 'major' },
	{ name: 'Department of Electrical and Electronics Engineering (EEE)', type: 'major' },
	{ name: 'Department of Information Science and Engineering (ISE)', type: 'major' },
	{ name: 'Department of Mechanical Engineering', type: 'major' },
	{ name: 'Department of Artificial Intelligence and Machine Learning (AIML, under CSE)', type: 'major' },
	{ name: 'Department of First Year Engineering', type: 'academic' },
	{ name: 'Department of Chemistry', type: 'academic' },
	{ name: 'Department of Physics', type: 'academic' },
	{ name: 'Department of Mathematics', type: 'academic' },
	{ name: 'Department of Electrical Maintenance', type: 'service' },
	{ name: 'Department of Civil Maintenance', type: 'service' },
	{ name: 'Office Administration', type: 'service' },
	{ name: 'Central Library', type: 'service' },
	{ name: 'Department of Sports and Physical Education', type: 'service' },
	{ name: 'Boys’ Hostel Administration', type: 'service' },
	{ name: 'Girls’ Hostel Administration', type: 'service' },
];

async function run() {
	const uri = process.env.MONGO_URI;
	if (!uri) {
		console.error('MONGO_URI is required');
		process.exit(1);
	}
	await mongoose.connect(uri);
	await Department.deleteMany({});
	await Department.insertMany(departments);
	await mongoose.disconnect();
	console.log('✅ Departments seeded successfully');
	process.exit(0);
}

run().catch((e) => {
	console.error(e);
	process.exit(1);
});
