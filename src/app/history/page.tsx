'use client';

import React, { useState, useMemo } from 'react';
import { useOrders, getOrderMonth } from '@/context/OrderContext';
import { PaymentStatus } from '@/types/order';
import {
  formatRp,
  formatDateShort,
  formatMonthLabel,
  calculateMargin,
  buildWhatsAppUrl,
} from '@/lib/utils';
import {
  exportOrdersToCSV,
  downloadCSVFile,
  exportOrdersToPDF,
} from '@/lib/csvExport';
import { downloadOrdersExcelXlsx } from '@/lib/excelExport';
import ExportMenuButton from '@/components/shared/ExportMenuButton';
import ActionMenuDropdown from '@/components/shared/ActionMenuDropdown';
import CustomSelect from '@/components/shared/CustomSelect';
import {
  Calendar,
  Search,
  MessageCircle,
  Inbox,
  X,
} from 'lucide-react';

const PAYMENT_BADGE_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  LUNAS: { label: 'Lunas', className: 'bg-[#6EEB9A] text-[#14161D]' },
  DP: { label: 'DP', className: 'bg-[#8EA6FF] text-[#14161D]' },
  BELUM_LUNAS: { label: 'Belum lunas', className: 'bg-[#F29B76] text-[#14161D]' },
};

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

  const {
    totalCompletedPcs,
    totalCompletedOmzet,
    totalCompletedProfit,
    totalCompletedHpp,
    avgMargin,
  } = useMemo(() => {
    let pcs = 0;
    let omzet = 0;
    let profit = 0;
    let hpp = 0;
    for (const order of filteredHistory) {
      pcs += order.qty;
      omzet += order.omzet;
      profit += order.profit;
      hpp += order.hppBreakdown.totalHpp;
    }
    return {
      totalCompletedPcs: pcs,
      totalCompletedOmzet: omzet,
      totalCompletedProfit: profit,
      totalCompletedHpp: hpp,
      avgMargin: calculateMargin(omzet, hpp).marginPct,
    };
  }, [filteredHistory]);

  return (
    <div className="flex flex-col gap-4">
      {/* Clean Single-Line Header (Zero Sub-Headline) */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)] truncate">
          Riwayat & Arsip
        </h1>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div className="min-w-[136px] sm:min-w-[172px]">
            <CustomSelect
              id="history-month-select"
              ariaLabel="Pilih bulan riwayat"
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

          <ExportMenuButton
            iconOnlyMobile
            label="Unduh Laporan"
            ariaLabel="Unduh CSV, Excel, atau PDF riwayat pesanan"
            variant="light-neutral"
            onExportExcel={() => {
              void downloadOrdersExcelXlsx(
                filteredHistory,
                `Arsip Selesai (${formatMonthLabel(selectedMonth)})`,
                `mafrend-studio-riwayat-${selectedMonth || 'all'}.xlsx`
              );
            }}
            onExportPDF={() => {
              exportOrdersToPDF(
                filteredHistory,
                'Laporan Arsip Pesanan Selesai Mafrend.Studio',
                formatMonthLabel(selectedMonth)
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="rounded-2xl bg-[var(--bg-surface)] shadow-[var(--shadow-card)] overflow-hidden flex flex-col justify-between min-w-0">
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#8EA6FF] text-[#14161D] text-[11px] sm:text-xs font-bold truncate">
            Pesanan Selesai
          </div>
          <div className="p-3 sm:p-5">
            <div className="text-base sm:text-2xl font-bold text-[var(--ink-primary)] tabular-nums truncate">
              {filteredHistory.length} Order
            </div>
            <p className="text-[10px] sm:text-[11px] font-medium text-[var(--ink-muted)] mt-1 truncate">
              {totalCompletedPcs.toLocaleString('id-ID')} pcs tercetak
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--bg-surface)] shadow-[var(--shadow-card)] overflow-hidden flex flex-col justify-between min-w-0">
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#F29B76] text-[#14161D] text-[11px] sm:text-xs font-bold truncate">
            Omzet Selesai
          </div>
          <div className="p-3 sm:p-5">
            <div className="text-[clamp(0.95rem,3.6vw,1.25rem)] sm:text-[clamp(1.1rem,1.5vw,1.4rem)] font-bold leading-tight text-[var(--ink-primary)] tabular-nums break-words">
              {formatRp(totalCompletedOmzet)}
            </div>
            <p className="text-[10px] sm:text-[11px] font-medium text-[var(--ink-muted)] mt-1 truncate">
              HPP {formatRp(totalCompletedHpp)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--bg-surface)] shadow-[var(--shadow-card)] overflow-hidden flex flex-col justify-between min-w-0">
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#6EEB9A] text-[#14161D] text-[11px] sm:text-xs font-bold truncate">
            Laba Terealisasi
          </div>
          <div className="p-3 sm:p-5">
            <div className="text-[clamp(0.95rem,3.6vw,1.25rem)] sm:text-[clamp(1.1rem,1.5vw,1.4rem)] font-bold leading-tight text-[var(--ink-primary)] tabular-nums break-words">
              {formatRp(totalCompletedProfit)}
            </div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-[var(--ink-profit)] mt-1 truncate">
              Margin {avgMargin}%
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--bg-surface)] shadow-[var(--shadow-card)] overflow-hidden flex flex-col justify-between min-w-0">
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#F9DC7E] text-[#14161D] text-[11px] sm:text-xs font-bold truncate">
            Status Pelunasan
          </div>
          <div className="p-3 sm:p-5">
            <div className="text-base sm:text-2xl font-bold text-[var(--ink-primary)] truncate">
              Terkirim
            </div>
            <p className="text-[10px] sm:text-[11px] font-medium text-[var(--ink-muted)] mt-1 truncate">
              Produksi 6/6 tuntas
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] shadow-[var(--shadow-card)] p-3 sm:p-4 rounded-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2.5">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari kode, pelanggan, produk..."
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

          <span className="text-[11px] sm:text-xs font-semibold text-[var(--ink-muted)] whitespace-nowrap shrink-0">
            {filteredHistory.length} arsip
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
            <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-3.5 text-[11px] font-semibold text-[var(--ink-muted)]">
              <span className="col-span-3">Pemesan & ID</span>
              <span className="col-span-4">Produk & Spesifikasi</span>
              <span className="col-span-1">Jumlah</span>
              <span className="col-span-2 text-right">Omzet & Laba</span>
              <span className="col-span-2 text-right">Status & Aksi</span>
            </div>

            {filteredHistory.map((order) => {
              const waUrl = buildWhatsAppUrl(order.buyerPhone);
              const filesCount = order.designFiles?.length || 0;
              const paymentBadge =
                PAYMENT_BADGE_CONFIG[order.paymentStatus] || PAYMENT_BADGE_CONFIG.BELUM_LUNAS;
              const actionItems = [
                { label: 'Edit', onClick: () => openEditModal(order) },
                {
                  label: `Lihat berkas (${filesCount})`,
                  onClick: () => setActiveDrawerOrder(order),
                },
                {
                  label: 'Hapus',
                  tone: 'danger' as const,
                  onClick: () => {
                    if (confirm(`Hapus arsip pesanan ${order.orderNumber}?`)) {
                      deleteOrder(order.id);
                    }
                  },
                },
              ];

              return (
                <div
                  key={order.id}
                  className="p-3 sm:p-3.5 rounded-xl bg-[var(--bg-row)] hover:bg-[var(--bg-hover)]/70 transition-colors grid grid-cols-1 lg:grid-cols-12 lg:items-center gap-2 lg:gap-3"
                >
                  <div className="lg:col-span-3 flex items-center justify-between lg:justify-start gap-2.5 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="px-2 py-1.5 rounded-lg bg-[var(--bg-chip-on-row)] text-[11px] sm:text-xs font-bold text-[var(--ink-primary)] tabular-nums shrink-0">
                        #{order.orderNumber}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-[var(--ink-primary)] truncate">
                          {order.buyerName}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--ink-muted)] mt-0.5 truncate">
                          <span className="shrink-0">{formatDateShort(order.orderDate)}</span>
                          <span>•</span>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:text-[var(--ink-primary)] truncate"
                          >
                            <MessageCircle className="w-3 h-3 shrink-0" />
                            <span className="truncate">{order.buyerPhone}</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="lg:hidden shrink-0">
                      <ActionMenuDropdown
                        ariaLabel={`Menu aksi arsip ${order.orderNumber}`}
                        items={actionItems}
                      />
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2.5 lg:contents">
                    <div className="lg:col-span-4 min-w-0 flex-1">
                      <div className="text-xs font-semibold text-[var(--ink-primary)] line-clamp-1">
                        {order.productName}
                      </div>
                      <div className="text-[11px] text-[var(--ink-muted)] line-clamp-1 mt-0.5">
                        {order.specs || 'Spesifikasi standar'}
                      </div>
                    </div>

                    <div className="lg:hidden shrink-0 text-right">
                      <div className="text-xs font-bold text-[var(--ink-primary)] tabular-nums whitespace-nowrap">
                        {formatRp(order.omzet)}
                      </div>
                      <div className="text-[11px] font-bold text-[var(--ink-profit)] tabular-nums whitespace-nowrap mt-0.5">
                        +{formatRp(order.profit)} ({order.marginPct}%)
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:flex lg:col-span-1 items-center">
                    <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-chip-on-row)] text-[11px] font-bold text-[var(--ink-primary)] tabular-nums whitespace-nowrap">
                      {order.qty.toLocaleString('id-ID')} pcs
                    </span>
                  </div>

                  <div className="hidden lg:block lg:col-span-2 lg:text-right">
                    <div className="text-xs font-bold text-[var(--ink-primary)] tabular-nums">
                      {formatRp(order.omzet)}
                    </div>
                    <div className="text-[11px] font-bold text-[var(--ink-profit)] tabular-nums">
                      +{formatRp(order.profit)} ({order.marginPct}%)
                    </div>
                  </div>

                  <div className="lg:col-span-2 flex items-center justify-between lg:justify-end gap-2 pt-0.5 lg:pt-0">
                    <span className="lg:hidden px-2.5 py-1 rounded-lg bg-[var(--bg-chip-on-row)] text-[11px] font-bold text-[var(--ink-primary)] tabular-nums whitespace-nowrap">
                      {order.qty.toLocaleString('id-ID')} pcs
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${paymentBadge.className}`}
                    >
                      {paymentBadge.label}
                    </span>

                    <div className="hidden lg:block shrink-0">
                      <ActionMenuDropdown
                        ariaLabel={`Menu aksi arsip ${order.orderNumber}`}
                        items={actionItems}
                      />
                    </div>
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
