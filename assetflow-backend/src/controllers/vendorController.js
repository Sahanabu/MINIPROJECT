import Joi from 'joi';
import { listVendorsService, createVendorService, updateVendorService, deleteVendorService } from '../services/vendorService.js';

const vendorSchema = Joi.object({
	name: Joi.string().required(),
	email: Joi.string().email().required(),
	contactNumber: Joi.string().allow(''),
	address: Joi.string().allow(''),
});

export async function listVendors(_req, res, next) {
	try {
		const docs = await listVendorsService();
		res.json({ data: docs });
	} catch (err) {
		next(err);
	}
}

export async function createVendor(req, res, next) {
	try {
		const { error, value } = vendorSchema.validate(req.body);
		if (error) return res.status(400).json({ error: error.message });
		const doc = await createVendorService(value);
		res.status(201).json({ data: doc });
	} catch (err) {
		next(err);
	}
}

export async function updateVendor(req, res, next) {
	try {
		const { id } = req.params;
		const { error, value } = vendorSchema.validate(req.body);
		if (error) return res.status(400).json({ error: error.message });
		const doc = await updateVendorService(id, value);
		res.json({ data: doc });
	} catch (err) {
		next(err);
	}
}

export async function deleteVendor(req, res, next) {
	try {
		const { id } = req.params;
		const resp = await deleteVendorService(id);
		res.json(resp);
	} catch (err) {
		next(err);
	}
}


