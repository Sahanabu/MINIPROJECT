import ExcelJS from 'exceljs';

export async function buildGroupedReportWorkbook({ title, groups, grandTotal }) {
	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet('Report');
	sheet.addRow([title]);
	sheet.addRow([]);
	sheet.addRow(['Group', 'Count', 'Subtotal']);
	groups.forEach((g) => sheet.addRow([g.group, g.count, g.subtotal]));
	sheet.addRow([]);
	sheet.addRow(['Grand Total', '', grandTotal]);
	return workbook;
}


