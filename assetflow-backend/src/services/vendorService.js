import { Vendor } from '../models/Vendor.js';

export async function listVendorsService() {
	return Vendor.find().sort({ name: 1 });
}

export async function createVendorService(data) {
	const exists = await Vendor.findOne({ email: data.email });
	if (exists) throw Object.assign(new Error('Vendor already exists'), { status: 409 });
	return Vendor.create(data);
}

export async function updateVendorService(id, data) {
	const updated = await Vendor.findByIdAndUpdate(id, data, { new: true });
	if (!updated) throw Object.assign(new Error('Vendor not found'), { status: 404 });
	return updated;
}

export async function deleteVendorService(id) {
	const deleted = await Vendor.findByIdAndDelete(id);
	if (!deleted) throw Object.assign(new Error('Vendor not found'), { status: 404 });
	return { success: true };
}


