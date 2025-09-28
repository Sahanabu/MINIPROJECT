import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import { buildGroupedReportWorkbook } from '../utils/excelExport.js';
import { buildGroupedReportDocxBuffer } from '../utils/wordExport.js';
import { Asset } from '../models/Asset.js';
import { Department } from '../models/Department.js';
import { reportQuerySchema } from '../validation/schemas.js';

function buildMatch(query) {
	const match = {};
	if (query.academicYear && query.academicYear.trim() !== '') match.academicYear = { $regex: query.academicYear, $options: 'i' };
	if (query.departmentId && query.departmentId !== 'all' && query.departmentId.trim() !== '') match.departmentId = new mongoose.Types.ObjectId(query.departmentId);
	if (query.itemName && query.itemName.trim() !== '') match['items.itemName'] = { $regex: query.itemName, $options: 'i' };
	if (query.vendorName && query.vendorName.trim() !== '') match['items.vendorName'] = { $regex: query.vendorName, $options: 'i' };
	console.log('Built match:', match);
	return match;
}

export async function generateReport(req, res, next) {
	try {
		const { error, value } = reportQuerySchema.validate(req.query);
		if (error) return res.status(400).json({ error: error.message });
		console.log('Query params:', value);
		const groupBy = value.groupBy;
		const match = buildMatch(value);
		console.log('Match object:', match);
		const pipeline = [
			{ $match: match },
			{ $unwind: '$items' },
		];
		let groupId = null;
		if (groupBy === 'department') groupId = '$departmentId';
		if (groupBy === 'item') groupId = '$items.itemName';
		if (groupBy === 'vendor') groupId = '$items.vendorName';
		pipeline.push({
			$group: {
				_id: groupId,
				subtotal: { $sum: '$items.totalAmount' },
				count: { $sum: 1 },
				rows: { $push: '$$ROOT' },
			},
		});
		console.log('Pipeline:', JSON.stringify(pipeline, null, 2));
		const results = await Asset.aggregate(pipeline);
		console.log('Aggregation results:', results);
		// If grouping by department, populate names
		if (groupBy === 'department') {
			const ids = results.map((r) => r._id).filter(Boolean);
			const deptMap = new Map((await Department.find({ _id: { $in: ids } })).map((d) => [String(d._id), d.name]));
			results.forEach((r) => { r.group = deptMap.get(String(r._id)) || 'Unknown'; });
		} else {
			results.forEach((r) => { r.group = r._id || 'Unknown'; });
		}
		const grandTotal = results.reduce((s, r) => s + (r.subtotal || 0), 0);
		const data = results.map(({ _id, rows, ...rest }) => ({
			groupKey: rest.group,
			items: new Array(rest.count),
			subtotal: rest.subtotal
		}));
		console.log('Response data:', { data, grandTotal });
		res.json({ data, grandTotal });
	} catch (err) {
		next(err);
	}
}

export async function exportReport(req, res, next) {
	try {
		const { format } = req.params;
		if (!['excel', 'word'].includes(format)) return res.status(400).json({ error: 'Invalid format' });
		const { error, value } = reportQuerySchema.validate(req.query);
		if (error) return res.status(400).json({ error: error.message });
		const groupBy = value.groupBy;
		const match = buildMatch(value);
		const pipeline = [ { $match: match }, { $unwind: '$items' } ];
		let groupId = groupBy === 'department' ? '$departmentId' : groupBy === 'item' ? '$items.itemName' : '$items.vendorName';
		pipeline.push({
			$group: {
				_id: groupId,
				subtotal: { $sum: '$items.totalAmount' },
				count: { $sum: 1 },
			},
		});
		const rows = await Asset.aggregate(pipeline);
		let groups = rows;
		if (groupBy === 'department') {
			const ids = rows.map((r) => r._id).filter(Boolean);
			const deptMap = new Map((await Department.find({ _id: { $in: ids } })).map((d) => [String(d._id), d.name]));
			groups = rows.map((r) => ({ ...r, group: deptMap.get(String(r._id)) || 'Unknown' }));
		} else {
			groups = rows.map((r) => ({ ...r, group: r._id || 'Unknown' }));
		}
		const grandTotal = groups.reduce((s, r) => s + (r.subtotal || 0), 0);

		if (format === 'excel') {
			const workbook = await buildGroupedReportWorkbook({ title: `Report Grouped by ${groupBy}`, groups, grandTotal });
			res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
			res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');
			await workbook.xlsx.write(res);
			res.end();
			return;
		}

		// Default Word
		const buffer = await buildGroupedReportDocxBuffer({ title: `Report Grouped by ${groupBy}`, groups, grandTotal });
		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
		res.setHeader('Content-Disposition', 'attachment; filename="report.docx"');
		res.end(buffer);
	} catch (err) {
		next(err);
	}
}
