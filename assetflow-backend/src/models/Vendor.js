import mongoose from 'mongoose';

const VendorSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		address: { type: String, default: '' },
		contactNumber: { type: String, default: '' },
		email: { type: String, default: '' },
	},
	{ timestamps: { createdAt: true, updatedAt: false } }
);

export const Vendor = mongoose.model('Vendor', VendorSchema);
