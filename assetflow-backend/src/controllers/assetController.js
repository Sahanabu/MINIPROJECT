import mongoose from 'mongoose';
import { Asset } from '../models/Asset.js';
import { Department } from '../models/Department.js';
import { assetCreateSchema, assetUpdateSchema, listQuerySchema } from '../validation/schemas.js';
import { persistFile } from '../utils/storage.js';

function computeTotals(asset) {
	const items = (asset.items || []).map((it) => ({
		...it,
		totalAmount: Number((Number(it.quantity || 0) * Number(it.pricePerItem || 0)).toFixed(2)),
	}));
	const grandTotal = items.reduce((sum, it) => sum + (it.totalAmount || 0), 0);
	return { items, grandTotal };
}

function parseMultipartToAsset(req) {
	// Two accepted formats:
	// A) payload (JSON string) + itemFiles[] (files)
	// B) Items and fields sent as separate fields (items[0], items[1], ...) and files in billFiles
	if (req.body.payload) {
		try {
			return JSON.parse(req.body.payload);
		} catch {
			throw Object.assign(new Error('Invalid payload JSON'), { status: 400 });
		}
	}
	// Format B
	const { type, departmentId, subcategory, academicYear, officer } = req.body;
	const items = [];
	// Collect fields like items[0], items[1] ... if present
	Object.keys(req.body)
		.filter((k) => k.startsWith('items['))
		.sort()
		.forEach((k) => {
			try {
				const obj = JSON.parse(req.body[k]);
				items.push(obj);
			} catch {
				// ignore non-JSON items
			}
		});
	return {
		type,
		departmentId,
		subcategory,
		academicYear,
		officer: officer ? JSON.parse(officer) : undefined,
		items,
	};
}

export async function createAsset(req, res, next) {
	try {
		const payload = parseMultipartToAsset(req);
		const { error, value } = assetCreateSchema.validate(payload);
		if (error) return res.status(400).json({ error: error.message });

		const dept = await Department.findById(value.departmentId);
		if (!dept) return res.status(400).json({ error: 'Invalid departmentId' });

		const filesArray = [
			...(req.files?.['itemFiles[]'] || []),
			...(req.files?.billFiles || []),
		];
		const items = await Promise.all(value.items.map(async (it, idx) => {
			const file = filesArray[idx];
			let billFileUrl = it.billFileUrl || '';
			if (file) {
				billFileUrl = await persistFile({ buffer: file.buffer, originalname: file.originalname, subdir: 'bills' });
			}
			return { ...it, billFileUrl };
		}));

		const totals = computeTotals({ ...value, items });
		const doc = await Asset.create({ ...value, items: totals.items, grandTotal: totals.grandTotal });
		res.status(201).json({ id: doc._id });
	} catch (err) {
		next(err);
	}
}

export async function listAssets(req, res, next) {
	try {
		const { error, value } = listQuerySchema.validate(req.query);
		if (error) return res.status(400).json({ error: error.message });
		const { page, limit, ...filters } = value;
		const query = {};
		if (filters.type) query.type = filters.type;
		if (filters.departmentId) query.departmentId = new mongoose.Types.ObjectId(filters.departmentId);
		if (filters.subcategory) query.subcategory = { $regex: filters.subcategory, $options: 'i' };
		if (filters.vendorName) query['items.vendorName'] = { $regex: filters.vendorName, $options: 'i' };
		if (filters.academicYear) query.academicYear = filters.academicYear;
		if (filters.search) {
			query.$or = [
				{ subcategory: { $regex: filters.search, $options: 'i' } },
				{ academicYear: { $regex: filters.search, $options: 'i' } },
				{ 'items.itemName': { $regex: filters.search, $options: 'i' } },
				{ 'items.vendorName': { $regex: filters.search, $options: 'i' } },
			];
		}
		const skip = (page - 1) * limit;
		const [items, total] = await Promise.all([
			Asset.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
			Asset.countDocuments(query),
		]);
		res.json({ data: items, page, limit, total, totalPages: Math.ceil(total / limit) });
	} catch (err) {
		next(err);
	}
}

export async function getAsset(req, res, next) {
	try {
		const doc = await Asset.findById(req.params.id);
		if (!doc) return res.status(404).json({ error: 'Asset not found' });
		res.json({ data: doc });
	} catch (err) {
		next(err);
	}
}

export async function updateAsset(req, res, next) {
	try {
		const { id } = req.params;
		const payload = req.body;
		const { error, value } = assetUpdateSchema.validate(payload);
		if (error) return res.status(400).json({ error: error.message });
		let data = { ...value };
		if (value.items) {
			const totals = computeTotals({ items: value.items });
			data.items = totals.items;
			data.grandTotal = totals.grandTotal;
		}
		const updated = await Asset.findByIdAndUpdate(id, data, { new: true });
		if (!updated) return res.status(404).json({ error: 'Asset not found' });
		res.json({ data: updated });
	} catch (err) {
		next(err);
	}
}

export async function deleteAsset(req, res, next) {
	try {
		const { id } = req.params;
		const deleted = await Asset.findByIdAndDelete(id);
		if (!deleted) return res.status(404).json({ error: 'Asset not found' });
		res.json({ success: true });
	} catch (err) {
		next(err);
	}
}



