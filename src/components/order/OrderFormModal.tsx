'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { PaymentStatus, ProcessStatus, Order, CreateOrderInput } from '@/types/order';
import { CatalogItem, CATALOG_CATEGORIES } from '@/types/catalog';
import { catalogService } from '@/lib/supabase';
import { calculateHPP, calculateMargin, formatRp } from '@/lib/utils';

interface OrderFormContentProps {
  editingOrder: Order | null;
  onClose: () => void;
  createOrder: (data: CreateOrderInput) => Promise<Order>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<Order | null>;
}

function OrderFormContent({
  editingOrder,
  onClose,
  createOrder,
  updateOrder,
}: OrderFormContentProps) {
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [saveToCatalog, setSaveToCatalog] = useState<boolean>(false);
  const [catalogCategory, setCatalogCategory] = useState<string>('Akrilik');

  const [buyerName, setBuyerName] = useState<string>(() => editingOrder?.buyerName ?? '');
  const [buyerPhone, setBuyerPhone] = useState<string>(() => editingOrder?.buyerPhone ?? '');
  const [productName, setProductName] = useState<string>(() => editingOrder?.productName ?? '');
  const [specs, setSpecs] = useState<string>(() => editingOrder?.specs ?? '');
  const [qty, setQty] = useState<number>(() => editingOrder?.qty ?? 0);
  const [pricePerPcs, setPricePerPcs] = useState<number>(() => editingOrder?.pricePerPcs ?? 0);
  const [deadline, setDeadline] = useState<string>(() => editingOrder?.deadline ?? '');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    () => editingOrder?.paymentStatus ?? 'DP'
  );
  const [dpAmount, setDpAmount] = useState<number>(() => editingOrder?.dpAmount ?? 0);
  const [processStatus, setProcessStatus] = useState<ProcessStatus>(
    () => editingOrder?.processStatus ?? 'ANTREAN'
  );
  const [notes, setNotes] = useState<string>(() => editingOrder?.notes ?? '');

  // HPP Breakdown Inputs (per pcs)
  const [bahanBaku, setBahanBaku] = useState<number>(() => editingOrder?.hppBreakdown.bahanBaku ?? 0);
  const [tintaSablon, setTintaSablon] = useState<number>(() => editingOrder?.hppBreakdown.tintaSablon ?? 0);
  const [tenagaKerja, setTenagaKerja] = useState<number>(() => editingOrder?.hppBreakdown.tenagaKerja ?? 0);
  const [kemasan, setKemasan] = useState<number>(() => editingOrder?.hppBreakdown.kemasan ?? 0);
  const [overhead, setOverhead] = useState<number>(() => editingOrder?.hppBreakdown.overhead ?? 0);

  const [errorMsg, setErrorMsg] = useState<string>('');

  // Load catalog items and default deadline asynchronously on client mount
  useEffect(() => {
    let isMounted = true;

    async function loadInitialModalData() {
      await Promise.resolve();
      if (!isMounted) return;

      if (!editingOrder?.deadline) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 4);
        setDeadline(nextDate.toISOString().split('T')[0]);
      }

      const list = await catalogService.getCatalogItems();
      if (isMounted) {
        setCatalogItems(list);
      }
    }

    void loadInitialModalData();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKey);
    };
  }, [editingOrder?.deadline, onClose]);

  const handleSelectCatalog = (catalogId: string) => {
    setSelectedCatalogId(catalogId);
    if (!catalogId) return;
    const item = catalogItems.find((c) => c.id === catalogId);
    if (!item) return;

    setProductName(item.productName);
    setSpecs(item.defaultSpecs);
    setPricePerPcs(item.defaultPricePerPcs);
    setBahanBaku(item.hppBahanBaku);
    setTintaSablon(item.hppTintaSablon);
    setTenagaKerja(item.hppTenagaKerja);
    setKemasan(item.hppKemasan);
    setOverhead(item.hppOverhead);
    setCatalogCategory(item.category || 'Akrilik');
    if (qty <= 0) {
      setQty(50);
    }
  };

  const safeQty = Math.max(0, qty || 0);
  const safePrice = Math.max(0, pricePerPcs || 0);
  const totalOmzet = safeQty * safePrice;

  const currentHpp = calculateHPP(
    {
      bahanBaku,
      tintaSablon,
      tenagaKerja,
      kemasan,
      overhead,
    },
    Math.max(1, safeQty)
  );
  const totalHppDisplay = safeQty > 0 ? currentHpp.totalHpp : 0;
  const { profit, marginPct } = calculateMargin(totalOmzet, totalHppDisplay);

  const selectOnFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

  const handleNumericChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<number>>
  ) => {
    const cleaned = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
    if (e.target.value !== cleaned) {
      e.target.value = cleaned;
    }
    setter(cleaned === '' ? 0 : Number(cleaned));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!buyerName.trim()) {
      setErrorMsg('Nama pembeli wajib diisi.');
      return;
    }
    if (!productName.trim()) {
      setErrorMsg('Nama produk wajib diisi.');
      return;
    }
    if (safeQty <= 0) {
      setErrorMsg('Kuantitas pesanan minimal 1.');
      return;
    }

    if (saveToCatalog) {
      void catalogService.upsertFromOrder({
        productName: productName.trim(),
        category: catalogCategory,
        defaultSpecs: specs.trim(),
        defaultPricePerPcs: safePrice,
        hppBahanBaku: bahanBaku,
        hppTintaSablon: tintaSablon,
        hppTenagaKerja: tenagaKerja,
        hppKemasan: kemasan,
        hppOverhead: overhead,
      });
    }

    if (editingOrder) {
      updateOrder(editingOrder.id, {
        buyerName,
        buyerPhone,
        productName,
        specs,
        qty: safeQty,
        pricePerPcs: safePrice,
        deadline,
        paymentStatus,
        dpAmount: paymentStatus === 'DP' ? dpAmount : paymentStatus === 'LUNAS' ? totalOmzet : 0,
        processStatus,
        notes,
        hppBreakdown: currentHpp,
      });
    } else {
      createOrder({
        orderDate: new Date().toISOString().split('T')[0],
        deadline,
        buyerName,
        buyerPhone: buyerPhone || '08120000000',
        productName,
        specs: specs || 'Custom Sablon Presisi',
        qty: safeQty,
        pricePerPcs: safePrice,
        hppBreakdown: currentHpp,
        paymentStatus,
        dpAmount: paymentStatus === 'DP' ? dpAmount : paymentStatus === 'LUNAS' ? totalOmzet : 0,
        processStatus,
        designFiles: [],
        notes,
      });
    }

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/55 overscroll-contain"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full sm:max-w-3xl bg-[var(--bg-surface)] text-[var(--ink-primary)] rounded-t-2xl sm:rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.3)] flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden animate-fade-in-up z-10">
        {/* Clean Header (Zero Sub-Headline, Zero Border) */}
        <div className="px-5 py-4 sm:px-6 flex items-center justify-between shrink-0">
          <h1 id="order-modal-title" className="text-base sm:text-lg font-bold text-[var(--ink-primary)]">
            {editingOrder ? `Edit Pesanan #${editingOrder.orderNumber}` : 'Input Pesanan'}
          </h1>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--ink-primary)] flex items-center justify-center"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="order-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6 flex flex-col gap-5"
        >
          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#F29B76] text-[#14161D] text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Catalog Preset Auto-Fill Selector */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-row)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <label
                htmlFor="catalog-preset-select"
                className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1.5"
              >
                Pilih dari Katalog Item (Isi Otomatis HPP)
              </label>
              <select
                id="catalog-preset-select"
                value={selectedCatalogId}
                onChange={(e) => handleSelectCatalog(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-chip-on-row)] text-xs font-semibold text-[var(--ink-primary)] min-h-[40px]"
              >
                <option value="">Input manual atau pilih standar produk...</option>
                {catalogItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.productName} - Jual {formatRp(item.defaultPricePerPcs)} (HPP{' '}
                    {formatRp(item.totalHppPerPcs)}/pcs)
                  </option>
                ))}
              </select>
            </div>

            {selectedCatalogId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#6EEB9A] text-[#14161D] text-[11px] font-bold shrink-0 self-start sm:self-end">
                <Check className="w-3.5 h-3.5" />
                <span>HPP Terisi</span>
              </span>
            )}
          </div>

          {/* 1. Data Pembeli & Produk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                Nama Pembeli *
              </label>
              <input
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Nama pembeli atau instansi"
                className="w-full px-3.5 py-2.5 text-xs font-medium bg-[var(--bg-subtle)] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] rounded-xl min-h-[40px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                No. WhatsApp
              </label>
              <input
                type="text"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full px-3.5 py-2.5 text-xs font-medium bg-[var(--bg-subtle)] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] rounded-xl min-h-[40px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                Nama Produk *
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ganci Akrilik 2 Sisi 5x5 cm"
                className="w-full px-3.5 py-2.5 text-xs font-medium bg-[var(--bg-subtle)] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] rounded-xl min-h-[40px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                Target Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-medium bg-[var(--bg-subtle)] text-[var(--ink-primary)] rounded-xl min-h-[40px]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                Spesifikasi Produk
              </label>
              <input
                type="text"
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                placeholder="Akrilik 3mm, UV Bolak-Balik, Ring Putar"
                className="w-full px-3.5 py-2.5 text-xs font-medium bg-[var(--bg-subtle)] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] rounded-xl min-h-[40px]"
              />
            </div>
          </div>

          {/* 2. Kuantitas & Harga Jual */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                Kuantitas (Pcs) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={qty > 0 ? String(qty) : ''}
                onFocus={selectOnFocus}
                onChange={(e) => handleNumericChange(e, setQty)}
                className="w-full px-3.5 py-2.5 text-xs font-bold tabular-nums bg-[var(--bg-subtle)] text-[var(--ink-primary)] rounded-xl min-h-[40px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                Harga Satuan (Rp)
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={pricePerPcs > 0 ? String(pricePerPcs) : ''}
                onFocus={selectOnFocus}
                onChange={(e) => handleNumericChange(e, setPricePerPcs)}
                className="w-full px-3.5 py-2.5 text-xs font-bold tabular-nums bg-[var(--bg-subtle)] text-[var(--ink-primary)] rounded-xl min-h-[40px]"
              />
            </div>

            <div>
              <span className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                Total Omzet
              </span>
              <div className="px-3.5 py-2.5 text-xs font-bold tabular-nums bg-[#4638F5] text-[#FFFFFF] rounded-xl min-h-[40px] flex items-center">
                {formatRp(totalOmzet)}
              </div>
            </div>
          </div>

          {/* 3. Rincian HPP per Pcs (Auto-filled or Editable) */}
          <div className="p-4 bg-[var(--bg-row)] rounded-2xl flex flex-col gap-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[var(--ink-primary)]">
                Modal Operasional / HPP per Pcs
              </span>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-[var(--ink-secondary)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveToCatalog}
                  onChange={(e) => setSaveToCatalog(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#4638F5]"
                />
                <span>Simpan ke Katalog Item</span>
              </label>
            </div>

            {saveToCatalog && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-[var(--ink-muted)]">
                  Kategori Katalog:
                </span>
                <select
                  value={catalogCategory}
                  onChange={(e) => setCatalogCategory(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-chip-on-row)] text-xs font-semibold text-[var(--ink-primary)]"
                >
                  {CATALOG_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-muted)] mb-1">
                  Bahan Baku
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={bahanBaku > 0 ? String(bahanBaku) : ''}
                  onFocus={selectOnFocus}
                  onChange={(e) => handleNumericChange(e, setBahanBaku)}
                  className="w-full px-3 py-2 text-xs font-semibold tabular-nums bg-[var(--bg-chip-on-row)] text-[var(--ink-primary)] rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-muted)] mb-1">
                  Tinta Sablon
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={tintaSablon > 0 ? String(tintaSablon) : ''}
                  onFocus={selectOnFocus}
                  onChange={(e) => handleNumericChange(e, setTintaSablon)}
                  className="w-full px-3 py-2 text-xs font-semibold tabular-nums bg-[var(--bg-chip-on-row)] text-[var(--ink-primary)] rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-muted)] mb-1">
                  Tenaga Kerja
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={tenagaKerja > 0 ? String(tenagaKerja) : ''}
                  onFocus={selectOnFocus}
                  onChange={(e) => handleNumericChange(e, setTenagaKerja)}
                  className="w-full px-3 py-2 text-xs font-semibold tabular-nums bg-[var(--bg-chip-on-row)] text-[var(--ink-primary)] rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-muted)] mb-1">
                  Kemasan
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={kemasan > 0 ? String(kemasan) : ''}
                  onFocus={selectOnFocus}
                  onChange={(e) => handleNumericChange(e, setKemasan)}
                  className="w-full px-3 py-2 text-xs font-semibold tabular-nums bg-[var(--bg-chip-on-row)] text-[var(--ink-primary)] rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-muted)] mb-1">
                  Overhead
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={overhead > 0 ? String(overhead) : ''}
                  onFocus={selectOnFocus}
                  onChange={(e) => handleNumericChange(e, setOverhead)}
                  className="w-full px-3 py-2 text-xs font-semibold tabular-nums bg-[var(--bg-chip-on-row)] text-[var(--ink-primary)] rounded-xl"
                />
              </div>
            </div>

            {/* Live Profit Readout */}
            <div className="p-3 bg-[var(--bg-chip-on-row)] rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-[10px] font-semibold text-[var(--ink-muted)]">
                  HPP / Pcs
                </span>
                <p className="text-xs font-bold text-[var(--ink-primary)] tabular-nums mt-0.5">
                  {formatRp(currentHpp.totalHppPerPcs)}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-[var(--ink-muted)]">
                  Total HPP ({safeQty} pcs)
                </span>
                <p className="text-xs font-bold text-[var(--ink-primary)] tabular-nums mt-0.5">
                  {formatRp(totalHppDisplay)}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-[var(--ink-muted)]">
                  Estimasi Laba
                </span>
                <p className="text-xs font-bold text-[var(--ink-profit)] tabular-nums mt-0.5">
                  {formatRp(profit)}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-[var(--ink-muted)]">
                  Margin
                </span>
                <div className="mt-0.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums ${
                      marginPct >= 25
                        ? 'bg-[#6EEB9A] text-[#14161D]'
                        : marginPct >= 0
                        ? 'bg-[#F9DC7E] text-[#14161D]'
                        : 'bg-[#F29B76] text-[#14161D]'
                    }`}
                  >
                    {marginPct}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Status Pembayaran & Produksi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                Status Pembayaran
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-[var(--bg-subtle)] text-[var(--ink-primary)] rounded-xl min-h-[40px]"
              >
                <option value="LUNAS">Lunas</option>
                <option value="DP">DP (Uang Muka)</option>
                <option value="BELUM_LUNAS">Belum Lunas</option>
              </select>
            </div>

            {paymentStatus === 'DP' ? (
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                  Nominal DP (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={dpAmount > 0 ? String(dpAmount) : ''}
                  onFocus={selectOnFocus}
                  onChange={(e) => handleNumericChange(e, setDpAmount)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold tabular-nums bg-[var(--bg-subtle)] text-[var(--ink-primary)] rounded-xl min-h-[40px]"
                />
                <p className="text-[11px] text-[var(--ink-muted)] mt-1 tabular-nums">
                  Sisa: {formatRp(Math.max(0, totalOmzet - dpAmount))}
                </p>
              </div>
            ) : (
              <div>
                <span className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                  Sisa Piutang
                </span>
                <div className="px-3.5 py-2.5 text-xs font-bold tabular-nums bg-[var(--bg-subtle)] text-[var(--ink-primary)] rounded-xl min-h-[40px] flex items-center">
                  {paymentStatus === 'LUNAS' ? 'Rp 0' : formatRp(totalOmzet)}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                Status Produksi
              </label>
              <select
                value={processStatus}
                onChange={(e) => setProcessStatus(e.target.value as ProcessStatus)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-[var(--bg-subtle)] text-[var(--ink-primary)] rounded-xl min-h-[40px]"
              >
                <option value="ANTREAN">1. Antrean</option>
                <option value="SETTING_DESAIN">2. Setting Desain</option>
                <option value="PROSES_CETAK">3. Proses Cetak</option>
                <option value="FINISHING">4. Finishing</option>
                <option value="SIAP_KIRIM">5. Siap Kirim</option>
                <option value="SELESAI">6. Selesai</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
                Catatan Produksi
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan pengerjaan sablon atau finishing"
                className="w-full px-3.5 py-2.5 text-xs font-medium bg-[var(--bg-subtle)] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] rounded-xl"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 sm:px-6 bg-[var(--bg-row)] flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 py-2 text-xs font-semibold text-[var(--ink-primary)] bg-[var(--bg-chip-on-row)] hover:bg-[var(--bg-hover)] rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form="order-form"
            className="min-h-[40px] px-5 py-2 text-xs font-semibold text-[var(--cta-text)] bg-[var(--cta-bg)] hover:bg-[var(--cta-hover)] rounded-xl transition-colors"
          >
            Simpan Pesanan
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderFormModal() {
  const {
    isFormModalOpen,
    setIsFormModalOpen,
    editingOrder,
    createOrder,
    updateOrder,
  } = useOrders();

  if (!isFormModalOpen) return null;

  return (
    <OrderFormContent
      key={editingOrder?.id ?? 'create'}
      editingOrder={editingOrder}
      onClose={() => setIsFormModalOpen(false)}
      createOrder={createOrder}
      updateOrder={updateOrder}
    />
  );
}
