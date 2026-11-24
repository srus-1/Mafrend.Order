import type ExcelJS from 'exceljs';
import { Order, PaymentStatus, ProcessStatus } from '@/types/order';
import { CapexEntry, RawMaterialEntry } from '@/types/capex';
import { formatDateML } from './csvExport';

async function loadExcelJS(): Promise<typeof ExcelJS> {
  const mod = await import('exceljs');
  return mod.default;
}

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  LUNAS: 'Lunas',
  DP: 'DP',
  BELUM_LUNAS: 'Belum Lunas',
};

const PROCESS_LABELS: Record<ProcessStatus, string> = {
  ANTREAN: 'Antrean (1/6)',
  SETTING_DESAIN: 'Setting Desain (2/6)',
  PROSES_CETAK: 'Proses Cetak (3/6)',
  FINISHING: 'Finishing (4/6)',
  SIAP_KIRIM: 'Siap Kirim (5/6)',
  SELESAI: 'Selesai (6/6)',
};

const COLORS = {
  indigo: 'FF4638F5',
  white: 'FFFFFFFF',
  canvas: 'FFE5ECF6',
  rowAlt: 'FFF1F4FA',
  inkPrimary: 'FF14161D',
  inkMuted: 'FF475569',
  mintSoft: 'FFD9F7E4',
  divider: 'FFE2E8F0',
};

function sanitizeExcelText(value: string | null | undefined): string {
  if (!value) return '-';
  const trimmed = String(value).trim();
  if (!trimmed) return '-';
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

function styleBannerRows(
  sheet: ExcelJS.Worksheet,
  colCount: number,
  title: string,
  subtitle: string
) {
  sheet.mergeCells(1, 1, 1, colCount);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: COLORS.inkPrimary } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.canvas } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  sheet.getRow(1).height = 28;

  sheet.mergeCells(2, 1, 2, colCount);
  const subCell = sheet.getCell(2, 1);
  subCell.value = subtitle;
  subCell.font = { name: 'Calibri', size: 10, color: { argb: COLORS.inkMuted } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.canvas } };
  subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  sheet.getRow(2).height = 20;

  sheet.getRow(3).height = 8;
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.height = 26;
  row.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.indigo } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  });
}

function styleDataRow(row: ExcelJS.Row, isEven: boolean, numericCols: number[]) {
  row.height = 22;
  const fillColor = isEven ? COLORS.rowAlt : COLORS.white;
  row.eachCell((cell, colNumber) => {
    cell.font = { name: 'Calibri', size: 10, color: { argb: COLORS.inkPrimary } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
    cell.border = {
      bottom: { style: 'thin', color: { argb: COLORS.divider } },
    };
    if (numericCols.includes(colNumber)) {
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    } else {
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    }
  });
}

function styleTotalRow(row: ExcelJS.Row, numericCols: number[]) {
  row.height = 25;
  row.eachCell((cell, colNumber) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.inkPrimary } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.mintSoft } };
    cell.border = {
      top: { style: 'medium', color: { argb: COLORS.indigo } },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: numericCols.includes(colNumber) ? 'right' : 'left',
    };
  });
}

