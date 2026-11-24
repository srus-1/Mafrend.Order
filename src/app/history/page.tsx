'use client';

import React, { useState, useMemo } from 'react';
import { useOrders, getOrderMonth } from '@/context/OrderContext';
import { formatRp, formatDateShort, formatMonthLabel } from '@/lib/utils';
import {
  exportOrdersToCSV,
  downloadCSVFile,
  exportOrdersToExcel,
  downloadExcelFile,
  exportOrdersToPDF,
} from '@/lib/csvExport';
import ExportMenuButton from '@/components/shared/ExportMenuButton';
import ActionMenuDropdown from '@/components/shared/ActionMenuDropdown';
import {
  Calendar,
  ChevronDown,
  Search,
  MessageCircle,
  Inbox,
  X,
} from 'lucide-react';

export default function HistoryPage() {
  const {
    orders,
    openEditModal,
    deleteOrder,
    setActiveDrawerOrder,
    selectedMonth,
    setSelectedMonth,
    availableMonths = [],
  } = useOrders();

  const [searchTerm, setSearchTerm] = useState<string>('');

  const completedOrders = useMemo(
    () => orders.filter((o) => o.processStatus === 'SELESAI'),
    [orders]
  );

  const displayMonths: string[] = useMemo(() => {
    const set = new Set<string>();
    if (selectedMonth && selectedMonth !== 'ALL') set.add(selectedMonth);
    availableMonths.forEach((m) => {
      if (m && m !== 'ALL') set.add(m);
    });
    completedOrders.forEach((o) => {
      const m = getOrderMonth(o);
      if (m) set.add(m);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [availableMonths, completedOrders, selectedMonth]);

  const filteredHistory = useMemo(() => {
    return completedOrders.filter((order) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = order.buyerName.toLowerCase().includes(q);
        const matchNumber = order.orderNumber.toLowerCase().includes(q);
        const matchProduct = order.productName.toLowerCase().includes(q);
        if (!matchName && !matchNumber && !matchProduct) return false;
      }

      if (selectedMonth && selectedMonth !== 'ALL') {
        const monthKey = getOrderMonth(order);
        if (monthKey !== selectedMonth) return false;
      }

      return true;
    });
  }, [completedOrders, searchTerm, selectedMonth]);

  const totalCompletedPcs = filteredHistory.reduce((sum, o) => sum + o.qty, 0);
  const totalCompletedOmzet = filteredHistory.reduce((sum, o) => sum + o.omzet, 0);
  const totalCompletedProfit = filteredHistory.reduce((sum, o) => sum + o.profit, 0);
  const totalCompletedHpp = filteredHistory.reduce(
    (sum, o) => sum + o.hppBreakdown.totalHpp,
    0
  );
  const avgMargin =
    totalCompletedOmzet > 0
      ? Math.round(((totalCompletedProfit / totalCompletedOmzet) * 100) * 10) / 10
      : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Clean Single-Line Header (Zero Sub-Headline) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)]">
          Riwayat & Arsip
        </h1>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex items-center">
            <label htmlFor="history-month-select" className="sr-only">
              Pilih Bulan Riwayat
            </label>
            <Calendar className="w-3.5 h-3.5 absolute left-3 pointer-events-none text-[var(--ink-muted)]" />
            <select
              id="history-month-select"
              aria-label="Pilih Bulan Riwayat"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2 rounded-xl bg-[var(--bg-surface)] text-[var(--ink-primary)] text-xs font-semibold min-h-[38px]"
            >
              <option value="ALL" className="bg-[var(--bg-surface)] text-[var(--ink-primary)]">
                Semua Bulan
              </option>
              {displayMonths.map((m) => (
                <option
                  key={m}
                  value={m}
                  className="bg-[var(--bg-surface)] text-[var(--ink-primary)]"
                >
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 pointer-events-none text-[var(--ink-muted)]" />
          </div>

          <ExportMenuButton
            label="Export"
            ariaLabel="Unduh CSV, Excel, atau PDF Riwayat Pesanan"
            variant="light-neutral"
            onExportExcel={() => {
              const excelContent = exportOrdersToExcel(
                filteredHistory,
                `Arsip Selesai (${formatMonthLabel(selectedMonth)})`
              );
              downloadExcelFile(
                `mafrend-studio-riwayat-${selectedMonth || 'all'}.xls`,
                excelContent
              );
            }}
            onExportPDF={() => {
              exportOrdersToPDF(
                filteredHistory,
                'Laporan Arsip Pesanan Selesai Mafrend.Studio',
                `Periode: ${formatMonthLabel(selectedMonth)}`
              );
            }}
            onExportCSV={() => {
              const csvContent = exportOrdersToCSV(filteredHistory);
              downloadCSVFile(
                `mafrend-studio-history-ml-${selectedMonth || 'all'}.csv`,
                csvContent
              );
            }}
          />
        </div>
      </div>

      {/* 4 Tall-Header-Strip CRM Summary Cards (FigCraft Frame 04) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl bg-[var(--bg-surface)] shadow-[var(--shadow-card)] overflow-hidden flex flex-col justify-between">
          <div className="px-4 py-2 bg-[#8EA6FF] text-[#14161D] text-xs font-bold">
            Pesanan Selesai
          </div>
          <div className="p-4 sm:p-5">
            <div className="text-xl sm:text-2xl font-bold text-[var(--ink-primary)] tabular-nums">
              {filteredHistory.length} Order
            </div>
            <p className="text-[11px] font-medium text-[var(--ink-muted)] mt-1">
              Total {totalCompletedPcs.toLocaleString('id-ID')} pcs tercetak
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--bg-surface)] shadow-[var(--shadow-card)] overflow-hidden flex flex-col justify-between">
          <div className="px-4 py-2 bg-[#F29B76] text-[#14161D] text-xs font-bold">
            Omzet Selesai
          </div>
          <div className="p-4 sm:p-5">
            <div className="text-xl sm:text-2xl font-bold text-[var(--ink-primary)] tabular-nums">
              {formatRp(totalCompletedOmzet)}
            </div>
            <p className="text-[11px] font-medium text-[var(--ink-muted)] mt-1">
              Total HPP {formatRp(totalCompletedHpp)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--bg-surface)] shadow-[var(--shadow-card)] overflow-hidden flex flex-col justify-between">
          <div className="px-4 py-2 bg-[#6EEB9A] text-[#14161D] text-xs font-bold">
            Laba Terealisasi
          </div>
          <div className="p-4 sm:p-5">
            <div className="text-xl sm:text-2xl font-bold text-[var(--ink-primary)] tabular-nums">
              {formatRp(totalCompletedProfit)}
            </div>
            <p className="text-[11px] font-semibold text-[var(--ink-profit)] mt-1">
              Rata-rata margin {avgMargin}%
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--bg-surface)] shadow-[var(--shadow-card)] overflow-hidden flex flex-col justify-between">
          <div className="px-4 py-2 bg-[#F9DC7E] text-[#14161D] text-xs font-bold">
            Status Pelunasan
          </div>
          <div className="p-4 sm:p-5">
            <div className="text-xl sm:text-2xl font-bold text-[var(--ink-primary)]">
              Terkirim
            </div>
            <p className="text-[11px] font-medium text-[var(--ink-muted)] mt-1">
              Produksi 6/6 tuntas
            </p>
          </div>
        </div>
      </div>

      {/* Search & Separated Archive Rows Container */}
      <div className="bg-[var(--bg-surface)] shadow-[var(--shadow-card)] p-3.5 sm:p-4 rounded-2xl flex flex-col gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari kode pesanan, pelanggan, produk..."
              aria-label="Cari riwayat pesanan"
              className="w-full pl-9 pr-8 py-2 min-h-[38px] rounded-xl bg-[var(--bg-subtle)] text-xs font-medium text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Hapus pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <span className="text-xs font-semibold text-[var(--ink-muted)]">
            {filteredHistory.length} arsip selesai
          </span>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="py-14 px-6 bg-[var(--bg-row)] rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-chip-on-row)] flex items-center justify-center text-[var(--ink-muted)] mb-3">
              <Inbox className="w-6 h-6 stroke-[1.6]" />
            </div>
            <h2 className="text-sm font-bold text-[var(--ink-primary)]">Arsip Kosong</h2>
            <p className="text-xs text-[var(--ink-muted)] mt-1">
              Belum ada pesanan dengan status selesai pada periode ini.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredHistory.map((order) => {
              const cleanPhone = order.buyerPhone.replace(/\D/g, '');
              const waNumber = cleanPhone.startsWith('0')
                ? `62${cleanPhone.slice(1)}`
                : cleanPhone;
              const waUrl = `https://wa.me/${waNumber}`;
              const filesCount = order.designFiles?.length || 0;

              return (
                <div
                  key={order.id}
                  className="p-3.5 rounded-xl bg-[var(--bg-row)] hover:bg-[var(--bg-hover)]/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                >
                  {/* Order Code & Buyer */}
                  <div className="flex items-center gap-3 min-w-0 lg:w-[250px] shrink-0">
                    <div className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-chip-on-row)] text-xs font-bold text-[var(--ink-primary)] tabular-nums shrink-0">
                      #{order.orderNumber}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[var(--ink-primary)] truncate">
                        {order.buyerName}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--ink-muted)] mt-0.5">
                        <span>{formatDateShort(order.orderDate)}</span>
                        <span>•</span>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-[var(--ink-primary)]"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>{order.buyerPhone}</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Product & Specs */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[var(--ink-primary)] line-clamp-1">
                      {order.productName}
                    </div>
                    <div className="text-[11px] text-[var(--ink-muted)] line-clamp-1 mt-0.5">
                      {order.specs || 'Spesifikasi standar'}
                    </div>
                  </div>

                  {/* Volume, Omzet, Profit, Payment Badge & Unified Three-Dots */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-2.5 shrink-0">
                    <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-chip-on-row)] text-[11px] font-bold text-[var(--ink-primary)] tabular-nums">
                      {order.qty.toLocaleString('id-ID')} pcs
                    </span>

                    <div className="text-right min-w-[100px]">
                      <div className="text-xs font-bold text-[var(--ink-primary)] tabular-nums">
                        {formatRp(order.omzet)}
                      </div>
                      <div className="text-[11px] font-bold text-[var(--ink-profit)] tabular-nums">
                        +{formatRp(order.profit)} ({order.marginPct}%)
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        order.paymentStatus === 'LUNAS'
                          ? 'bg-[#6EEB9A] text-[#14161D]'
                          : order.paymentStatus === 'DP'
                          ? 'bg-[#8EA6FF] text-[#14161D]'
                          : 'bg-[#F29B76] text-[#14161D]'
                      }`}
                    >
                      {order.paymentStatus === 'LUNAS'
                        ? 'Lunas'
                        : order.paymentStatus === 'DP'
                        ? 'DP'
                        : 'Belum lunas'}
                    </span>

                    <ActionMenuDropdown
                      ariaLabel={`Menu aksi arsip ${order.orderNumber}`}
                      items={[
                        { label: 'Edit', onClick: () => openEditModal(order) },
                        {
                          label: `Lihat berkas (${filesCount})`,
                          onClick: () => setActiveDrawerOrder(order),
                        },
                        {
                          label: 'Hapus',
                          tone: 'danger',
                          onClick: () => {
                            if (confirm(`Hapus arsip pesanan ${order.orderNumber}?`)) {
                              deleteOrder(order.id);
                            }
                          },
                        },
                      ]}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
