import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, unique: true, trim: true },
		type: { type: String, required: true, enum: ['major', 'academic', 'service'] },
	},
	{ timestamps: true }
);

export const Department = mongoose.model('Department', DepartmentSchema);
