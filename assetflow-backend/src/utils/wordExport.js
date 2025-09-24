import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType } from 'docx';

export async function buildGroupedReportDocxBuffer({ title, groups, grandTotal }) {
	const doc = new Document({
		sections: [
			{
				children: [
					new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 28 })] }),
					new Paragraph({ text: '\n' }),
					new Table({
						alignment: AlignmentType.CENTER,
						rows: [
							new TableRow({
								children: [
									new TableCell({ children: [new Paragraph('Group')] }),
									new TableCell({ children: [new Paragraph('Count')] }),
									new TableCell({ children: [new Paragraph('Subtotal')] }),
								],
							}),
							...groups.map((g) => new TableRow({
								children: [
									new TableCell({ children: [new Paragraph(String(g.group))] }),
									new TableCell({ children: [new Paragraph(String(g.count))] }),
									new TableCell({ children: [new Paragraph(String(g.subtotal))] }),
								],
							})),
							new TableRow({
								children: [
									new TableCell({ children: [new Paragraph('Grand Total')] }),
									new TableCell({ children: [new Paragraph('')] }),
									new TableCell({ children: [new Paragraph(String(grandTotal))] }),
								],
							}),
						],
					}),
				],
			},
		],
	});
	return await Packer.toBuffer(doc);
}


