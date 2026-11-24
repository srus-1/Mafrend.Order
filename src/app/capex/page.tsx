'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Calendar,
  Search,
  X,
  Check,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import {
  CapexEntry,
  CreateCapexInput,
  RawMaterialEntry,
  CreateRawMaterialInput,
} from '@/types/capex';
import { capexService, rawMaterialService } from '@/lib/supabase';
import { formatRp, formatDateShort, formatMonthLabel } from '@/lib/utils';
import {
  exportCapexToCSV,
  exportRawMaterialsToCSV,
  downloadCSVFile,
  exportCapexToPDF,
  exportRawMaterialsToPDF,
} from '@/lib/csvExport';
import {
  downloadCapexExcelXlsx,
  downloadRawMaterialsExcelXlsx,
} from '@/lib/excelExport';
import ExportMenuButton from '@/components/shared/ExportMenuButton';
import ActionMenuDropdown from '@/components/shared/ActionMenuDropdown';
import CustomSelect from '@/components/shared/CustomSelect';
import CapexFormModal from '@/components/capex/CapexFormModal';
import RawMaterialFormModal from '@/components/capex/RawMaterialFormModal';

export default function CapexPage() {
  const {
    selectedMonth,
    setSelectedMonth,
    availableMonths = [],
  } = useOrders();

  const [capexList, setCapexList] = useState<CapexEntry[]>([]);
  const [rawMaterialsList, setRawMaterialsList] = useState<RawMaterialEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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

      {/* Clean Single-Line Header (Zero Sub-Headline) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)]">
          Capex & Bahan Baku
        </h1>

        <div className="flex flex-wrap items-center gap-2">
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

      {/* 4 Borderless KPI Cards (Bottom Vivid Pills per FigCraft Frame 05) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl p-5 bg-[#4638F5] text-[#FFFFFF] shadow-[var(--shadow-card)] flex flex-col justify-between gap-3">
          <span className="text-xs font-semibold text-white/90">Total Belanja</span>
          <div className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums">
            {formatRp(totalSpending)}
          </div>
          <div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#6EEB9A] text-[#14161D] text-[11px] font-bold">
              {loading ? '...' : `${totalTransactions} transaksi tercatat`}
            </span>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-[var(--bg-surface)] shadow-[var(--shadow-card)] flex flex-col justify-between gap-3">
          <span className="text-xs font-semibold text-[var(--ink-muted)]">Belanja Modal (Capex)</span>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)] tabular-nums">
            {formatRp(totalCapexAmount)}
          </div>
          <div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#8EA6FF] text-[#14161D] text-[11px] font-bold">
              {filteredCapex.length} investasi alat
            </span>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-[var(--bg-surface)] shadow-[var(--shadow-card)] flex flex-col justify-between gap-3">
          <span className="text-xs font-semibold text-[var(--ink-muted)]">Bahan Baku Berulang</span>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)] tabular-nums">
            {formatRp(totalMaterialsAmount)}
          </div>
          <div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F9DC7E] text-[#14161D] text-[11px] font-bold">
              {filteredMaterials.length} restock bahan
            </span>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-[var(--bg-surface)] shadow-[var(--shadow-card)] flex flex-col justify-between gap-3">
          <span className="text-xs font-semibold text-[var(--ink-muted)]">Rata-rata Transaksi</span>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)] tabular-nums">
            {formatRp(averageSpending)}
          </div>
          <div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F29B76] text-[#14161D] text-[11px] font-bold">
              Per nota belanja
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[var(--bg-surface)] shadow-[var(--shadow-card)] rounded-2xl p-3 sm:p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-[var(--bg-seg-track)] rounded-xl overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-2 min-h-[36px] rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
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
            className={`px-3.5 py-2 min-h-[36px] rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
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
            className={`px-3.5 py-2 min-h-[36px] rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'RAW_MATERIAL'
                ? 'bg-[#4638F5] text-[#FFFFFF]'
                : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-surface)]'
            }`}
          >
            Bahan Baku ({filteredMaterials.length})
          </button>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Cari aset, bahan baku, atau supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Cari pengeluaran"
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

      {/* SECTION 1: CAPEX (Zero Sub-Headline, Separated Row Cards) */}
      {(activeTab === 'ALL' || activeTab === 'CAPEX') && (
        <div className="bg-[var(--bg-surface)] shadow-[var(--shadow-card)] rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold text-[var(--ink-primary)]">
                Belanja Modal (Capex)
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-[#8EA6FF] text-[#14161D] text-[10px] font-bold">
                {filteredCapex.length} item
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-[var(--ink-primary)] tabular-nums">
                {formatRp(totalCapexAmount)}
              </span>
              <ExportMenuButton
                label="Unduh Laporan"
                ariaLabel="Unduh CSV, Excel, atau PDF capex"
                variant="light-neutral"
                onExportExcel={() => {
                  void downloadCapexExcelXlsx(
                    filteredCapex,
                    formatMonthLabel(selectedMonth),
                    `mafrend-studio-capex-${selectedMonth || 'all'}.xlsx`,
                    (msg) => showNotice('error', msg)
                  );
                }}
                onExportPDF={() => {
                  exportCapexToPDF(filteredCapex, formatMonthLabel(selectedMonth));
                }}
                onExportCSV={() => {
                  const csvContent = exportCapexToCSV(filteredCapex);
                  downloadCSVFile(
                    `mafrend-studio-capex-ml-${selectedMonth || 'all'}.csv`,
                    csvContent
                  );
                }}
              />
            </div>
          </div>

          {filteredCapex.length === 0 ? (
            <div className="py-12 px-6 bg-[var(--bg-row)] rounded-xl flex flex-col items-center justify-center text-center">
              <Inbox className="w-6 h-6 text-[var(--ink-muted)] mb-2" />
              <p className="text-xs font-medium text-[var(--ink-muted)]">
                Belum ada belanja modal pada periode ini.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-3.5 text-[11px] font-semibold text-[var(--ink-muted)]">
                <span className="col-span-4">Aset & Kategori</span>
                <span className="col-span-2">Tanggal</span>
                <span className="col-span-3">Keterangan</span>
                <span className="col-span-3 text-right">Biaya & Aksi</span>
              </div>

              {filteredCapex.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[var(--bg-row)] hover:bg-[var(--bg-hover)]/70 transition-colors grid grid-cols-1 lg:grid-cols-12 lg:items-center gap-3"
                >
                  <div className="lg:col-span-4 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-[var(--ink-primary)] truncate">
                        {item.itemName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#8EA6FF] text-[#14161D] text-[10px] font-bold shrink-0">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-2 text-[11px] font-medium text-[var(--ink-muted)] tabular-nums">
                    {formatDateShort(item.entryDate)}
                  </div>

                  <div className="lg:col-span-3 text-xs text-[var(--ink-secondary)] line-clamp-1">
                    {item.description || '-'}
                  </div>

                  <div className="lg:col-span-3 flex items-center justify-between lg:justify-end gap-3">
                    <span className="text-xs sm:text-sm font-bold text-[var(--ink-primary)] tabular-nums">
                      {formatRp(item.amount)}
                    </span>

                    <ActionMenuDropdown
                      ariaLabel={`Menu aksi ${item.itemName}`}
                      items={[
                        {
                          label: 'Edit',
                          onClick: () => {
                            setEditingCapex(item);
                            setIsCapexModalOpen(true);
                          },
                        },
                        {
                          label: 'Hapus',
                          tone: 'danger',
                          onClick: () =>
                            setDeletingTarget({
                              type: 'capex',
                              id: item.id,
                              title: item.itemName,
                            }),
                        },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: RAW MATERIALS (Zero Sub-Headline, Separated Row Cards) */}
      {(activeTab === 'ALL' || activeTab === 'RAW_MATERIAL') && (
        <div className="bg-[var(--bg-surface)] shadow-[var(--shadow-card)] rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold text-[var(--ink-primary)]">
                Bahan Baku Berulang
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-[#F9DC7E] text-[#14161D] text-[10px] font-bold">
                {filteredMaterials.length} item
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-[var(--ink-primary)] tabular-nums">
                {formatRp(totalMaterialsAmount)}
              </span>
              <ExportMenuButton
                label="Unduh Laporan"
                ariaLabel="Unduh CSV, Excel, atau PDF bahan baku"
                variant="light-neutral"
                onExportExcel={() => {
                  void downloadRawMaterialsExcelXlsx(
                    filteredMaterials,
                    formatMonthLabel(selectedMonth),
                    `mafrend-studio-bahan-baku-${selectedMonth || 'all'}.xlsx`,
                    (msg) => showNotice('error', msg)
                  );
                }}
                onExportPDF={() => {
                  exportRawMaterialsToPDF(
                    filteredMaterials,
                    formatMonthLabel(selectedMonth)
                  );
                }}
                onExportCSV={() => {
                  const csvContent = exportRawMaterialsToCSV(filteredMaterials);
                  downloadCSVFile(
                    `mafrend-studio-raw-materials-ml-${selectedMonth || 'all'}.csv`,
                    csvContent
                  );
                }}
              />
            </div>
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="py-12 px-6 bg-[var(--bg-row)] rounded-xl flex flex-col items-center justify-center text-center">
              <Inbox className="w-6 h-6 text-[var(--ink-muted)] mb-2" />
              <p className="text-xs font-medium text-[var(--ink-muted)]">
                Belum ada belanja bahan baku pada periode ini.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-3.5 text-[11px] font-semibold text-[var(--ink-muted)]">
                <span className="col-span-4">Bahan & Kategori</span>
                <span className="col-span-3">Supplier & Tanggal</span>
                <span className="col-span-2">Volume & Harga</span>
                <span className="col-span-3 text-right">Total & Aksi</span>
              </div>

              {filteredMaterials.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[var(--bg-row)] hover:bg-[var(--bg-hover)]/70 transition-colors grid grid-cols-1 lg:grid-cols-12 lg:items-center gap-3"
                >
                  <div className="lg:col-span-4 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-[var(--ink-primary)] truncate">
                        {item.materialName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#F9DC7E] text-[#14161D] text-[10px] font-bold shrink-0">
                        {item.category}
                      </span>
                    </div>
                    {item.notes && (
                      <div className="text-[11px] text-[var(--ink-muted)] truncate mt-0.5">
                        {item.notes}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-3 min-w-0 text-[11px] text-[var(--ink-secondary)]">
                    <div className="font-semibold text-[var(--ink-primary)] truncate">
                      {item.supplier || '-'}
                    </div>
                    <div className="text-[var(--ink-muted)] tabular-nums mt-0.5">
                      {formatDateShort(item.entryDate)}
                    </div>
                  </div>

                  <div className="lg:col-span-2 flex items-center">
                    <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-chip-on-row)] text-[11px] font-bold text-[var(--ink-primary)] tabular-nums whitespace-nowrap">
                      {item.quantity} {item.unit} @ {formatRp(item.unitPrice)}
                    </span>
                  </div>

                  <div className="lg:col-span-3 flex items-center justify-between lg:justify-end gap-3">
                    <span className="text-xs sm:text-sm font-bold text-[var(--ink-primary)] tabular-nums text-right">
                      {formatRp(item.totalAmount)}
                    </span>

                    <ActionMenuDropdown
                      ariaLabel={`Menu aksi ${item.materialName}`}
                      items={[
                        {
                          label: 'Edit',
                          onClick: () => {
                            setEditingMaterial(item);
                            setIsMaterialModalOpen(true);
                          },
                        },
                        {
                          label: 'Hapus',
                          tone: 'danger',
                          onClick: () =>
                            setDeletingTarget({
                              type: 'material',
                              id: item.id,
                              title: item.materialName,
                            }),
                        },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
