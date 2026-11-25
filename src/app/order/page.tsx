'use client';

import React from 'react';
import { useOrderData, useOrderUI } from '@/context/OrderContext';
import OrderFilterTabs from '@/components/order/OrderFilterTabs';
import OrderSortableList from '@/components/order/OrderSortableList';
import { ArrowUpDown, Plus } from 'lucide-react';
import {
  exportOrdersToCSV,
  downloadCSVFile,
  exportOrdersToPDF,
} from '@/lib/csvExport';
import ExportMenuButton from '@/components/shared/ExportMenuButton';

const ORDERS_PAGE_SIZE = 25;

type OrderSortMode = 'QUEUE' | 'NEWEST' | 'OLDEST';

const SORT_LABELS: Record<OrderSortMode, string> = {
  QUEUE: 'Prioritas',
  NEWEST: 'Terbaru',
  OLDEST: 'Terlama',
};

const NEXT_SORT_MODE: Record<OrderSortMode, OrderSortMode> = {
  QUEUE: 'NEWEST',
  NEWEST: 'OLDEST',
  OLDEST: 'QUEUE',
};

export default function OrderPage() {
  const { orders, loading } = useOrderData();
  const {
    searchQuery,
    filterTab,
    dateFilter,
    openCreateModal,
    selectedOrderIds = [],
    selectAllOrders,
    clearSelectedOrders,
  } = useOrderUI();

  const [sortOrder, setSortOrder] = React.useState<OrderSortMode>('NEWEST');
  const [visibleLimit, setVisibleLimit] = React.useState<number>(ORDERS_PAGE_SIZE);

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

    const direction = sortOrder === 'NEWEST' ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const keyA = a.createdAt || a.orderDate || '';
      const keyB = b.createdAt || b.orderDate || '';
      if (keyA !== keyB) {
        return keyA < keyB ? -direction : direction;
      }
      return a.orderNumber.localeCompare(b.orderNumber) * direction;
    });
  }, [orders, searchQuery, filterTab, dateFilter, sortOrder]);

  const displayedOrders = React.useMemo(
    () => sortedOrders.slice(0, visibleLimit),
    [sortedOrders, visibleLimit]
  );

  const trailingOrderIds = React.useMemo(
    () =>
      sortedOrders.length > visibleLimit
        ? sortedOrders.slice(visibleLimit).map((o) => o.id)
        : [],
    [sortedOrders, visibleLimit]
  );

  const visibleOrderIds = React.useMemo(
    () => sortedOrders.map((o) => o.id),
    [sortedOrders]
  );

  const selectedOrderSet = React.useMemo(
    () => new Set(selectedOrderIds),
    [selectedOrderIds]
  );

  const selectedInViewCount = React.useMemo(
    () => visibleOrderIds.filter((id) => selectedOrderSet.has(id)).length,
    [visibleOrderIds, selectedOrderSet]
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

  const handleDownloadOrdersExcel = async () => {
    const targetOrders = getTargetOrdersForExport();
    const label =
      selectedOrderIds.length > 0
        ? `${selectedOrderIds.length} Pesanan Terpilih`
        : `Antrean Pesanan (${filterTab})`;
    const suffix = selectedOrderIds.length > 0 ? 'selected' : 'laporan';
    const { downloadOrdersExcelXlsx } = await import('@/lib/excelExport');
    await downloadOrdersExcelXlsx(
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
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)] truncate">
          Antrean Pesanan
        </h1>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSortOrder((prev) => NEXT_SORT_MODE[prev])}
            aria-label={`Urutkan: ${SORT_LABELS[sortOrder]}`}
            title={`Urutan ${SORT_LABELS[sortOrder]}`}
            className="inline-flex items-center justify-center gap-1.5 w-[38px] sm:w-auto px-0 sm:px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] shadow-[var(--shadow-card)] text-xs font-semibold text-[var(--ink-primary)] transition-all active:scale-[0.97] min-h-[38px]"
          >
            <ArrowUpDown className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[var(--ink-primary)] sm:text-[var(--ink-muted)]" />
            <span className="hidden sm:inline">{SORT_LABELS[sortOrder]}</span>
          </button>

          <ExportMenuButton
            iconOnlyMobile
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
            aria-label="Input pesanan"
            title="Input pesanan"
            className="inline-flex items-center justify-center gap-1.5 w-[38px] sm:w-auto px-0 sm:px-4 py-2 bg-[var(--cta-bg)] hover:bg-[var(--cta-hover)] text-[var(--cta-text)] shadow-[var(--shadow-card)] text-xs font-semibold rounded-xl transition-all active:scale-[0.97] min-h-[38px]"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
            <span className="hidden sm:inline">Input pesanan</span>
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] shadow-[var(--shadow-card)] p-3 sm:p-5 rounded-2xl flex flex-col gap-3 sm:gap-3.5">
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
          <div
            role="status"
            aria-busy="true"
            aria-label="Memuat antrean pesanan"
            className="flex flex-col gap-2.5"
          >
            <span className="sr-only">Memuat antrean...</span>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-[var(--bg-row)] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            <OrderSortableList
              orders={displayedOrders}
              trailingOrderIds={trailingOrderIds}
            />
            {sortedOrders.length > visibleLimit && (
              <div className="pt-1 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => prev + ORDERS_PAGE_SIZE)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--ink-primary)] transition-colors min-h-[38px]"
                >
                  Tampilkan {Math.min(ORDERS_PAGE_SIZE, sortedOrders.length - visibleLimit)} lagi ({displayedOrders.length} dari {sortedOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleLimit(sortedOrders.length)}
                  className="px-3.5 py-2 rounded-xl bg-[var(--bg-row)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--ink-secondary)] transition-colors min-h-[38px]"
                >
                  Tampilkan semua
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
