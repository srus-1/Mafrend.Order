'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CatalogItem,
  CreateCatalogItemInput,
  CATALOG_CATEGORIES,
} from '@/types/catalog';
import { catalogService } from '@/lib/supabase';
import { formatRp, calculateMargin } from '@/lib/utils';
import ActionMenuDropdown from '@/components/shared/ActionMenuDropdown';
import CustomSelect from '@/components/shared/CustomSelect';
import { Plus, Search, X, Inbox, Check } from 'lucide-react';

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      await Promise.resolve();
      if (!isMounted) return;
      const data = await catalogService.getCatalogItems();
      if (isMounted) {
        setItems(data);
        setLoading(false);
      }
    }

    void loadCatalog();

    const handleSync = () => {
      void loadCatalog();
    };
    window.addEventListener('mafrend:catalog-updated', handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener('mafrend:catalog-updated', handleSync);
    };
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.productName.toLowerCase().includes(q);
        const matchSpecs = item.defaultSpecs.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        if (!matchName && !matchSpecs && !matchCat) return false;
      }
      return true;
    });
  }, [items, selectedCategory, searchQuery]);

  const kpiStats = useMemo(() => {
    if (items.length === 0) {
      return { count: 0, avgHpp: 0, avgMargin: 0 };
    }
    const totalHpp = items.reduce((s, i) => s + i.totalHppPerPcs, 0);
    const margins = items.map((i) =>
      calculateMargin(i.defaultPricePerPcs, i.totalHppPerPcs).marginPct
    );
    const avgMargin =
      Math.round((margins.reduce((s, m) => s + m, 0) / items.length) * 10) / 10;
    return {
      count: items.length,
      avgHpp: Math.round(totalHpp / items.length),
      avgMargin,
    };
  }, [items]);

  const handleSave = async (input: CreateCatalogItemInput) => {
    if (editingItem) {
      const updated = await catalogService.updateCatalogItem(editingItem.id, input);
      if (updated) {
        setItems((prev) => prev.map((c) => (c.id === editingItem.id ? updated : c)));
        showToast('Item katalog diperbarui');
      }
    } else {
      const created = await catalogService.createCatalogItem(input);
      setItems((prev) => [created, ...prev]);
      showToast('Item katalog ditambahkan');
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (item: CatalogItem) => {
    if (!confirm(`Hapus "${item.productName}" dari katalog?`)) return;
    setItems((prev) => prev.filter((c) => c.id !== item.id));
    await catalogService.deleteCatalogItem(item.id);
    showToast('Item katalog dihapus');
  };

  const categoryBadgeStyle = (cat: string) => {
    if (cat === 'Akrilik') return 'bg-[#8EA6FF] text-[#14161D]';
    if (cat === 'Apparel') return 'bg-[#F29B76] text-[#14161D]';
    if (cat === 'Lanyard') return 'bg-[#6EEB9A] text-[#14161D]';
    if (cat === 'Stiker UV') return 'bg-[#F9DC7E] text-[#14161D]';
    return 'bg-[var(--bg-chip-on-row)] text-[var(--ink-primary)]';
  };

  return (
    <div className="flex flex-col gap-4">
      {toastMsg && (
        <div
          role="status"
          className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl bg-[#6EEB9A] text-[#14161D] text-xs font-bold shadow-lg flex items-center gap-2 animate-fade-in-up"
        >
          <Check className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)] truncate">
          Katalog Item
        </h1>

        <button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          aria-label="Tambah Item"
          title="Tambah Item"
          className="inline-flex items-center justify-center gap-1.5 w-[38px] sm:w-auto px-0 sm:px-4 py-2 bg-[var(--cta-bg)] hover:bg-[var(--cta-hover)] text-[var(--cta-text)] shadow-[var(--shadow-card)] text-xs font-semibold rounded-xl transition-all active:scale-[0.97] min-h-[38px] shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.2]" />
          <span className="hidden sm:inline">Tambah Item</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
        <div className="rounded-2xl p-3.5 sm:p-5 bg-[#4638F5] text-[#FFFFFF] shadow-[var(--shadow-card)] flex flex-col justify-between gap-2 min-w-0">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-white/90 truncate">
              Total Item
            </span>
            <span className="sm:hidden px-2 py-0.5 rounded-md bg-[#6EEB9A] text-[#14161D] text-[10px] font-bold tabular-nums shrink-0">
              Margin {kpiStats.avgMargin}%
            </span>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-white/20 text-[#FFFFFF] text-[10px] font-bold shrink-0">
              Aktif
            </span>
          </div>
          <div className="text-base sm:text-2xl font-bold tracking-tight tabular-nums truncate">
            {kpiStats.count} Produk
          </div>
        </div>

        <div className="rounded-2xl p-3.5 sm:p-5 bg-[var(--bg-surface)] shadow-[var(--shadow-card)] flex flex-col justify-between gap-2 min-w-0">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-[var(--ink-muted)] truncate">
              Rata-rata HPP
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#8EA6FF] text-[#14161D] text-[10px] font-bold shrink-0">
              Modal
            </span>
          </div>
          <div className="text-base sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)] tabular-nums truncate">
            {formatRp(kpiStats.avgHpp)}
          </div>
        </div>

        <div className="hidden sm:flex rounded-2xl p-5 bg-[var(--bg-surface)] shadow-[var(--shadow-card)] flex-col justify-between gap-2 min-w-0">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-semibold text-[var(--ink-muted)] truncate">
              Rata-rata Margin
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#6EEB9A] text-[#14161D] text-[10px] font-bold shrink-0">
              Target
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-[var(--ink-profit)] tabular-nums truncate">
            {kpiStats.avgMargin}%
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] shadow-[var(--shadow-card)] rounded-2xl p-3 sm:p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3">
        <div className="grid grid-cols-3 sm:flex sm:items-center gap-1 p-1 bg-[var(--bg-seg-track)] rounded-xl">
          {['ALL', ...CATALOG_CATEGORIES].map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 sm:px-3.5 py-2 min-h-[36px] rounded-lg text-[11px] sm:text-xs font-semibold truncate transition-colors ${
                  active
                    ? 'bg-[#4638F5] text-[#FFFFFF]'
                    : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-surface)]'
                }`}
              >
                {cat === 'ALL' ? 'Semua' : cat}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama produk atau spesifikasi..."
            aria-label="Cari katalog item"
            className="w-full pl-9 pr-8 py-2 min-h-[38px] rounded-xl bg-[var(--bg-subtle)] text-xs font-medium text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Separated Catalog Item Rows */}
      <div className="bg-[var(--bg-surface)] shadow-[var(--shadow-card)] rounded-2xl p-3.5 sm:p-4 flex flex-col gap-2.5">
        {loading ? (
          <div className="py-12 text-center text-xs font-medium text-[var(--ink-muted)]">
            Memuat katalog item...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-14 px-6 bg-[var(--bg-row)] rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-chip-on-row)] flex items-center justify-center text-[var(--ink-muted)] mb-3">
              <Inbox className="w-6 h-6 stroke-[1.6]" />
            </div>
            <h2 className="text-sm font-bold text-[var(--ink-primary)]">Item Tidak Ditemukan</h2>
            <p className="text-xs text-[var(--ink-muted)] mt-1 mb-4">
              Tambahkan standar produk dan modal HPP agar input pesanan otomatis terisi.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[var(--cta-bg)] text-[var(--cta-text)] text-xs font-semibold min-h-[38px]"
            >
              Tambah Item
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const { profit, marginPct } = calculateMargin(
              item.defaultPricePerPcs,
              item.totalHppPerPcs
            );

            return (
              <div
                key={item.id}
                className="p-3 sm:p-4 rounded-xl bg-[var(--bg-row)] hover:bg-[var(--bg-hover)]/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 lg:gap-3"
              >
                <div className="flex items-start justify-between gap-2 min-w-0 lg:w-[290px] shrink-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-[var(--ink-primary)] truncate">
                        {item.productName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${categoryBadgeStyle(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-[var(--ink-muted)] line-clamp-1 mt-0.5 sm:mt-1">
                      {item.defaultSpecs || 'Spesifikasi standar workshop'}
                    </p>
                  </div>

                  <div className="lg:hidden shrink-0">
                    <ActionMenuDropdown
                      ariaLabel={`Menu aksi ${item.productName}`}
                      items={[
                        {
                          label: 'Edit',
                          onClick: () => {
                            setEditingItem(item);
                            setIsModalOpen(true);
                          },
                        },
                        {
                          label: 'Hapus',
                          tone: 'danger',
                          onClick: () => void handleDelete(item),
                        },
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1 lg:hidden">
                  <div>
                    <div className="text-[10px] font-semibold text-[var(--ink-muted)]">HPP / Pcs</div>
                    <div className="text-xs font-bold text-[var(--ink-primary)] tabular-nums">
                      {formatRp(item.totalHppPerPcs)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-[var(--ink-muted)]">Harga Jual</div>
                    <div className="text-xs font-bold text-[var(--ink-primary)] tabular-nums">
                      {formatRp(item.defaultPricePerPcs)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-semibold text-[var(--ink-muted)]">Margin</div>
                    <span
                      title={`Laba ${formatRp(profit)}/pcs`}
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums ${
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

                <div className="grid grid-cols-3 sm:grid-cols-5 lg:flex lg:flex-wrap items-center gap-1.5 flex-1">
                  <span className="px-2 py-1 rounded-lg bg-[var(--bg-chip-on-row)] text-[10px] sm:text-[11px] text-[var(--ink-secondary)] tabular-nums truncate">
                    Bahan <strong className="text-[var(--ink-primary)]">{formatRp(item.hppBahanBaku)}</strong>
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-[var(--bg-chip-on-row)] text-[10px] sm:text-[11px] text-[var(--ink-secondary)] tabular-nums truncate">
                    Tinta <strong className="text-[var(--ink-primary)]">{formatRp(item.hppTintaSablon)}</strong>
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-[var(--bg-chip-on-row)] text-[10px] sm:text-[11px] text-[var(--ink-secondary)] tabular-nums truncate">
                    Kerja <strong className="text-[var(--ink-primary)]">{formatRp(item.hppTenagaKerja)}</strong>
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-[var(--bg-chip-on-row)] text-[10px] sm:text-[11px] text-[var(--ink-secondary)] tabular-nums truncate">
                    Kemas <strong className="text-[var(--ink-primary)]">{formatRp(item.hppKemasan)}</strong>
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-[var(--bg-chip-on-row)] text-[10px] sm:text-[11px] text-[var(--ink-secondary)] tabular-nums truncate">
                    OH <strong className="text-[var(--ink-primary)]">{formatRp(item.hppOverhead)}</strong>
                  </span>
                </div>

                <div className="hidden lg:flex items-center justify-end gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] font-semibold text-[var(--ink-muted)]">
                        HPP / Pcs
                      </div>
                      <div className="text-xs font-bold text-[var(--ink-primary)] tabular-nums">
                        {formatRp(item.totalHppPerPcs)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-semibold text-[var(--ink-muted)]">
                        Harga Jual
                      </div>
                      <div className="text-xs font-bold text-[var(--ink-primary)] tabular-nums">
                        {formatRp(item.defaultPricePerPcs)}
                      </div>
                    </div>

                    <span
                      title={`Laba ${formatRp(profit)}/pcs`}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold tabular-nums ${
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

                  <ActionMenuDropdown
                    ariaLabel={`Menu aksi ${item.productName}`}
                    items={[
                      {
                        label: 'Edit',
                        onClick: () => {
                          setEditingItem(item);
                          setIsModalOpen(true);
                        },
                      },
                      {
                        label: 'Hapus',
                        tone: 'danger',
                        onClick: () => void handleDelete(item),
                      },
                    ]}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <CatalogFormModal
          key={editingItem?.id ?? 'new-catalog'}
          item={editingItem}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

interface CatalogFormModalProps {
  item: CatalogItem | null;
  onClose: () => void;
  onSave: (input: CreateCatalogItemInput) => Promise<void>;
}

function CatalogFormModal({ item, onClose, onSave }: CatalogFormModalProps) {
  const [productName, setProductName] = useState(item?.productName ?? '');
  const [category, setCategory] = useState<string>(item?.category ?? 'Akrilik');
  const [defaultSpecs, setDefaultSpecs] = useState(item?.defaultSpecs ?? '');
  const [defaultPricePerPcs, setDefaultPricePerPcs] = useState<number>(
    item?.defaultPricePerPcs ?? 0
  );
  const [hppBahanBaku, setHppBahanBaku] = useState<number>(item?.hppBahanBaku ?? 0);
  const [hppTintaSablon, setHppTintaSablon] = useState<number>(item?.hppTintaSablon ?? 0);
  const [hppTenagaKerja, setHppTenagaKerja] = useState<number>(item?.hppTenagaKerja ?? 0);
  const [hppKemasan, setHppKemasan] = useState<number>(item?.hppKemasan ?? 0);
  const [hppOverhead, setHppOverhead] = useState<number>(item?.hppOverhead ?? 0);
  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const totalHpp =
    hppBahanBaku + hppTintaSablon + hppTenagaKerja + hppKemasan + hppOverhead;
  const { profit, marginPct } = calculateMargin(defaultPricePerPcs, totalHpp);

  const selectOnFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

  const handleNumeric = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<number>>
  ) => {
    const cleaned = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
    if (e.target.value !== cleaned) e.target.value = cleaned;
    setter(cleaned === '' ? 0 : Number(cleaned));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setError('Nama item wajib diisi.');
      return;
    }
    setSaving(true);
    await onSave({
      productName: productName.trim(),
      category,
      defaultSpecs: defaultSpecs.trim(),
      defaultPricePerPcs,
      hppBahanBaku,
      hppTintaSablon,
      hppTenagaKerja,
      hppKemasan,
      hppOverhead,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/55 overscroll-contain"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full sm:max-w-xl bg-[var(--bg-surface)] text-[var(--ink-primary)] rounded-t-2xl sm:rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.3)] flex flex-col max-h-[92vh] overflow-hidden animate-fade-in-up z-10">
        <div className="px-5 py-4 flex items-center justify-between">
          <h1 id="catalog-modal-title" className="text-base font-bold text-[var(--ink-primary)]">
            {item ? 'Edit Item Katalog' : 'Tambah Item Katalog'}
          </h1>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="w-9 h-9 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--ink-primary)] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 overflow-y-auto flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#F29B76] text-[#14161D] text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Nama Produk *
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Contoh: Ganci Akrilik 2 Sisi 5x5 cm"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] text-xs font-medium text-[var(--ink-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Kategori
              </label>
              <CustomSelect
                ariaLabel="Kategori katalog"
                align="right"
                value={category}
                onChange={setCategory}
                triggerClassName="bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--ink-primary)] min-h-[40px]"
                options={CATALOG_CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Spesifikasi Standar
              </label>
              <input
                type="text"
                value={defaultSpecs}
                onChange={(e) => setDefaultSpecs(e.target.value)}
                placeholder="Akrilik 3mm, UV Print Bolak-Balik, Ring Putar"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] text-xs font-medium text-[var(--ink-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Harga Jual / Pcs (Rp)
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={defaultPricePerPcs > 0 ? String(defaultPricePerPcs) : ''}
                onFocus={selectOnFocus}
                onChange={(e) => handleNumeric(e, setDefaultPricePerPcs)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] text-xs font-bold tabular-nums text-[var(--ink-primary)]"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-row)] flex flex-col gap-3">
            <span className="text-xs font-bold text-[var(--ink-primary)]">
              Komponen Modal Operasional (HPP per Pcs)
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-muted)] mb-1">
                  Bahan
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={hppBahanBaku > 0 ? String(hppBahanBaku) : ''}
                  onFocus={selectOnFocus}
                  onChange={(e) => handleNumeric(e, setHppBahanBaku)}
                  className="w-full px-2.5 py-2 rounded-xl bg-[var(--bg-chip-on-row)] text-xs font-semibold tabular-nums text-[var(--ink-primary)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-muted)] mb-1">
                  Tinta
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={hppTintaSablon > 0 ? String(hppTintaSablon) : ''}
                  onFocus={selectOnFocus}
                  onChange={(e) => handleNumeric(e, setHppTintaSablon)}
                  className="w-full px-2.5 py-2 rounded-xl bg-[var(--bg-chip-on-row)] text-xs font-semibold tabular-nums text-[var(--ink-primary)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-muted)] mb-1">
                  Kerja
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={hppTenagaKerja > 0 ? String(hppTenagaKerja) : ''}
                  onFocus={selectOnFocus}
                  onChange={(e) => handleNumeric(e, setHppTenagaKerja)}
                  className="w-full px-2.5 py-2 rounded-xl bg-[var(--bg-chip-on-row)] text-xs font-semibold tabular-nums text-[var(--ink-primary)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-muted)] mb-1">
                  Kemas
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={hppKemasan > 0 ? String(hppKemasan) : ''}
                  onFocus={selectOnFocus}
                  onChange={(e) => handleNumeric(e, setHppKemasan)}
                  className="w-full px-2.5 py-2 rounded-xl bg-[var(--bg-chip-on-row)] text-xs font-semibold tabular-nums text-[var(--ink-primary)]"
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
                  value={hppOverhead > 0 ? String(hppOverhead) : ''}
                  onFocus={selectOnFocus}
                  onChange={(e) => handleNumeric(e, setHppOverhead)}
                  className="w-full px-2.5 py-2 rounded-xl bg-[var(--bg-chip-on-row)] text-xs font-semibold tabular-nums text-[var(--ink-primary)]"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-chip-on-row)] grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10px] font-semibold text-[var(--ink-muted)]">Total HPP</div>
                <div className="text-xs font-bold text-[var(--ink-primary)] tabular-nums mt-0.5">
                  {formatRp(totalHpp)}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-[var(--ink-muted)]">Laba / Pcs</div>
                <div className="text-xs font-bold text-[var(--ink-profit)] tabular-nums mt-0.5">
                  {formatRp(profit)}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-[var(--ink-muted)]">Margin</div>
                <div className="mt-0.5">
                  <span className="px-2 py-0.5 rounded-md bg-[#6EEB9A] text-[#14161D] text-[11px] font-bold tabular-nums">
                    {marginPct}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--ink-primary)]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[40px] px-5 py-2 rounded-xl bg-[var(--cta-bg)] hover:bg-[var(--cta-hover)] text-xs font-semibold text-[var(--cta-text)]"
            >
              {saving ? 'Menyimpan...' : 'Simpan Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
