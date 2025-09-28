import mongoose from 'mongoose';
import { Asset } from '../models/Asset.js';
import { Department } from '../models/Department.js';
import ExcelJS from 'exceljs';
import { Packer, Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } from 'docx';
import { reportQuerySchema } from '../validation/schemas.js'; // Will need to add this schema

function buildFilter(filters) {
  const query = {};
  if (filters.academicYear) query.academicYear = filters.academicYear;
  if (filters.departmentId) query.departmentId = new mongoose.Types.ObjectId(filters.departmentId);
  if (filters.itemName) query['items.itemName'] = { $regex: filters.itemName, $options: 'i' };
  if (filters.vendorName) query['items.vendorName'] = { $regex: filters.vendorName, $options: 'i' };
  return query;
}

function buildGroupStage(groupBy) {
  if (groupBy === 'department') {
    return {
      $group: {
        _id: '$departmentId',
        items: { $push: '$items' },
        subtotal: { $sum: '$grandTotal' }
      }
    };
  } else {
    const idField = groupBy === 'item' ? '$item.itemName' : '$item.vendorName';
    return {
      $group: {
        _id: idField,
        items: { $push: '$item' },
        subtotal: { $sum: '$item.totalAmount' }
      }
    };
  }
}

export async function generateReport(req, res, next) {
  try {
    const { error, value } = reportQuerySchema.validate(req.query);
    if (error) return res.status(400).json({ error: error.message });

    const { groupBy, ...filters } = value;
    const query = buildFilter(filters);

    const pipeline = [
      { $match: query }
    ];

    if (groupBy !== 'department') {
      pipeline.push({ $unwind: '$items' });
    }

    pipeline.push(buildGroupStage(groupBy));
    pipeline.push({
      $group: {
        _id: null,
        data: { $push: { groupKey: '$_id', items: '$items', subtotal: '$subtotal' } },
        grandTotal: { $sum: '$subtotal' }
      }
    });
    pipeline.push({ $project: { data: 1, grandTotal: 1 } });

    const result = await Asset.aggregate(pipeline);
    const reportData = result[0] || { data: [], grandTotal: 0 };

    // Flatten items for each group if needed
    reportData.data = reportData.data.map(group => ({
      ...group,
      items: group.items.flat() // Flatten if nested from push
    }));

    res.json({ data: reportData.data, grandTotal: reportData.grandTotal });
  } catch (err) {
    next(err);
  }
}

async function generateExcel(data, groupBy, grandTotal, res) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Asset Report');

  // Headers
  const headers = [groupBy.charAt(0).toUpperCase() + groupBy.slice(1), 'Items Count', 'Subtotal (₹)', 'Percentage (%)'];
  worksheet.addRow(headers);
  worksheet.getRow(1).font = { bold: true };
  worksheet.columns = headers.map(h => ({ width: 20 }));

  // Data rows
  data.forEach(group => {
    const percentage = ((group.subtotal / grandTotal) * 100).toFixed(1);
    const row = [group.groupKey, group.items.length, group.subtotal, percentage];
    worksheet.addRow(row);
  });

  // Total row
  const totalRow = ['', `Total: ${data.reduce((sum, g) => sum + g.items.length, 0)} items`, grandTotal, '100'];
  const totalExcelRow = worksheet.addRow(totalRow);
  totalExcelRow.font = { bold: true };

  // Set response
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=asset-report.xlsx');
  await workbook.xlsx.write(res);
  res.end();
}

async function generateWord(data, groupBy, grandTotal, res) {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [new TextRun({ text: `Asset Report - Grouped by ${groupBy}`, bold: true, size: 24 })],
          alignment: 'center'
        }),
        new Paragraph({ children: [new TextRun({ text: '' })] }),
        ...data.map(group => {
          const percentage = ((group.subtotal / grandTotal) * 100).toFixed(1);
          return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: group.groupKey })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${group.items.length} items` })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `₹${group.subtotal.toLocaleString()}` })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${percentage}%` })] })] })
                ]
              })
            ]
          });
        }),
        new Paragraph({ children: [new TextRun({ text: '' })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${data.reduce((sum, g) => sum + g.items.length, 0)} items`, bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `₹${grandTotal.toLocaleString()}`, bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '100%', bold: true })] })] })
              ]
            })
          ]
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', 'attachment; filename=asset-report.docx');
  res.send(buffer);
}

export async function exportReport(req, res, next) {
  try {
    const { format } = req.params;
    if (!['excel', 'word'].includes(format)) return res.status(400).json({ error: 'Invalid format' });

    const { error, value } = reportQuerySchema.validate(req.query);
    if (error) return res.status(400).json({ error: error.message });

    const { groupBy, ...filters } = value;
    const query = buildFilter(filters);

    // Reuse aggregation from generateReport
    const pipeline = [
      { $match: query }
    ];

    if (groupBy !== 'department') {
      pipeline.push({ $unwind: '$items' });
    }

    pipeline.push(buildGroupStage(groupBy));
    pipeline.push({
      $group: {
        _id: null,
        data: { $push: { groupKey: '$_id', items: '$items', subtotal: '$subtotal' } },
        grandTotal: { $sum: '$subtotal' }
      }
    });
    pipeline.push({ $project: { data: 1, grandTotal: 1 } });

    const result = await Asset.aggregate(pipeline);
    const reportData = result[0] || { data: [], grandTotal: 0 };
    reportData.data = reportData.data.map(group => ({
      ...group,
      items: group.items.flat()
    }));

    if (format === 'excel') {
      await generateExcel(reportData.data, groupBy, reportData.grandTotal, res);
    } else {
      await generateWord(reportData.data, groupBy, reportData.grandTotal, res);
    }
  } catch (err) {
    next(err);
  }
}
