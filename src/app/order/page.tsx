'use client';

import React from 'react';
import { useOrders } from '@/context/OrderContext';
import OrderFilterTabs from '@/components/order/OrderFilterTabs';
import OrderSortableList from '@/components/order/OrderSortableList';
import { ArrowUpDown, Plus } from 'lucide-react';
import {
  exportOrdersToCSV,
  downloadCSVFile,
  exportOrdersToPDF,
} from '@/lib/csvExport';
import { downloadOrdersExcelXlsx } from '@/lib/excelExport';
import ExportMenuButton from '@/components/shared/ExportMenuButton';

export default function OrderPage() {
  const {
    orders,
    searchQuery,
    filterTab,
    dateFilter,
    openCreateModal,
    loading,
    selectedOrderIds = [],
    selectAllOrders,
    clearSelectedOrders,
  } = useOrders();

  const [sortOrder, setSortOrder] = React.useState<'QUEUE' | 'NEWEST' | 'OLDEST'>('QUEUE');

  const sortedOrders = React.useMemo(() => {
    const filtered = orders.filter((order) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = order.buyerName.toLowerCase().includes(q);
        const matchNumber = order.orderNumber.toLowerCase().includes(q);
        const matchProduct = order.productName.toLowerCase().includes(q);
        const matchSpecs = order.specs.toLowerCase().includes(q);
        if (!matchName && !matchNumber && !matchProduct && !matchSpecs) {
          return false;
        }
      }

      if (filterTab === 'BELUM_LUNAS_DP') {
        if (order.paymentStatus !== 'BELUM_LUNAS' && order.paymentStatus !== 'DP') {
          return false;
        }
      } else if (filterTab === 'PROSES') {
        if (order.processStatus === 'SELESAI') {
          return false;
        }
      } else if (filterTab === 'SELESAI') {
        if (order.processStatus !== 'SELESAI') {
          return false;
        }
      }

      if (dateFilter) {
        if (order.deadline !== dateFilter && order.orderDate !== dateFilter) {
          return false;
        }
      }

      return true;
    });

    if (sortOrder === 'QUEUE') {
      return [...filtered].sort((a, b) => (a.queueOrder || 0) - (b.queueOrder || 0));
    }

    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.orderDate).getTime() || 0;
      const timeB = new Date(b.createdAt || b.orderDate).getTime() || 0;
      if (timeA !== timeB) {
        return sortOrder === 'NEWEST' ? timeB - timeA : timeA - timeB;
      }
      return sortOrder === 'NEWEST'
        ? b.orderNumber.localeCompare(a.orderNumber)
        : a.orderNumber.localeCompare(b.orderNumber);
    });
  }, [orders, searchQuery, filterTab, dateFilter, sortOrder]);

  const visibleOrderIds = React.useMemo(
    () => sortedOrders.map((o) => o.id),
    [sortedOrders]
  );

  const selectedInViewCount = React.useMemo(
    () => visibleOrderIds.filter((id) => selectedOrderIds.includes(id)).length,
    [visibleOrderIds, selectedOrderIds]
  );

  const isAllSelected =
    visibleOrderIds.length > 0 && selectedInViewCount === visibleOrderIds.length;
  const isPartiallySelected =
    selectedInViewCount > 0 && selectedInViewCount < visibleOrderIds.length;

  const selectAllRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isPartiallySelected;
    }
  }, [isPartiallySelected]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const remaining = selectedOrderIds.filter((id) => !visibleOrderIds.includes(id));
      if (remaining.length === 0) {
        clearSelectedOrders?.();
      } else {
        selectAllOrders?.(remaining);
      }
    } else {
      const newSelected = Array.from(new Set([...selectedOrderIds, ...visibleOrderIds]));
      selectAllOrders?.(newSelected);
    }
  };

  const getTargetOrdersForExport = () =>
    selectedOrderIds.length > 0
      ? orders.filter((o) => selectedOrderIds.includes(o.id))
      : sortedOrders;

  const handleDownloadOrdersCSV = () => {
    const targetOrders = getTargetOrdersForExport();
    const csvContent = exportOrdersToCSV(targetOrders);
    const suffix = selectedOrderIds.length > 0 ? 'selected' : 'all';
    downloadCSVFile(`mafrend-studio-orders-ml-${suffix}.csv`, csvContent);
  };

  const handleDownloadOrdersExcel = () => {
    const targetOrders = getTargetOrdersForExport();
    const label =
      selectedOrderIds.length > 0
        ? `${selectedOrderIds.length} Pesanan Terpilih`
        : `Antrean Pesanan (${filterTab})`;
    const suffix = selectedOrderIds.length > 0 ? 'selected' : 'laporan';
    void downloadOrdersExcelXlsx(
      targetOrders,
      label,
      `mafrend-studio-pesanan-${suffix}.xlsx`
    );
  };

  const handleDownloadOrdersPDF = () => {
    const targetOrders = getTargetOrdersForExport();
    const label =
      selectedOrderIds.length > 0
        ? `${selectedOrderIds.length} Pesanan Terpilih`
        : `Antrean Pesanan (${filterTab})`;
    exportOrdersToPDF(targetOrders, 'Laporan Antrean Pesanan Mafrend.Studio', label);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Clean Single-Line Header (Zero Sub-Headline) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)]">
          Antrean Pesanan
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setSortOrder((prev) =>
                prev === 'QUEUE' ? 'NEWEST' : prev === 'NEWEST' ? 'OLDEST' : 'QUEUE'
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] shadow-[var(--shadow-card)] text-xs font-semibold text-[var(--ink-primary)] transition-all active:scale-[0.97] min-h-[38px]"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
            <span>
              {sortOrder === 'QUEUE'
                ? 'Prioritas'
                : sortOrder === 'NEWEST'
                ? 'Terbaru'
                : 'Terlama'}
            </span>
          </button>

          <ExportMenuButton
            label={
              selectedOrderIds.length > 0
                ? `Unduh Laporan (${selectedOrderIds.length})`
                : 'Unduh Laporan'
            }
            ariaLabel="Unduh CSV, Excel, atau PDF Pesanan"
            variant="light-neutral"
            onExportExcel={handleDownloadOrdersExcel}
            onExportPDF={handleDownloadOrdersPDF}
            onExportCSV={handleDownloadOrdersCSV}
          />

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--cta-bg)] hover:bg-[var(--cta-hover)] text-[var(--cta-text)] shadow-[var(--shadow-card)] text-xs font-semibold rounded-xl transition-all active:scale-[0.97] min-h-[38px]"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
            <span>Input pesanan</span>
          </button>
        </div>
      </div>

      {/* Unified Surface Container: Filter Bar + Column Headers + Separated Row Cards (FigCraft 01 & 07) */}
      <div className="bg-[var(--bg-surface)] shadow-[var(--shadow-card)] p-4 sm:p-5 rounded-2xl flex flex-col gap-3.5">
        <OrderFilterTabs />

        {/* Compact Column Header + Select All Strip */}
        {!loading && sortedOrders.length > 0 && (
          <div className="px-3.5 py-1 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-[var(--ink-muted)]">
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[var(--ink-primary)]">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded accent-[#4638F5]"
                  aria-label="Pilih semua pesanan"
                />
                <span>
                  {selectedOrderIds.length > 0
                    ? `${selectedOrderIds.length} dipilih`
                    : 'Pemesan & ID'}
                </span>
              </label>

              {selectedOrderIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearSelectedOrders?.()}
                  className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[11px] font-semibold text-[var(--ink-primary)]"
                >
                  Reset pilihan
                </button>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-6 pr-3 text-[11px] font-semibold text-[var(--ink-muted)]">
              <span>Jumlah</span>
              <span>Harga / Omzet</span>
              <span className="hidden xl:inline">Deadline</span>
              <span>Pembayaran</span>
              <span>Produksi</span>
              <span>Aksi</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-xs font-medium text-[var(--ink-muted)]">
            Memuat antrean...
          </div>
        ) : (
          <OrderSortableList orders={sortedOrders} />
        )}
      </div>
    </div>
  );
}
