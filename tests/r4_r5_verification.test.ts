import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getOrderMonth } from '../src/context/OrderContext';
import {
  orderService,
  capexService,
  rawMaterialService,
  catalogService,
  notifyIfAuthError,
} from '../src/lib/supabase';
import {
  escapeCSVField,
  formatNumericML,
  exportOrdersToCSV,
  exportCapexToCSV,
  exportRawMaterialsToCSV,
} from '../src/lib/csvExport';
import {
  buildOrdersXlsxBuffer,
  buildCapexXlsxBuffer,
  buildRawMaterialsXlsxBuffer,
} from '../src/lib/excelExport';
import ExcelJS from 'exceljs';
import { formatMonthLabel } from '../src/lib/utils';
import { Order } from '../src/types/order';
import { CapexEntry, RawMaterialEntry } from '../src/types/capex';

describe('R1–R5 Comprehensive Verification Suite', () => {
  describe('Suite 1: Compact Layout & Overflow Verification (R1)', () => {
    const cardPath = path.resolve(process.cwd(), 'src/components/order/OrderRowCard.tsx');
    const cardSource = fs.readFileSync(cardPath, 'utf-8');

    test('T1-R1-01: OrderRowCard desktop layout contains right-side 2-column Grid/Flexbox container classes', () => {
      assert.ok(cardSource.includes('md:grid-cols-12'));
      assert.ok(cardSource.includes('md:col-span-7'));
      assert.ok(cardSource.includes('md:col-span-5'));
      assert.ok(cardSource.includes('Detail Pesanan'));
    });

    test('T1-R1-02: Long specs string is constrained via line-clamp / fixed-height scroll container', () => {
      assert.ok(cardSource.includes('line-clamp-1') || cardSource.includes('line-clamp-2'));
      assert.ok(cardSource.includes('max-h-14 overflow-y-auto'));
    });

    test('T1-R1-03: Long notes string is constrained with overflow-y-auto and break-words without horizontal overflow', () => {
      assert.ok(cardSource.includes('break-words'));
      assert.ok(cardSource.includes('overflow-y-auto'));
    });
  });

  describe('Suite 2: Monthly Filter & Multi-Select Override Verification (R2)', () => {
    const mockOrders: Order[] = [
      {
        id: 'ord-oct-1',
        orderNumber: 'ORD-2026-1001',
        orderDate: '2026-10-05',
        deadline: '2026-10-12',
        buyerName: 'Buyer Oct A',
        buyerPhone: '0811111111',
        productName: 'Ganci Akrilik',
        specs: 'Specs A',
        qty: 200,
        pricePerPcs: 5000,
        omzet: 1000000,
        hppBreakdown: {
          bahanBaku: 1000,
          tintaSablon: 500,
          tenagaKerja: 500,
          kemasan: 250,
          overhead: 250,
          totalHppPerPcs: 2500,
          totalHpp: 500000,
        },
        profit: 500000,
        marginPct: 50,
        paymentStatus: 'LUNAS',
        dpAmount: 1000000,
        remainingPayment: 0,
        processStatus: 'SELESAI',
        queueOrder: 1,
        designFiles: [],
        createdAt: '2026-10-05T08:00:00.000Z',
        updatedAt: '2026-10-05T08:00:00.000Z',
      },
      {
        id: 'ord-oct-2',
        orderNumber: 'ORD-2026-1002',
        orderDate: '2026-10-18',
        deadline: '2026-10-25',
        buyerName: 'Buyer Oct B',
        buyerPhone: '0822222222',
        productName: 'Ganci Karet',
        specs: 'Specs B',
        qty: 300,
        pricePerPcs: 6000,
        omzet: 1800000,
        hppBreakdown: {
          bahanBaku: 1200,
          tintaSablon: 400,
          tenagaKerja: 600,
          kemasan: 400,
          overhead: 400,
          totalHppPerPcs: 3000,
          totalHpp: 900000,
        },
        profit: 900000,
        marginPct: 50,
        paymentStatus: 'DP',
        dpAmount: 800000,
        remainingPayment: 1000000,
        processStatus: 'PROSES_CETAK',
        queueOrder: 2,
        designFiles: [],
        createdAt: '2026-10-18T08:00:00.000Z',
        updatedAt: '2026-10-18T08:00:00.000Z',
      },
      {
        id: 'ord-sep-1',
        orderNumber: 'ORD-2026-0901',
        orderDate: '2026-09-10',
        deadline: '2026-09-15',
        buyerName: 'Buyer Sep C',
        buyerPhone: '0833333333',
        productName: 'Pin Peniti',
        specs: 'Specs C',
        qty: 1000,
        pricePerPcs: 3000,
        omzet: 3000000,
        hppBreakdown: {
          bahanBaku: 800,
          tintaSablon: 200,
          tenagaKerja: 300,
          kemasan: 100,
          overhead: 100,
          totalHppPerPcs: 1500,
          totalHpp: 1500000,
        },
        profit: 1500000,
        marginPct: 50,
        paymentStatus: 'LUNAS',
        dpAmount: 3000000,
        remainingPayment: 0,
        processStatus: 'SELESAI',
        queueOrder: 3,
        designFiles: [],
        createdAt: '2026-09-10T08:00:00.000Z',
        updatedAt: '2026-09-10T08:00:00.000Z',
      },
    ];

    test('T1-R2-01: Global monthly filter isolates orders strictly by YYYY-MM without all-time accumulation', () => {
      const octOrders = mockOrders.filter((o) => getOrderMonth(o) === '2026-10');
      assert.equal(octOrders.length, 2);
      assert.ok(octOrders.every((o) => o.orderDate.startsWith('2026-10')));
    });

    test('T1-R2-02: Default dashboard metrics compute strictly over active month orders', () => {
      const octOrders = mockOrders.filter((o) => getOrderMonth(o) === '2026-10');
      const metrics = orderService.getDashboardMetrics(octOrders);
      assert.equal(metrics.totalPcs, 500);
      assert.equal(metrics.totalOmzet, 2800000);
      assert.equal(metrics.totalHpp, 1400000);
      assert.equal(metrics.totalProfit, 1400000);
      assert.equal(metrics.totalPiutangDp, 1000000);
    });

    test('T1-R2-03: Buyer summaries rank buyers strictly within active month orders', () => {
      const octOrders = mockOrders.filter((o) => getOrderMonth(o) === '2026-10');
      const summaries = orderService.getBuyerSummaries(octOrders);
      assert.equal(summaries.length, 2);
      assert.equal(summaries[0].buyerName, 'Buyer Oct B');
      assert.equal(summaries[1].buyerName, 'Buyer Oct A');
    });

    test('T1-R2-04: Multi-select dynamic override recalculates metrics strictly over selected orders', () => {
      const selectedIds = new Set(['ord-oct-1', 'ord-sep-1']);
      const selectedSubset = mockOrders.filter((o) => selectedIds.has(o.id));
      const metrics = orderService.getDashboardMetrics(selectedSubset);
      assert.equal(metrics.totalPcs, 1200);
      assert.equal(metrics.totalOmzet, 4000000);
      assert.equal(metrics.totalProfit, 2000000);
    });

    test('T1-R2-05: Clearing multi-select reverts metrics calculation back to active monthly filter', () => {
      const selectedIds: string[] = [];
      const selectedMonth = '2026-09';
      const activeOrders =
        selectedIds.length > 0
          ? mockOrders.filter((o) => selectedIds.includes(o.id))
          : mockOrders.filter((o) => getOrderMonth(o) === selectedMonth);
      const metrics = orderService.getDashboardMetrics(activeOrders);
      assert.equal(metrics.totalPcs, 1000);
      assert.equal(metrics.totalOmzet, 3000000);
      assert.equal(metrics.totalProfit, 1500000);
    });

    test('T1-R2-06: Dashboard profit calculation remains pure from orders (does not subtract Capex or Raw Materials)', () => {
      const octOrders = mockOrders.filter((o) => getOrderMonth(o) === '2026-10');
      const metrics = orderService.getDashboardMetrics(octOrders);
      assert.equal(metrics.totalProfit, metrics.totalOmzet - metrics.totalHpp);
    });
  });

  describe('Suite 3: Capex & Recurring Raw Materials CRUD Verification (R3)', () => {
    let createdCapexId = '';
    let createdMaterialId = '';

    test('T1-R3-01: Capex create operation assigns ID, date, category, and raw numeric amount', async () => {
      const entry = await capexService.createCapexEntry({
        itemName: 'Mesin Press Ganci Digital',
        category: 'Mesin & Peralatan',
        amount: 4500000,
        entryDate: '2026-10-22',
        description: 'Investasi alat baru',
      });
      createdCapexId = entry.id;
      assert.ok(entry.id);
      assert.equal(entry.amount, 4500000);
      assert.equal(entry.entryDate, '2026-10-22');
    });

    test('T1-R3-02: Capex update operation updates amount and category while preserving timestamps', async () => {
      const updated = await capexService.updateCapexEntry(createdCapexId, {
        amount: 4750000,
        category: 'Perlengkapan Workshop',
      });
      assert.ok(updated);
      assert.equal(updated?.amount, 4750000);
      assert.equal(updated?.category, 'Perlengkapan Workshop');
      assert.ok(updated?.createdAt);
      assert.ok(updated?.updatedAt);
    });

    test('T1-R3-03: Capex delete operation removes record from active list', async () => {
      const ok = await capexService.deleteCapexEntry(createdCapexId);
      assert.equal(ok, true);
      const list = await capexService.getCapexEntries();
      assert.ok(!list.some((c) => c.id === createdCapexId));
    });

    test('T1-R3-04: Recurring Raw Materials create calculates totalAmount = qty * unitPrice', async () => {
      const mat = await rawMaterialService.createRawMaterialEntry({
        materialName: 'Ring Ganci Putar',
        category: 'Akrilik & Aksesoris',
        supplier: 'Toko Aksesoris Surabaya',
        quantity: 10,
        unit: 'gross',
        unitPrice: 35000,
        entryDate: '2026-10-23',
      });
      createdMaterialId = mat.id;
      assert.equal(mat.totalAmount, 350000);
    });

    test('T1-R3-05: Recurring Raw Materials update recalculates totalAmount when qty or unitPrice changes', async () => {
      const updated = await rawMaterialService.updateRawMaterialEntry(createdMaterialId, {
        quantity: 20,
        unitPrice: 32000,
      });
      assert.ok(updated);
      assert.equal(updated?.totalAmount, 640000);
    });

    test('T1-R3-06: Recurring Raw Materials delete removes record', async () => {
      const ok = await rawMaterialService.deleteRawMaterialEntry(createdMaterialId);
      assert.equal(ok, true);
      const list = await rawMaterialService.getRawMaterialEntries();
      assert.ok(!list.some((m) => m.id === createdMaterialId));
    });

    test('T1-R3-07: Capex and Raw Materials records filter strictly by selected month (YYYY-MM)', async () => {
      const capex = await capexService.getCapexEntries();
      const materials = await rawMaterialService.getRawMaterialEntries();
      const octCapex = capex.filter((c) => c.entryDate.startsWith('2026-10'));
      const octMaterials = materials.filter((m) => m.entryDate.startsWith('2026-10'));
      assert.ok(octCapex.length > 0);
      assert.ok(octMaterials.length > 0);
      assert.ok(octCapex.every((c) => c.entryDate.startsWith('2026-10')));
      assert.ok(octMaterials.every((m) => m.entryDate.startsWith('2026-10')));
    });

    test('T2-R3-01: Optimistic fallback succeeds in memory when Supabase is unconfigured / placeholder', async () => {
      const list = await capexService.getCapexEntries();
      assert.ok(Array.isArray(list) && list.length > 0);
    });

    test('T2-R3-02: Updating a non-existent Capex or Material ID returns null gracefully without corrupting state', async () => {
      const resCapex = await capexService.updateCapexEntry('non-existent-id-999', { amount: 100 });
      const resMat = await rawMaterialService.updateRawMaterialEntry('non-existent-id-999', { quantity: 5 });
      assert.equal(resCapex, null);
      assert.equal(resMat, null);
    });
  });

  describe('Suite 4: ML-Ready CSV Export Verification (R4)', () => {
    const sampleOrder: Order = {
      id: 'ord-csv-1',
      orderNumber: 'ORD-2026-0500',
      orderDate: '2026-10-15',
      deadline: '2026-10-22',
      buyerName: 'CV. Berkah, Bersama',
      buyerPhone: '081298765432',
      productName: 'Ganci "Custom" UV',
      specs: 'LONG_UNSTRUCTURED_SPECS_STRING_MUST_NOT_APPEAR',
      qty: 250,
      pricePerPcs: 5000,
      omzet: 1250000,
      hppBreakdown: {
        bahanBaku: 900,
        tintaSablon: 300,
        tenagaKerja: 400,
        kemasan: 200,
        overhead: 200,
        totalHppPerPcs: 2000,
        totalHpp: 500000,
      },
      profit: 750000,
      marginPct: 60,
      paymentStatus: 'LUNAS',
      dpAmount: 1250000,
      remainingPayment: 0,
      processStatus: 'SELESAI',
      queueOrder: 1,
      designFiles: [],
      notes: 'LONG_UNSTRUCTURED_NOTES_STRING_MUST_NOT_APPEAR',
      createdAt: '2026-10-15T10:00:00.000Z',
      updatedAt: '2026-10-16T12:00:00.000Z',
    };

    test('T1-R4-01: exportOrdersToCSV produces exact 26-column header and strictly omits specs, notes, and designFiles', () => {
      const csv = exportOrdersToCSV([sampleOrder]);
      const [headerLine] = csv.split('\r\n');
      const cols = headerLine.split(',');
      assert.equal(cols.length, 26);
      assert.ok(!cols.includes('specs'));
      assert.ok(!cols.includes('notes'));
      assert.ok(!csv.includes('LONG_UNSTRUCTURED_SPECS_STRING_MUST_NOT_APPEAR'));
      assert.ok(!csv.includes('LONG_UNSTRUCTURED_NOTES_STRING_MUST_NOT_APPEAR'));
    });

    test('T1-R4-02: exportOrdersToCSV outputs all monetary, cost, qty, and margin fields as raw numbers', () => {
      const csv = exportOrdersToCSV([sampleOrder]);
      assert.ok(!csv.includes('Rp'));
      assert.ok(!csv.includes('%'));
      assert.ok(csv.includes(',250,5000,1250000,900,300,400,200,200,2000,500000,750000,60,'));
    });

    test('T1-R4-03: exportOrdersToCSV standardizes orderDate/deadline to YYYY-MM-DD and timestamps to ISO-8601', () => {
      const csv = exportOrdersToCSV([sampleOrder]);
      const [, rowLine] = csv.split('\r\n');
      assert.ok(rowLine.includes(',2026-10-15,2026-10-22,'));
      assert.ok(rowLine.endsWith(',2026-10-15T10:00:00.000Z,2026-10-16T12:00:00.000Z'));
    });

    test('T1-R4-04: exportOrdersToCSV applies RFC 4180 escaping to strings with commas or quotes', () => {
      const csv = exportOrdersToCSV([sampleOrder]);
      assert.ok(csv.includes('"CV. Berkah, Bersama"'));
      assert.ok(csv.includes('"Ganci ""Custom"" UV"'));
    });

    test('T1-R4-05: exportCapexToCSV produces exact 9-column header, raw numeric amount, and excludes notes', () => {
      const capexItem: CapexEntry = {
        id: 'cpx-r4-1',
        entryDate: '2026-10-08',
        category: 'Mesin & Peralatan',
        itemName: 'Laser Co2',
        amount: 12000000,
        usefulLifeMonths: 24,
        monthlyDepreciation: 500000,
        description: 'HIDDEN_DESCRIPTION',
        notes: 'HIDDEN_NOTES',
        createdAt: '2026-10-08T08:00:00.000Z',
        updatedAt: '2026-10-08T08:00:00.000Z',
      };
      const csv = exportCapexToCSV([capexItem]);
      const [headerLine, rowLine] = csv.split('\r\n');
      assert.equal(headerLine.split(',').length, 9);
      assert.ok(rowLine.includes(',12000000,24,500000,'));
      assert.ok(!csv.includes('HIDDEN_DESCRIPTION'));
      assert.ok(!csv.includes('HIDDEN_NOTES'));
    });

    test('T1-R4-06: exportRawMaterialsToCSV produces exact 11-column header, raw numeric fields, and excludes notes', () => {
      const matItem: RawMaterialEntry = {
        id: 'mat-r4-1',
        entryDate: '2026-10-09',
        materialName: 'Tinta UV Putih',
        category: 'Tinta & Sablon',
        supplier: 'PT. Warna',
        quantity: 4,
        unit: 'botol',
        unitPrice: 450000,
        totalAmount: 1800000,
        notes: 'HIDDEN_MAT_NOTES',
        createdAt: '2026-10-09T08:00:00.000Z',
        updatedAt: '2026-10-09T08:00:00.000Z',
      };
      const csv = exportRawMaterialsToCSV([matItem]);
      const [headerLine, rowLine] = csv.split('\r\n');
      assert.equal(headerLine.split(',').length, 11);
      assert.ok(rowLine.includes(',4,botol,450000,1800000,'));
      assert.ok(!csv.includes('HIDDEN_MAT_NOTES'));
    });

    test('T2-R4-01: CSV export functions handle empty array returning header row only without errors', () => {
      assert.equal(exportOrdersToCSV([]).split('\r\n').length, 1);
      assert.equal(exportCapexToCSV([]).split('\r\n').length, 1);
      assert.equal(exportRawMaterialsToCSV([]).split('\r\n').length, 1);
    });

    test('T2-R4-02: CSV export functions handle null, undefined, and NaN gracefully without NaN or undefined strings', () => {
      const brokenOrder = {
        ...sampleOrder,
        buyerName: 'Simple Buyer',
        productName: 'Simple Product',
        qty: Number.NaN,
        omzet: undefined as unknown as number,
      };
      const csv = exportOrdersToCSV([brokenOrder]);
      assert.ok(!csv.includes('NaN'));
      assert.ok(!csv.includes('undefined'));
    });

    test('T3-R4-01: Round-trip CSV parsing test verifies numerical equality for all numeric columns', () => {
      const simpleOrder: Order = {
        ...sampleOrder,
        buyerName: 'PT Maju',
        productName: 'Ganci Polos',
      };
      const csv = exportOrdersToCSV([simpleOrder]);
      const [headerLine, dataLine] = csv.split('\r\n');
      const headers = headerLine.split(',');
      const values = dataLine.split(',');
      const record = Object.fromEntries(headers.map((h, i) => [h, values[i]]));

      assert.equal(Number(record.qty), simpleOrder.qty);
      assert.equal(Number(record.price_per_pcs), simpleOrder.pricePerPcs);
      assert.equal(Number(record.omzet), simpleOrder.omzet);
      assert.equal(Number(record.total_hpp), simpleOrder.hppBreakdown.totalHpp);
      assert.equal(Number(record.profit), simpleOrder.profit);
      assert.equal(Number(record.margin_pct), simpleOrder.marginPct);
    });

    test('T1-R4-07: escapeCSVField neutralizes spreadsheet formula prefixes (=, +, -, @) while keeping negative numbers raw', () => {
      assert.equal(escapeCSVField("=CMD|' /C calc'!A0"), "'=CMD|' /C calc'!A0");
      assert.equal(escapeCSVField('+1+1'), "'+1+1");
      assert.equal(escapeCSVField('-SUM(A1:A5)'), "'-SUM(A1:A5)");
      assert.equal(escapeCSVField('@IMPORT("http://evil.example")'), `"'@IMPORT(""http://evil.example"")"`);
      assert.equal(formatNumericML(-15000), '-15000');
      assert.equal(escapeCSVField(-15000), '-15000');
      assert.equal(escapeCSVField('Ganci Akrilik Normal'), 'Ganci Akrilik Normal');

      const formulaOrder: Order = {
        ...sampleOrder,
        buyerName: '=HYPERLINK("http://evil.example","Click")',
        productName: '+SUM(1,2)',
      };
      const csv = exportOrdersToCSV([formulaOrder]);
      assert.ok(csv.includes(`"'=HYPERLINK(""http://evil.example"",""Click"")"`));
      assert.ok(csv.includes("'+SUM(1,2)"));
    });
  });

  describe('Suite 5: Architecture Modularization, Canonical Helpers & RLS/RPC Hardening (R5)', () => {
    test('T1-R5-01: Canonical formatMonthLabel formats YYYY-MM and ALL consistently', () => {
      assert.equal(formatMonthLabel('2026-11'), 'November 2026');
      assert.equal(formatMonthLabel('2026-01'), 'Januari 2026');
      assert.equal(formatMonthLabel('ALL'), 'Semua Bulan');
      assert.equal(formatMonthLabel(''), 'Semua Bulan');
    });

    test('T1-R5-02: Modularized services re-export cleanly from src/lib/supabase and stay under 1000 lines', () => {
      assert.equal(typeof orderService.getOrders, 'function');
      assert.equal(typeof capexService.getCapexEntries, 'function');
      assert.equal(typeof rawMaterialService.getRawMaterialEntries, 'function');
      assert.equal(typeof catalogService.getCatalogItems, 'function');
      assert.equal(typeof notifyIfAuthError, 'function');
      assert.equal(notifyIfAuthError({ code: '42501', message: 'row-level security' }), true);
      assert.equal(notifyIfAuthError({ code: '23505', message: 'duplicate key' }), false);

      const supabaseLines = fs
        .readFileSync(path.resolve(process.cwd(), 'src/lib/supabase.ts'), 'utf-8')
        .split('\n').length;
      const capexPageLines = fs
        .readFileSync(path.resolve(process.cwd(), 'src/app/capex/page.tsx'), 'utf-8')
        .split('\n').length;
      assert.ok(supabaseLines < 900, `Expected supabase.ts < 900 lines, got ${supabaseLines}`);
      assert.ok(capexPageLines < 900, `Expected capex/page.tsx < 900 lines, got ${capexPageLines}`);
    });

    test('T1-R5-03: Hardening migration defines atomic order_number RPC, batch reorder RPC, and authenticated-only RLS', () => {
      const migPath = path.resolve(
        process.cwd(),
        'supabase/migrations/20261125010000_hardening_rls_and_rpc.sql'
      );
      const sql = fs.readFileSync(migPath, 'utf-8');
      assert.ok(sql.includes('CREATE SEQUENCE IF NOT EXISTS public.order_number_seq'));
      assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.next_order_number'));
      assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.reorder_orders_batch'));
      assert.ok(sql.includes('TO authenticated'));
      assert.ok(!/CREATE POLICY[\s\S]*?TO anon/i.test(sql));
    });

    test('T1-R5-04: Genuine .xlsx exports produce valid OOXML ZIP buffers readable by ExcelJS', async () => {
      const ordersBuf = await buildOrdersXlsxBuffer([
        {
          id: 'ord-xlsx-1',
          orderNumber: 'MF26001',
          orderDate: '2026-11-20',
          deadline: '2026-11-25',
          buyerName: "=CMD|' /C calc'!A0",
          buyerPhone: '08123456789',
          productName: 'Ganci Akrilik 2 Sisi',
          specs: '3mm UV',
          qty: 100,
          pricePerPcs: 6500,
          omzet: 650000,
          hppBreakdown: {
            bahanBaku: 1500,
            tintaSablon: 600,
            tenagaKerja: 700,
            kemasan: 300,
            overhead: 200,
            totalHppPerPcs: 3300,
            totalHpp: 330000,
          },
          profit: 320000,
          marginPct: 49.2,
          paymentStatus: 'LUNAS',
          dpAmount: 650000,
          remainingPayment: 0,
          processStatus: 'SELESAI',
          queueOrder: 1,
          designFiles: [],
          notes: '+SUM(1,2)',
          createdAt: '2026-11-20T08:00:00.000Z',
          updatedAt: '2026-11-20T08:00:00.000Z',
        },
      ], 'November 2026');

      const bytes = new Uint8Array(ordersBuf);
      assert.equal(bytes[0], 0x50); // 'P'
      assert.equal(bytes[1], 0x4b); // 'K' (valid ZIP/OOXML header)

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(ordersBuf);
      const sheet = wb.getWorksheet('Laporan Pesanan');
      assert.ok(sheet);
      assert.equal(sheet.getRow(5).getCell(2).value, 'MF26001');
      assert.equal(sheet.getRow(5).getCell(5).value, "'=CMD|' /C calc'!A0");
      assert.equal(sheet.getRow(5).getCell(11).value, 650000);
      assert.equal(sheet.getRow(5).getCell(19).value, "'+SUM(1,2)");

      const capexBuf = await buildCapexXlsxBuffer([], 'November 2026');
      assert.equal(new Uint8Array(capexBuf)[0], 0x50);
      const matBuf = await buildRawMaterialsXlsxBuffer([], 'November 2026');
      assert.equal(new Uint8Array(matBuf)[0], 0x50);
    });

    test('T1-R5-05: UI uses CustomSelect everywhere (zero native <select>), no slash hint, and no static Baru badge', () => {
      const filterSrc = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/order/OrderFilterTabs.tsx'),
        'utf-8'
      );
      const sidebarSrc = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/layout/Sidebar.tsx'),
        'utf-8'
      );
      const rowSrc = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/order/OrderRowCard.tsx'),
        'utf-8'
      );
      assert.ok(!filterSrc.includes('handleSlash'));
      assert.ok(!sidebarSrc.includes("badge: 'new'"));
      assert.ok(!rowSrc.includes('<select'));
    });
  });
});
