'use client';

import React, { useMemo } from 'react';
import { FilterTab } from '@/types/order';
import { useOrderData, useOrderUI } from '@/context/OrderContext';
import { Search, Calendar, X } from 'lucide-react';

interface TabItem {
  id: FilterTab;
  label: string;
  count: number;
}

export default function OrderFilterTabs() {
  const { orders } = useOrderData();
  const {
    filterTab,
    setFilterTab,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
  } = useOrderUI();

  const counts = useMemo<Record<FilterTab, number>>(() => {
    let belumLunasDp = 0;
    let proses = 0;
    let selesai = 0;
    for (const o of orders) {
      if (o.paymentStatus === 'BELUM_LUNAS' || o.paymentStatus === 'DP') {
        belumLunasDp += 1;
      }
      if (o.processStatus === 'SELESAI') {
        selesai += 1;
      } else {
        proses += 1;
      }
    }
    return {
      ALL: orders.length,
      BELUM_LUNAS_DP: belumLunasDp,
      PROSES: proses,
      SELESAI: selesai,
    };
  }, [orders]);

  const tabs: TabItem[] = [
    { id: 'ALL', label: 'Semua', count: counts.ALL },
    { id: 'BELUM_LUNAS_DP', label: 'Belum Lunas / DP', count: counts.BELUM_LUNAS_DP },
    { id: 'PROSES', label: 'Diproses', count: counts.PROSES },
    { id: 'SELESAI', label: 'Selesai', count: counts.SELESAI },
  ];

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3">
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-1 p-1 bg-[var(--bg-seg-track)] rounded-xl select-none">
        {tabs.map((tab) => {
          const isActive = filterTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={`flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 min-h-[38px] rounded-lg text-[11px] sm:text-xs font-semibold transition-colors min-w-0 ${
                isActive
                  ? 'bg-[#4638F5] text-[#FFFFFF]'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              <span className="truncate">{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums shrink-0 ${
                  isActive
                    ? 'bg-white/20 text-[#FFFFFF]'
                    : 'bg-[var(--bg-surface)] text-[var(--ink-primary)]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-12 sm:flex sm:flex-row items-center gap-2 sm:gap-2.5">
        <div className="relative col-span-7 sm:flex-1 sm:w-64 min-w-0">
          <Search className="w-3.5 h-3.5 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pelanggan, kode..."
            aria-label="Cari pesanan"
            className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-2 min-h-[38px] rounded-xl bg-[var(--bg-subtle)] text-xs font-medium text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Hapus pencarian"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="col-span-5 sm:col-span-auto flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="relative flex-1 sm:flex-initial flex items-center min-w-0">
            <Calendar className="w-3.5 h-3.5 absolute left-2.5 sm:left-3 text-[var(--ink-muted)] pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter tanggal pesanan"
              title="Filter tanggal"
              className="w-full sm:w-auto pl-8 sm:pl-9 pr-2 sm:pr-3 py-2 min-h-[38px] rounded-xl bg-[var(--bg-subtle)] text-[11px] sm:text-xs font-medium text-[var(--ink-primary)] min-w-0"
            />
          </div>

          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter('')}
              className="w-9 sm:w-auto px-0 sm:px-3 py-2 min-h-[38px] rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--ink-primary)] flex items-center justify-center gap-1 shrink-0"
              aria-label="Hapus filter tanggal"
              title="Hapus filter tanggal"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