function triggerXlsxDownload(buffer: ArrayBuffer, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const finalName = filename.endsWith('.xlsx')
    ? filename
    : `${filename.replace(/\.xls$/i, '')}.xlsx`;
  link.download = finalName;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function buildOrdersXlsxBuffer(
  orders: Order[],
  periodLabel = 'Semua Periode'
): Promise<ArrayBuffer> {
  const ExcelJS = await loadExcelJS();
  const safeOrders = Array.isArray(orders) ? orders : [];
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Mafrend.Studio';
  wb.created = new Date();

  const sheet = wb.addWorksheet('Laporan Pesanan', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  const headers = [
    'No',
    'No. Pesanan',
    'Tgl Pesan',
    'Deadline',
    'Pelanggan',
    'WhatsApp',
    'Produk',
    'Spesifikasi',
    'Qty (pcs)',
    'Harga / Pcs',
    'Omzet',
    'Total HPP',
    'Laba Bersih',
    'Margin (%)',
    'Pembayaran',
    'DP Masuk',
    'Sisa Piutang',
    'Status Produksi',
    'Catatan',
  ];

  styleBannerRows(
    sheet,
    headers.length,
    'Laporan Pesanan Mafrend.Studio',
    `Periode: ${periodLabel}  |  Total: ${safeOrders.length} pesanan`
  );

  const headerRow = sheet.addRow(headers);
  styleHeaderRow(headerRow);

  const rpCols = [10, 11, 12, 13, 16, 17];
  const numericCols = [1, 9, 10, 11, 12, 13, 14, 16, 17];

  let totalQty = 0;
  let totalOmzet = 0;
  let totalHpp = 0;
  let totalProfit = 0;
  let totalDp = 0;
  let totalRemaining = 0;

  safeOrders.forEach((o, idx) => {
    const qty = Number(o.qty) || 0;
    const price = Number(o.pricePerPcs) || 0;
    const omzet = Number(o.omzet) || 0;
    const hpp = Number(o.hppBreakdown?.totalHpp) || 0;
    const profit = Number(o.profit) || 0;
    const margin = Number(o.marginPct) || 0;
    const dp = Number(o.dpAmount) || 0;
    const rem = Number(o.remainingPayment) || 0;

    totalQty += qty;
    totalOmzet += omzet;
    totalHpp += hpp;
    totalProfit += profit;
    totalDp += dp;
    totalRemaining += rem;

    const row = sheet.addRow([
      idx + 1,
      sanitizeExcelText(o.orderNumber),
      formatDateML(o.orderDate),
      formatDateML(o.deadline),
      sanitizeExcelText(o.buyerName),
      sanitizeExcelText(o.buyerPhone),
      sanitizeExcelText(o.productName),
      sanitizeExcelText(o.specs),
      qty,
      price,
      omzet,
      hpp,
      profit,
      margin / 100,
      PAYMENT_LABELS[o.paymentStatus] || o.paymentStatus,
      dp,
      rem,
      PROCESS_LABELS[o.processStatus] || o.processStatus,
      sanitizeExcelText(o.notes),
    ]);

    styleDataRow(row, idx % 2 === 1, numericCols);
    row.getCell(9).numFmt = '#,##0';
    rpCols.forEach((c) => {
      row.getCell(c).numFmt = '"Rp "#,##0';
    });
    row.getCell(14).numFmt = '0.0%';
  });

  const avgMargin = totalOmzet > 0 ? totalProfit / totalOmzet : 0;
  const totalRow = sheet.addRow([
    '',
    'TOTAL',
    '',
    '',
    '',
    '',
    '',
    '',
    totalQty,
    '',
    totalOmzet,
    totalHpp,
    totalProfit,
    avgMargin,
    '',
    totalDp,
    totalRemaining,
    '',
    '',
  ]);
  styleTotalRow(totalRow, numericCols);
  totalRow.getCell(9).numFmt = '#,##0';
  [11, 12, 13, 16, 17].forEach((c) => {
    totalRow.getCell(c).numFmt = '"Rp "#,##0';
  });
  totalRow.getCell(14).numFmt = '0.0%';

  const widths = [5, 14, 12, 12, 22, 15, 26, 28, 11, 14, 16, 16, 16, 11, 14, 15, 15, 18, 24];
  widths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });

  const out = await wb.xlsx.writeBuffer();
  return out instanceof ArrayBuffer ? out : new Uint8Array(out).buffer;
}

export async function downloadOrdersExcelXlsx(
  orders: Order[],
  periodLabel: string,
  filename: string,
  onError?: (message: string) => void
): Promise<boolean> {
  try {
    const buffer = await buildOrdersXlsxBuffer(orders, periodLabel);
    triggerXlsxDownload(buffer, filename);
    return true;
  } catch (err) {
    console.error('Gagal membuat file Excel pesanan:', err);
    onError?.('Gagal membuat file Excel pesanan. Coba lagi.');
    return false;
  }
}

export async function buildCapexXlsxBuffer(
  capex: CapexEntry[],
  periodLabel = 'Semua Periode'
): Promise<ArrayBuffer> {
  const ExcelJS = await loadExcelJS();
  const safeCapex = Array.isArray(capex) ? capex : [];
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Mafrend.Studio';
  wb.created = new Date();

  const sheet = wb.addWorksheet('Laporan Capex', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  const headers = ['No', 'Tanggal', 'Nama Aset', 'Kategori', 'Biaya Pembelian', 'Keterangan'];
  styleBannerRows(
    sheet,
    headers.length,
    'Laporan Belanja Modal (Capex) Mafrend.Studio',
    `Periode: ${periodLabel}  |  Total: ${safeCapex.length} item`
  );

  const headerRow = sheet.addRow(headers);
  styleHeaderRow(headerRow);

  let totalAmount = 0;
  safeCapex.forEach((c, idx) => {
    const amount = Number(c.amount) || 0;
    totalAmount += amount;
    const row = sheet.addRow([
      idx + 1,
      formatDateML(c.entryDate),
      sanitizeExcelText(c.itemName),
      sanitizeExcelText(c.category),
      amount,
      sanitizeExcelText(c.description || c.notes),
    ]);
    styleDataRow(row, idx % 2 === 1, [1, 5]);
    row.getCell(5).numFmt = '"Rp "#,##0';
  });

  const totalRow = sheet.addRow(['', '', 'TOTAL BELANJA MODAL', '', totalAmount, '']);
  styleTotalRow(totalRow, [5]);
  totalRow.getCell(5).numFmt = '"Rp "#,##0';

  [5, 13, 30, 22, 18, 34].forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });

  const out = await wb.xlsx.writeBuffer();
  return out instanceof ArrayBuffer ? out : new Uint8Array(out).buffer;
}

