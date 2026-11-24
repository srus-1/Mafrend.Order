'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  RawMaterialEntry,
  CreateRawMaterialInput,
  RawMaterialCategory,
} from '@/types/capex';
import { formatRp } from '@/lib/utils';
import CustomSelect from '@/components/shared/CustomSelect';

export const RAW_MATERIAL_CATEGORIES: RawMaterialCategory[] = [
  'Akrilik & Aksesoris',
  'Tinta & Sablon',
  'Kemasan & Packaging',
  'Sparepart & Consumable',
  'Lainnya',
];

export interface RawMaterialFormModalProps {
  entry: RawMaterialEntry | null;
  onClose: () => void;
  onSave: (data: CreateRawMaterialInput) => Promise<void>;
}

export default function RawMaterialFormModal({
  entry,
  onClose,
  onSave,
}: RawMaterialFormModalProps) {
  const [materialName, setMaterialName] = useState(entry?.materialName ?? '');
  const [category, setCategory] = useState<string>(
    entry?.category ?? 'Akrilik & Aksesoris'
  );
  const [supplier, setSupplier] = useState(entry?.supplier ?? '');
  const [quantity, setQuantity] = useState<number>(entry?.quantity ?? 1);
  const [unit, setUnit] = useState(entry?.unit ?? 'pcs');
  const [unitPrice, setUnitPrice] = useState<number>(entry?.unitPrice ?? 0);
  const [entryDate, setEntryDate] = useState<string>(entry?.entryDate ?? '');
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function initDate() {
      await Promise.resolve();
      if (isMounted && !entry?.entryDate) {
        setEntryDate(new Date().toISOString().split('T')[0]);
      }
    }
    void initDate();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKey);
    };
  }, [entry?.entryDate, onClose]);

  const calculatedTotal = Math.round((Number(quantity) || 0) * (Number(unitPrice) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialName.trim()) {
      setFormError('Nama bahan baku wajib diisi.');
      return;
    }
    if (quantity <= 0) {
      setFormError('Jumlah volume harus lebih besar dari 0.');
      return;
    }
    if (unitPrice < 0) {
      setFormError('Harga satuan tidak boleh negatif.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await onSave({
        materialName: materialName.trim(),
        category,
        supplier: supplier.trim(),
        quantity,
        unit: unit.trim() || 'pcs',
        unitPrice,
        totalAmount: calculatedTotal,
        entryDate,
        notes: notes.trim() || undefined,
      });
    } catch {
      setFormError('Gagal mencatat bahan baku.');
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="material-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/55"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-[var(--bg-surface)] text-[var(--ink-primary)] rounded-t-2xl sm:rounded-2xl max-w-md w-full shadow-2xl overflow-hidden z-10">
        <div className="px-5 py-4 flex items-center justify-between">
          <h1 id="material-modal-title" className="font-bold text-base text-[var(--ink-primary)]">
            {entry ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}
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

        <form onSubmit={handleSubmit} className="px-5 pb-5 flex flex-col gap-3.5">
          {formError && (
            <div className="p-3 rounded-xl bg-[#F29B76] text-[#14161D] text-xs font-semibold">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
              Nama Bahan Baku *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Lembaran Akrilik Bening 3mm"
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] text-xs font-medium text-[var(--ink-primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Kategori
              </label>
              <CustomSelect
                ariaLabel="Kategori bahan baku"
                value={category}
                onChange={setCategory}
                triggerClassName="bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--ink-primary)] min-h-[40px]"
                options={RAW_MATERIAL_CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Supplier / Toko
              </label>
              <input
                type="text"
                placeholder="CV Sentosa"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] text-xs font-medium text-[var(--ink-primary)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Volume *
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                required
                value={quantity}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-subtle)] text-xs font-bold tabular-nums text-[var(--ink-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Satuan
              </label>
              <input
                type="text"
                required
                placeholder="pcs, lembar"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-subtle)] text-xs font-medium text-[var(--ink-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Harga / Satuan
              </label>
              <input
                type="number"
                min="0"
                required
                value={unitPrice === 0 ? '' : unitPrice}
                placeholder="0"
                onFocus={(e) => e.target.select()}
                onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-subtle)] text-xs font-bold tabular-nums text-[var(--ink-primary)]"
              />
            </div>
          </div>

          <div className="p-3.5 bg-[var(--bg-row)] rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--ink-secondary)]">Total Biaya</span>
            <span className="text-sm font-bold text-[var(--ink-primary)] tabular-nums">
              {formatRp(calculatedTotal)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Tanggal
              </label>
              <input
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] text-xs font-medium text-[var(--ink-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Catatan
              </label>
              <input
                type="text"
                placeholder="No nota..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] text-xs font-medium text-[var(--ink-primary)]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--ink-primary)] min-h-[40px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[var(--cta-bg)] hover:bg-[var(--cta-hover)] text-[var(--cta-text)] text-xs font-semibold min-h-[40px]"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Bahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
