import { Department } from '../models/Department.js';
import { departmentSchema } from '../validation/schemas.js';

export async function listDepartments(_req, res, next) {
	try {
		const docs = await Department.find().sort({ name: 1 });
		res.json({ data: docs });
	} catch (err) {
		next(err);
	}
}

export async function createDepartment(req, res, next) {
	try {
		const { error, value } = departmentSchema.validate(req.body);
		if (error) return res.status(400).json({ error: error.message });
		const exists = await Department.findOne({ name: value.name });
		if (exists) return res.status(409).json({ error: 'Department already exists' });
		const doc = await Department.create(value);
		res.status(201).json({ data: doc });
	} catch (err) {
		next(err);
	}
}

export async function updateDepartment(req, res, next) {
	try {
		const { id } = req.params;
		const { error, value } = departmentSchema.validate(req.body);
		if (error) return res.status(400).json({ error: error.message });
		const updated = await Department.findByIdAndUpdate(id, value, { new: true });
		if (!updated) return res.status(404).json({ error: 'Department not found' });
		res.json({ data: updated });
	} catch (err) {
		next(err);
	}
}

export async function deleteDepartment(req, res, next) {
	try {
		const { id } = req.params;
		const deleted = await Department.findByIdAndDelete(id);
		if (!deleted) return res.status(404).json({ error: 'Department not found' });
		res.json({ success: true });
	} catch (err) {
		next(err);
	}
}