export async function downloadCapexExcelXlsx(
  capex: CapexEntry[],
  periodLabel: string,
  filename: string,
  onError?: (message: string) => void
): Promise<boolean> {
  try {
    const buffer = await buildCapexXlsxBuffer(capex, periodLabel);
    triggerXlsxDownload(buffer, filename);
    return true;
  } catch (err) {
    console.error('Gagal membuat file Excel capex:', err);
    onError?.('Gagal membuat file Excel belanja modal. Coba lagi.');
    return false;
  }
}

export async function buildRawMaterialsXlsxBuffer(
  materials: RawMaterialEntry[],
  periodLabel = 'Semua Periode'
): Promise<ArrayBuffer> {
  const ExcelJS = await loadExcelJS();
  const safeMaterials = Array.isArray(materials) ? materials : [];
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Mafrend.Studio';
  wb.created = new Date();

  const sheet = wb.addWorksheet('Laporan Bahan Baku', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  const headers = [
    'No',
    'Tanggal',
    'Nama Bahan Baku',
    'Kategori',
    'Supplier',
    'Volume',
    'Satuan',
    'Harga Satuan',
    'Total Biaya',
    'Catatan',
  ];
  styleBannerRows(
    sheet,
    headers.length,
    'Laporan Bahan Baku Berulang Mafrend.Studio',
    `Periode: ${periodLabel}  |  Total: ${safeMaterials.length} nota`
  );

  const headerRow = sheet.addRow(headers);
  styleHeaderRow(headerRow);

  let totalQty = 0;
  let totalAmount = 0;
  safeMaterials.forEach((m, idx) => {
    const qty = Number(m.qty ?? m.quantity) || 0;
    const unitPrice = Number(m.unitPrice) || 0;
    const total = Number(m.totalAmount) || 0;
    totalQty += qty;
    totalAmount += total;

    const row = sheet.addRow([
      idx + 1,
      formatDateML(m.entryDate),
      sanitizeExcelText(m.materialName),
      sanitizeExcelText(m.category),
      sanitizeExcelText(m.supplier),
      qty,
      sanitizeExcelText(m.unit),
      unitPrice,
      total,
      sanitizeExcelText(m.notes),
    ]);
    styleDataRow(row, idx % 2 === 1, [1, 6, 8, 9]);
    row.getCell(6).numFmt = '#,##0.##';
    row.getCell(8).numFmt = '"Rp "#,##0';
    row.getCell(9).numFmt = '"Rp "#,##0';
  });

  const totalRow = sheet.addRow([
    '',
    '',
    'TOTAL BAHAN BAKU',
    '',
    '',
    totalQty,
    '',
    '',
    totalAmount,
    '',
  ]);
  styleTotalRow(totalRow, [6, 9]);
  totalRow.getCell(6).numFmt = '#,##0.##';
  totalRow.getCell(9).numFmt = '"Rp "#,##0';

  [5, 13, 28, 22, 22, 10, 10, 16, 18, 26].forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });

  const out = await wb.xlsx.writeBuffer();
  return out instanceof ArrayBuffer ? out : new Uint8Array(out).buffer;
}

export async function downloadRawMaterialsExcelXlsx(
  materials: RawMaterialEntry[],
  periodLabel: string,
  filename: string,
  onError?: (message: string) => void
): Promise<boolean> {
  try {
    const buffer = await buildRawMaterialsXlsxBuffer(materials, periodLabel);
    triggerXlsxDownload(buffer, filename);
    return true;
  } catch (err) {
    console.error('Gagal membuat file Excel bahan baku:', err);
    onError?.('Gagal membuat file Excel bahan baku. Coba lagi.');
    return false;
  }
}
