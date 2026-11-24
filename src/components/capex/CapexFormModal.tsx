'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CapexEntry, CreateCapexInput, CapexCategory } from '@/types/capex';
import CustomSelect from '@/components/shared/CustomSelect';

export const CAPEX_CATEGORIES: CapexCategory[] = [
  'Mesin & Peralatan',
  'Perlengkapan Workshop',
  'Elektronik & IT',
  'Renovasi Workshop',
  'Lainnya',
];

export interface CapexFormModalProps {
  entry: CapexEntry | null;
  onClose: () => void;
  onSave: (data: CreateCapexInput) => Promise<void>;
}

export default function CapexFormModal({ entry, onClose, onSave }: CapexFormModalProps) {
  const [itemName, setItemName] = useState(entry?.itemName ?? '');
  const [category, setCategory] = useState<string>(entry?.category ?? 'Mesin & Peralatan');
  const [amount, setAmount] = useState<number>(entry?.amount ?? 0);
  const [entryDate, setEntryDate] = useState<string>(entry?.entryDate ?? '');
  const [description, setDescription] = useState(entry?.description ?? '');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setFormError('Nama barang wajib diisi.');
      return;
    }
    if (amount <= 0) {
      setFormError('Biaya capex harus lebih besar dari 0.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await onSave({
        itemName: itemName.trim(),
        category,
        amount,
        entryDate,
        description: description.trim() || undefined,
      });
    } catch {
      setFormError('Gagal menyimpan data.');
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="capex-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/55"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-[var(--bg-surface)] text-[var(--ink-primary)] rounded-t-2xl sm:rounded-2xl max-w-md w-full shadow-2xl overflow-hidden z-10">
        <div className="px-5 py-4 flex items-center justify-between">
          <h1 id="capex-modal-title" className="font-bold text-base text-[var(--ink-primary)]">
            {entry ? 'Edit Belanja Modal' : 'Tambah Belanja Modal'}
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
              Nama Barang / Aset *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Mesin Laser Cutting 60W"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] text-xs font-medium text-[var(--ink-primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Kategori
              </label>
              <CustomSelect
                ariaLabel="Kategori belanja modal"
                value={category}
                onChange={setCategory}
                triggerClassName="bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--ink-primary)] min-h-[40px]"
                options={CAPEX_CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </div>

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
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
              Biaya Pembelian (Rp) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={amount === 0 ? '' : amount}
              placeholder="0"
              onFocus={(e) => e.target.select()}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] text-xs font-bold tabular-nums text-[var(--ink-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
              Keterangan
            </label>
            <textarea
              rows={2}
              placeholder="Catatan garansi, vendor, atau spesifikasi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] text-xs font-medium text-[var(--ink-primary)]"
            />
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
              className="px-5 py-2 rounded-xl bg-[#4638F5] hover:bg-[#3B2EE0] text-[#FFFFFF] text-xs font-semibold min-h-[40px]"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Capex'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
