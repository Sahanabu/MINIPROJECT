import mongoose from 'mongoose';
import { Asset, getAssetModelByType } from '../models/Asset.js';
import { Department } from '../models/Department.js';
import { Upload } from '../models/Upload.js';
import { assetCreateSchema, assetUpdateSchema, listQuerySchema } from '../validation/schemas.js';

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
		const uploadIds = [];
		const items = await Promise.all(value.items.map(async (it, idx) => {
			const file = filesArray[idx];
			let billFileId = null;
			let billFileName = null;
			if (file) {
				const upload = new Upload({
					filename: file.originalname,
					contentType: file.mimetype,
					buffer: file.buffer,
					assetId: null,
					itemIndex: idx,
				});
				const savedUpload = await upload.save();
				billFileId = savedUpload._id;
				billFileName = file.originalname;
				uploadIds.push(savedUpload._id);
			}
			return { ...it, billFileId, billFileName };
		}));

		const totals = computeTotals({ ...value, items });
		const AssetModel = getAssetModelByType(value.type);
		const doc = await AssetModel.create({ ...value, items: totals.items, grandTotal: totals.grandTotal });

		// Update specific uploads with assetId
		if (uploadIds.length > 0) {
			await Upload.updateMany({ _id: { $in: uploadIds } }, { assetId: doc._id });
		}
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
		if (filters.departmentId) query.departmentId = new mongoose.Types.ObjectId(filters.departmentId);
		if (filters.subcategory) query.subcategory = { $regex: filters.subcategory, $options: 'i' };
		if (filters.vendorName) query['items.vendorName'] = { $regex: filters.vendorName, $options: 'i' };
		if (filters.academicYear) query.academicYear = filters.academicYear;
		if (filters.search) {
			query.$or = [
				{ subcategory: { $regex: filters.search, $options: 'i' } },
				{ academicYear: { $regex: filters.search, $options: 'i' } },
				{ 'items.itemName': { $regex: filters.search, $options: 'i' } },
				{ 'items.vendorName': { $regex: filters.vendorName, $options: 'i' } },
			];
		}
		const skip = (page - 1) * limit;

		const CapitalAsset = getAssetModelByType('capital');
		const RevenueAsset = getAssetModelByType('revenue');

		let items, total, totalPages;
		if (filters.type === 'capital') {
			items = await CapitalAsset.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
			total = await CapitalAsset.countDocuments(query);
		} else if (filters.type === 'revenue') {
			items = await RevenueAsset.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
			total = await RevenueAsset.countDocuments(query);
		} else {
			// No type filter, combine both
			const [capitalItems, capitalTotal, revenueItems, revenueTotal] = await Promise.all([
				CapitalAsset.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
				CapitalAsset.countDocuments(query),
				RevenueAsset.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
				RevenueAsset.countDocuments(query),
			]);
			items = [...capitalItems, ...revenueItems].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
			total = capitalTotal + revenueTotal;
		}
		totalPages = Math.ceil(total / limit);
		res.json({ data: items, page, limit, total, totalPages });
	} catch (err) {
		next(err);
	}
}

export async function getAsset(req, res, next) {
	try {
		const CapitalAsset = getAssetModelByType('capital');
		const RevenueAsset = getAssetModelByType('revenue');
		const doc = await CapitalAsset.findById(req.params.id) || await RevenueAsset.findById(req.params.id);
		if (!doc) return res.status(404).json({ error: 'Asset not found' });
		res.json({ data: doc });
	} catch (err) {
		next(err);
	}
}

export async function updateAsset(req, res, next) {
	try {
		const { id } = req.params;
		const payload = parseMultipartToAsset(req);
		const { error, value } = assetUpdateSchema.validate(payload);
		if (error) return res.status(400).json({ error: error.message });

		const CapitalAsset = getAssetModelByType('capital');
		const RevenueAsset = getAssetModelByType('revenue');
		const existing = await CapitalAsset.findById(id) || await RevenueAsset.findById(id);
		if (!existing) return res.status(404).json({ error: 'Asset not found' });

		const filesArray = [
			...(req.files?.['itemFiles[]'] || []),
			...(req.files?.billFiles || []),
		];

		// Handle file updates: delete old files and create new ones
		const items = await Promise.all(value.items.map(async (it, idx) => {
			const file = filesArray[idx];
			let billFileId = it.billFileId; // Keep existing if no new file
			let billFileName = it.billFileName;

			if (file) {
				// Delete old upload if exists
				if (it.billFileId) {
					await Upload.findByIdAndDelete(it.billFileId);
				}
				// Create new upload
				const upload = new Upload({
					filename: file.originalname,
					contentType: file.mimetype,
					buffer: file.buffer,
					assetId: id,
					itemIndex: idx,
				});
				const savedUpload = await upload.save();
				billFileId = savedUpload._id;
				billFileName = file.originalname;
			}
			return { ...it, billFileId, billFileName };
		}));

		const totals = computeTotals({ ...value, items });
		const Model = getAssetModelByType(existing.type);
		const updated = await Model.findByIdAndUpdate(id, { ...value, items: totals.items, grandTotal: totals.grandTotal }, { new: true });
		res.json({ data: updated });
	} catch (err) {
		next(err);
	}
}

export async function deleteAsset(req, res, next) {
	try {
		const { id } = req.params;
		const CapitalAsset = getAssetModelByType('capital');
		const RevenueAsset = getAssetModelByType('revenue');
		const existing = await CapitalAsset.findById(id) || await RevenueAsset.findById(id);
		if (!existing) return res.status(404).json({ error: 'Asset not found' });
		const Model = getAssetModelByType(existing.type);
		const deleted = await Model.findByIdAndDelete(id);

		// Delete associated uploads
		await Upload.deleteMany({ assetId: id });
		res.json({ success: true });
	} catch (err) {
		next(err);
	}
}

export async function getAssetsSummary(_req, res, next) {
	try {
		const CapitalAsset = getAssetModelByType('capital');
		const RevenueAsset = getAssetModelByType('revenue');
		const [capitalCount, capitalSum, revenueCount, revenueSum] = await Promise.all([
			CapitalAsset.countDocuments(),
			CapitalAsset.aggregate([{ $group: { _id: null, total: { $sum: '$grandTotal' } } }]),
			RevenueAsset.countDocuments(),
			RevenueAsset.aggregate([{ $group: { _id: null, total: { $sum: '$grandTotal' } } }]),
		]);
		const toNumber = (arr) => (arr && arr[0] ? arr[0].total : 0);
		const totalAssets = capitalCount + revenueCount;
		const totalValue = toNumber(capitalSum) + toNumber(revenueSum);
		res.json({ data: { totalAssets, totalValue, byType: { capital: { count: capitalCount, value: toNumber(capitalSum) }, revenue: { count: revenueCount, value: toNumber(revenueSum) } } } });
	} catch (err) {
		next(err);
	}
}

export async function getAssetFile(req, res, next) {
	try {
		const { id, itemIndex } = req.params;
		const idx = parseInt(itemIndex, 10);
		if (isNaN(idx)) return res.status(400).json({ error: 'Invalid item index' });

		const upload = await Upload.findOne({ assetId: id, itemIndex: idx });
		if (!upload) return res.status(404).json({ error: 'File not found' });

		const download = req.query.download === 'true';
		res.setHeader('Content-Type', upload.contentType);
		res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${upload.filename}"`);
		res.send(upload.buffer);
	} catch (err) {
		next(err);
	}
}
