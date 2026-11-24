import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { catalogService } from '../src/lib/supabase';
import { formatCalculatorDisplay } from '../src/context/CalculatorContext';

describe('Mafrend.Studio Catalog, Calculator & Zero-Border Verification Suite', () => {
  test('T1-CAT-01: catalogService returns preset workshop items with valid HPP totals', async () => {
    const items = await catalogService.getCatalogItems();
    assert.ok(items.length >= 5);
    for (const item of items) {
      const expectedHpp =
        item.hppBahanBaku +
        item.hppTintaSablon +
        item.hppTenagaKerja +
        item.hppKemasan +
        item.hppOverhead;
      assert.equal(item.totalHppPerPcs, expectedHpp);
    }
  });

  test('T1-CAT-02: catalogService create, update, upsertFromOrder, and delete work deterministically', async () => {
    const created = await catalogService.createCatalogItem({
      productName: 'Ganci Resin Custom 4cm',
      category: 'Akrilik',
      defaultSpecs: 'Resin Lycal Doming 2 Sisi',
      defaultPricePerPcs: 8000,
      hppBahanBaku: 2000,
      hppTintaSablon: 500,
      hppTenagaKerja: 800,
      hppKemasan: 400,
      hppOverhead: 300,
    });
    assert.equal(created.totalHppPerPcs, 4000);

    const updated = await catalogService.updateCatalogItem(created.id, {
      hppBahanBaku: 2200,
      defaultPricePerPcs: 8500,
    });
    assert.ok(updated);
    assert.equal(updated?.totalHppPerPcs, 4200);
    assert.equal(updated?.defaultPricePerPcs, 8500);

    const upserted = await catalogService.upsertFromOrder({
      productName: 'ganci resin custom 4cm',
      category: 'Akrilik',
      defaultSpecs: 'Resin Lycal Updated',
      defaultPricePerPcs: 9000,
      hppBahanBaku: 2500,
      hppTintaSablon: 500,
      hppTenagaKerja: 800,
      hppKemasan: 400,
      hppOverhead: 300,
    });
    assert.equal(upserted.id, created.id);
    assert.equal(upserted.totalHppPerPcs, 4500);

    const deleted = await catalogService.deleteCatalogItem(created.id);
    assert.equal(deleted, true);
  });

  test('T1-CALC-01: formatCalculatorDisplay formats Indonesian thousands and decimals cleanly', () => {
    assert.equal(formatCalculatorDisplay('0'), '0');
    assert.equal(formatCalculatorDisplay('900000'), '900.000');
    assert.equal(formatCalculatorDisplay('-12500.5'), '-12.500,5');
    assert.equal(formatCalculatorDisplay('Error'), 'Error');
  });

  test('T1-BRAND-01: Sidebar and Layout use Mafrend.Studio branding and omit Shift Workshop Aktif', () => {
    const sidebarSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/layout/Sidebar.tsx'),
      'utf-8'
    );
    const layoutSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/layout.tsx'),
      'utf-8'
    );
    assert.ok(sidebarSrc.includes('Mafrend.Studio'));
    assert.ok(sidebarSrc.includes('/logo-mafrend.png'));
    assert.ok(!sidebarSrc.includes('Mafrend.Order'));
    assert.ok(!sidebarSrc.includes('Status Workshop'));
    assert.ok(!sidebarSrc.includes('Shift produksi'));
    assert.ok(layoutSrc.includes('Mafrend.Studio'));
    assert.ok(layoutSrc.includes('FloatingCalculator'));
  });
});
