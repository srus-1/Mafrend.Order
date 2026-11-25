'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Calendar,
  Search,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import {
  CapexEntry,
  CreateCapexInput,
  RawMaterialEntry,
  CreateRawMaterialInput,
} from '@/types/capex';
import { capexService, rawMaterialService } from '@/lib/supabase';
import { formatRp, formatMonthLabel } from '@/lib/utils';
import CustomSelect from '@/components/shared/CustomSelect';
import CapexFormModal from '@/components/capex/CapexFormModal';
import RawMaterialFormModal from '@/components/capex/RawMaterialFormModal';
import CapexSpendingSections from '@/components/capex/CapexSpendingSections';

export default function CapexPage() {
  const {
    selectedMonth,
    setSelectedMonth,
    availableMonths = [],
  } = useOrders();

  const [capexList, setCapexList] = useState<CapexEntry[]>(
    () => capexService.getCachedCapexEntries() ?? []
  );
  const [rawMaterialsList, setRawMaterialsList] = useState<RawMaterialEntry[]>(
    () => rawMaterialService.getCachedRawMaterialEntries() ?? []
  );
  const [loading, setLoading] = useState<boolean>(
    () =>
      capexService.getCachedCapexEntries() === null ||
      rawMaterialService.getCachedRawMaterialEntries() === null
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'CAPEX' | 'RAW_MATERIAL'>('ALL');

  const [isCapexModalOpen, setIsCapexModalOpen] = useState<boolean>(false);
  const [editingCapex, setEditingCapex] = useState<CapexEntry | null>(null);

  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState<boolean>(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterialEntry | null>(null);

  const [deletingTarget, setDeletingTarget] = useState<{
    type: 'capex' | 'material';
    id: string;
    title: string;
  } | null>(null);

  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setFeedbackNotice({ type, message });
    setTimeout(() => setFeedbackNotice(null), 3200);
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      await Promise.resolve();
      if (!isMounted) return;
      try {
        const [capexData, materialsData] = await Promise.all([
          capexService.getCapexEntries(),
          rawMaterialService.getRawMaterialEntries(),
        ]);
        if (isMounted) {
          setCapexList(capexData);
          setRawMaterialsList(materialsData);
        }
      } catch (err) {
        console.error('Failed to load capex and materials:', err);
        if (isMounted) {
          showNotice('error', 'Gagal memuat data belanja.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    void loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCapex = useMemo(() => {
    return capexList.filter((item) => {
      const matchMonth =
        !selectedMonth || selectedMonth === 'ALL'
          ? true
          : item.entryDate.startsWith(selectedMonth);

      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.itemName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));

      return matchMonth && matchSearch;
    });
  }, [capexList, selectedMonth, searchQuery]);

  const filteredMaterials = useMemo(() => {
    return rawMaterialsList.filter((item) => {
      const matchMonth =
        !selectedMonth || selectedMonth === 'ALL'
          ? true
          : item.entryDate.startsWith(selectedMonth);

      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.materialName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.supplier.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q));

      return matchMonth && matchSearch;
    });
  }, [rawMaterialsList, selectedMonth, searchQuery]);

  const totalCapexAmount = useMemo(
    () => filteredCapex.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
    [filteredCapex]
  );

  const totalMaterialsAmount = useMemo(
    () => filteredMaterials.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0),
    [filteredMaterials]
  );

  const totalSpending = totalCapexAmount + totalMaterialsAmount;
  const totalTransactions = filteredCapex.length + filteredMaterials.length;
  const averageSpending =
    totalTransactions > 0 ? Math.round(totalSpending / totalTransactions) : 0;

  const displayMonths = useMemo(() => {
    const set = new Set<string>();
    if (selectedMonth && selectedMonth !== 'ALL') set.add(selectedMonth);
    availableMonths.forEach((m) => {
      if (m && m !== 'ALL') set.add(m);
    });
    capexList.forEach((c) => {
      if (c.entryDate && c.entryDate.length >= 7) set.add(c.entryDate.slice(0, 7));
    });
    rawMaterialsList.forEach((m) => {
      if (m.entryDate && m.entryDate.length >= 7) set.add(m.entryDate.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [availableMonths, selectedMonth, capexList, rawMaterialsList]);

  const handleSaveCapex = async (data: CreateCapexInput) => {
    if (editingCapex) {
      const prev = [...capexList];
      const optimisticUpdated: CapexEntry = {
        ...editingCapex,
        itemName: data.itemName,
        category: data.category,
        amount: Number(data.amount) || 0,
        entryDate: data.entryDate,
        description: data.description,
        updatedAt: new Date().toISOString(),
      };
      setCapexList((curr) => curr.map((c) => (c.id === editingCapex.id ? optimisticUpdated : c)));
      setIsCapexModalOpen(false);
      setEditingCapex(null);

      try {
        const result = await capexService.updateCapexEntry(editingCapex.id, data);
        if (result) {
          setCapexList((curr) => curr.map((c) => (c.id === editingCapex.id ? result : c)));
          showNotice('success', 'Capex diperbarui');
        }
      } catch {
        setCapexList(prev);
        showNotice('error', 'Gagal memperbarui capex');
      }
    } else {
      const tempId = `temp-cpx-${Date.now()}`;
      const nowIso = new Date().toISOString();
      const optimisticNew: CapexEntry = {
        id: tempId,
        itemName: data.itemName,
        category: data.category,
        amount: Number(data.amount) || 0,
        entryDate: data.entryDate,
        description: data.description,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setCapexList((curr) => [optimisticNew, ...curr]);
      setIsCapexModalOpen(false);

      try {
        const created = await capexService.createCapexEntry(data);
        setCapexList((curr) => curr.map((c) => (c.id === tempId ? created : c)));
        showNotice('success', 'Capex ditambahkan');
      } catch {
        setCapexList((curr) => curr.filter((c) => c.id !== tempId));
        showNotice('error', 'Gagal menyimpan capex');
      }
    }
  };

  const handleSaveMaterial = async (data: CreateRawMaterialInput) => {
    if (editingMaterial) {
      const prev = [...rawMaterialsList];
      const safeQty = Number(data.quantity) || 1;
      const safeUnitPrice = Number(data.unitPrice) || 0;
      const calcTotal = data.totalAmount ?? Math.round(safeQty * safeUnitPrice);

      const optimisticUpdated: RawMaterialEntry = {
        ...editingMaterial,
        materialName: data.materialName,
        category: data.category,
        supplier: data.supplier,
        quantity: safeQty,
        qty: safeQty,
        unit: data.unit,
        unitPrice: safeUnitPrice,
        totalAmount: calcTotal,
        entryDate: data.entryDate,
        notes: data.notes,
        updatedAt: new Date().toISOString(),
      };
      setRawMaterialsList((curr) =>
        curr.map((m) => (m.id === editingMaterial.id ? optimisticUpdated : m))
      );
      setIsMaterialModalOpen(false);
      setEditingMaterial(null);

      try {
        const result = await rawMaterialService.updateRawMaterialEntry(editingMaterial.id, data);
        if (result) {
          setRawMaterialsList((curr) =>
            curr.map((m) => (m.id === editingMaterial.id ? result : m))
          );
          showNotice('success', 'Bahan baku diperbarui');
        }
      } catch {
        setRawMaterialsList(prev);
        showNotice('error', 'Gagal memperbarui bahan baku');
      }
    } else {
      const tempId = `temp-mat-${Date.now()}`;
      const nowIso = new Date().toISOString();
      const safeQty = Number(data.quantity) || 1;
      const safeUnitPrice = Number(data.unitPrice) || 0;
      const calcTotal = data.totalAmount ?? Math.round(safeQty * safeUnitPrice);

      const optimisticNew: RawMaterialEntry = {
        id: tempId,
        materialName: data.materialName,
        category: data.category,
        supplier: data.supplier,
        quantity: safeQty,
        qty: safeQty,
        unit: data.unit,
        unitPrice: safeUnitPrice,
        totalAmount: calcTotal,
        entryDate: data.entryDate,
        notes: data.notes,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setRawMaterialsList((curr) => [optimisticNew, ...curr]);
      setIsMaterialModalOpen(false);

      try {
        const created = await rawMaterialService.createRawMaterialEntry(data);
        setRawMaterialsList((curr) => curr.map((m) => (m.id === tempId ? created : m)));
        showNotice('success', 'Bahan baku dicatat');
      } catch {
        setRawMaterialsList((curr) => curr.filter((m) => m.id !== tempId));
        showNotice('error', 'Gagal mencatat bahan baku');
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    const { type, id } = deletingTarget;

    if (type === 'capex') {
      const prev = [...capexList];
      setCapexList((curr) => curr.filter((c) => c.id !== id));
      setDeletingTarget(null);
      try {
        await capexService.deleteCapexEntry(id);
        showNotice('success', 'Data capex dihapus');
      } catch {
        setCapexList(prev);
        showNotice('error', 'Gagal menghapus capex');
      }
    } else {
      const prev = [...rawMaterialsList];
      setRawMaterialsList((curr) => curr.filter((m) => m.id !== id));
      setDeletingTarget(null);
      try {
        await rawMaterialService.deleteRawMaterialEntry(id);
        showNotice('success', 'Data bahan baku dihapus');
      } catch {
        setRawMaterialsList(prev);
        showNotice('error', 'Gagal menghapus bahan baku');
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {feedbackNotice && (
        <div
          role="status"
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold animate-fade-in-up ${
            feedbackNotice.type === 'success'
              ? 'bg-[#6EEB9A] text-[#14161D]'
              : 'bg-[#F29B76] text-[#14161D]'
          }`}
        >
          {feedbackNotice.type === 'success' ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{feedbackNotice.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)] truncate">
            Capex & Bahan Baku
          </h1>

          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditingCapex(null);
                setIsCapexModalOpen(true);
              }}
              aria-label="Tambah Capex"
              title="Tambah Capex"
              className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] shadow-[var(--shadow-card)] text-[var(--ink-primary)] text-[11px] font-semibold min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Capex</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingMaterial(null);
                setIsMaterialModalOpen(true);
              }}
              aria-label="Tambah Bahan"
              title="Tambah Bahan"
              className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-[var(--cta-bg)] hover:bg-[var(--cta-hover)] shadow-[var(--shadow-card)] text-[var(--cta-text)] text-[11px] font-semibold min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Bahan</span>
            </button>
          </div>
        </div>

        <div className="hidden sm:flex flex-wrap items-center gap-2">
          <div className="min-w-[172px]">
            <CustomSelect
              id="capex-month-select"
              ariaLabel="Pilih bulan pengeluaran"
              align="right"
              value={selectedMonth}
              onChange={setSelectedMonth}
              leadingIcon={<Calendar className="w-3.5 h-3.5 text-[var(--ink-muted)]" />}
              triggerClassName="bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--ink-primary)] shadow-[var(--shadow-card)]"
              options={[
                { value: 'ALL', label: 'Semua Bulan' },
                ...displayMonths.map((m) => ({
                  value: m,
                  label: formatMonthLabel(m),
                })),
              ]}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingCapex(null);
              setIsCapexModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] shadow-[var(--shadow-card)] text-[var(--ink-primary)] text-xs font-semibold transition-all active:scale-[0.97] min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Capex</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingMaterial(null);
              setIsMaterialModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--cta-bg)] hover:bg-[var(--cta-hover)] shadow-[var(--shadow-card)] text-[var(--cta-text)] text-xs font-semibold transition-all active:scale-[0.97] min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bahan</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="rounded-2xl p-3.5 sm:p-5 bg-[#4638F5] text-[#FFFFFF] shadow-[var(--shadow-card)] flex flex-col justify-between gap-2 sm:gap-3 min-w-0">
          <span className="text-[11px] sm:text-xs font-semibold text-white/90 truncate">
            Total Belanja
          </span>
          <div className="text-[clamp(0.95rem,3.6vw,1.25rem)] sm:text-[clamp(1.1rem,1.5vw,1.4rem)] font-bold tracking-tight leading-tight tabular-nums break-words">
            {formatRp(totalSpending)}
          </div>
          <div>
            <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#6EEB9A] text-[#14161D] text-[10px] sm:text-[11px] font-bold">
              {loading ? '...' : `${totalTransactions} transaksi`}
            </span>
          </div>
        </div>

        <div className="rounded-2xl p-3.5 sm:p-5 bg-[var(--bg-surface)] shadow-[var(--shadow-card)] flex flex-col justify-between gap-2 sm:gap-3 min-w-0">
          <span className="text-[11px] sm:text-xs font-semibold text-[var(--ink-muted)] truncate">
            Belanja Modal (Capex)
          </span>
          <div className="text-[clamp(0.95rem,3.6vw,1.25rem)] sm:text-[clamp(1.1rem,1.5vw,1.4rem)] font-bold tracking-tight leading-tight text-[var(--ink-primary)] tabular-nums break-words">
            {formatRp(totalCapexAmount)}
          </div>
          <div>
            <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#8EA6FF] text-[#14161D] text-[10px] sm:text-[11px] font-bold">
              {filteredCapex.length} aset
            </span>
          </div>
        </div>

        <div className="rounded-2xl p-3.5 sm:p-5 bg-[var(--bg-surface)] shadow-[var(--shadow-card)] flex flex-col justify-between gap-2 sm:gap-3 min-w-0">
          <span className="text-[11px] sm:text-xs font-semibold text-[var(--ink-muted)] truncate">
            Bahan Baku Berulang
          </span>
          <div className="text-[clamp(0.95rem,3.6vw,1.25rem)] sm:text-[clamp(1.1rem,1.5vw,1.4rem)] font-bold tracking-tight leading-tight text-[var(--ink-primary)] tabular-nums break-words">
            {formatRp(totalMaterialsAmount)}
          </div>
          <div>
            <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#F9DC7E] text-[#14161D] text-[10px] sm:text-[11px] font-bold">
              {filteredMaterials.length} restock
            </span>
          </div>
        </div>

        <div className="rounded-2xl p-3.5 sm:p-5 bg-[var(--bg-surface)] shadow-[var(--shadow-card)] flex flex-col justify-between gap-2 sm:gap-3 min-w-0">
          <span className="text-[11px] sm:text-xs font-semibold text-[var(--ink-muted)] truncate">
            Rata-rata Transaksi
          </span>
          <div className="text-[clamp(0.95rem,3.6vw,1.25rem)] sm:text-[clamp(1.1rem,1.5vw,1.4rem)] font-bold tracking-tight leading-tight text-[var(--ink-primary)] tabular-nums break-words">
            {formatRp(averageSpending)}
          </div>
          <div>
            <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#F29B76] text-[#14161D] text-[10px] sm:text-[11px] font-bold">
              Per nota
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] shadow-[var(--shadow-card)] rounded-2xl p-3 sm:p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3">
        <div className="grid grid-cols-3 sm:flex sm:items-center gap-1 p-1 bg-[var(--bg-seg-track)] rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-2 sm:px-3.5 py-2 min-h-[36px] rounded-lg text-[11px] sm:text-xs font-semibold truncate transition-colors ${
              activeTab === 'ALL'
                ? 'bg-[#4638F5] text-[#FFFFFF]'
                : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-surface)]'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CAPEX')}
            className={`px-2 sm:px-3.5 py-2 min-h-[36px] rounded-lg text-[11px] sm:text-xs font-semibold truncate transition-colors ${
              activeTab === 'CAPEX'
                ? 'bg-[#4638F5] text-[#FFFFFF]'
                : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-surface)]'
            }`}
          >
            Capex ({filteredCapex.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RAW_MATERIAL')}
            className={`px-2 sm:px-3.5 py-2 min-h-[36px] rounded-lg text-[11px] sm:text-xs font-semibold truncate transition-colors ${
              activeTab === 'RAW_MATERIAL'
                ? 'bg-[#4638F5] text-[#FFFFFF]'
                : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-surface)]'
            }`}
          >
            Bahan ({filteredMaterials.length})
          </button>
        </div>

        <div className="grid grid-cols-12 sm:block gap-2 w-full lg:w-72">
          <div className="relative col-span-7 sm:w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Cari aset, bahan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Cari pengeluaran"
              className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-2 min-h-[38px] rounded-xl bg-[var(--bg-subtle)] text-xs font-medium text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus pencarian"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="col-span-5 sm:hidden min-w-0">
            <CustomSelect
              id="capex-month-select-mobile"
              ariaLabel="Pilih bulan pengeluaran"
              align="right"
              value={selectedMonth}
              onChange={setSelectedMonth}
              leadingIcon={<Calendar className="w-3.5 h-3.5 text-[var(--ink-muted)]" />}
              triggerClassName="bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--ink-primary)]"
              options={[
                { value: 'ALL', label: 'Semua' },
                ...displayMonths.map((m) => ({
                  value: m,
                  label: formatMonthLabel(m),
                })),
              ]}
            />
          </div>
        </div>
      </div>

      <CapexSpendingSections
        activeTab={activeTab}
        selectedMonth={selectedMonth}
        filteredCapex={filteredCapex}
        filteredMaterials={filteredMaterials}
        totalCapexAmount={totalCapexAmount}
        totalMaterialsAmount={totalMaterialsAmount}
        onEditCapex={(item) => {
          setEditingCapex(item);
          setIsCapexModalOpen(true);
        }}
        onEditMaterial={(item) => {
          setEditingMaterial(item);
          setIsMaterialModalOpen(true);
        }}
        onRequestDelete={setDeletingTarget}
        onNoticeError={(msg) => showNotice('error', msg)}
      />

      {isCapexModalOpen && (
        <CapexFormModal
          key={editingCapex?.id ?? 'new-capex'}
          entry={editingCapex}
          onClose={() => {
            setIsCapexModalOpen(false);
            setEditingCapex(null);
          }}
          onSave={handleSaveCapex}
        />
      )}

      {isMaterialModalOpen && (
        <RawMaterialFormModal
          key={editingMaterial?.id ?? 'new-material'}
          entry={editingMaterial}
          onClose={() => {
            setIsMaterialModalOpen(false);
            setEditingMaterial(null);
          }}
          onSave={handleSaveMaterial}
        />
      )}

      {deletingTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55"
        >
          <div className="bg-[var(--bg-surface)] text-[var(--ink-primary)] rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h1 id="delete-dialog-title" className="font-bold text-sm text-[var(--ink-primary)]">
              Hapus Pengeluaran Ini?
            </h1>
            <p className="text-xs text-[var(--ink-secondary)] mt-2 mb-4">
              Yakin ingin menghapus <strong>{deletingTarget.title}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingTarget(null)}
                className="px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--ink-primary)] min-h-[38px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-[#F29B76] text-[#14161D] text-xs font-bold min-h-[38px]"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
