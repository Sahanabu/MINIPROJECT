import ExcelJS from 'exceljs';
import { buildGroupedReportWorkbook } from '../utils/excelExport.js';
import { buildGroupedReportDocxBuffer } from '../utils/wordExport.js';
import { Asset } from '../models/Asset.js';
import { Department } from '../models/Department.js';
import { reportQuerySchema } from '../validation/schemas.js';

function buildMatch(query) {
	const match = {};
	if (query.academicYear) match.academicYear = query.academicYear;
	if (query.departmentId) match.departmentId = query.departmentId;
	if (query.itemName) match['items.itemName'] = { $regex: query.itemName, $options: 'i' };
	if (query.vendorName) match['items.vendorName'] = { $regex: query.vendorName, $options: 'i' };
	return match;
}

export async function getReport(req, res, next) {
	try {
		const { error, value } = reportQuerySchema.validate(req.query);
		if (error) return res.status(400).json({ error: error.message });
		const groupBy = value.groupBy;
		const match = buildMatch(value);
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
		const results = await Asset.aggregate(pipeline);
		// If grouping by department, populate names
		if (groupBy === 'department') {
			const ids = results.map((r) => r._id).filter(Boolean);
			const deptMap = new Map((await Department.find({ _id: { $in: ids } })).map((d) => [String(d._id), d.name]));
			results.forEach((r) => { r.group = deptMap.get(String(r._id)) || 'Unknown'; });
		} else {
			results.forEach((r) => { r.group = r._id || 'Unknown'; });
		}
		const grandTotal = results.reduce((s, r) => s + (r.subtotal || 0), 0);
		res.json({ groupBy, groups: results.map(({ _id, rows, ...rest }) => rest), grandTotal });
	} catch (err) {
		next(err);
	}
}

export async function exportReport(req, res, next) {
	try {
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

		if (value.format === 'excel') {
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
