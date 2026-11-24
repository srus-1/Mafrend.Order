'use client';

import React, { useEffect, useRef } from 'react';
import { FilterTab } from '@/types/order';
import { useOrders } from '@/context/OrderContext';
import { Search, Calendar, X } from 'lucide-react';

interface TabItem {
  id: FilterTab;
  label: string;
  count: number;
}

export default function OrderFilterTabs() {
  const {
    filterTab,
    setFilterTab,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    orders,
  } = useOrders();

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Press "/" to focus search input when not typing inside a form field
  useEffect(() => {
    const handleSlash = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        if (
          tag === 'input' ||
          tag === 'textarea' ||
          tag === 'select' ||
          target.isContentEditable
        ) {
          return;
        }
      }
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener('keydown', handleSlash);
    return () => window.removeEventListener('keydown', handleSlash);
  }, []);

  const counts: Record<FilterTab, number> = {
    ALL: orders.length,
    BELUM_LUNAS_DP: orders.filter(
      (o) => o.paymentStatus === 'BELUM_LUNAS' || o.paymentStatus === 'DP'
    ).length,
    PROSES: orders.filter((o) => o.processStatus !== 'SELESAI').length,
    SELESAI: orders.filter((o) => o.processStatus === 'SELESAI').length,
  };

  const tabs: TabItem[] = [
    { id: 'ALL', label: 'Semua', count: counts.ALL },
    { id: 'BELUM_LUNAS_DP', label: 'Belum Lunas / DP', count: counts.BELUM_LUNAS_DP },
    { id: 'PROSES', label: 'Diproses', count: counts.PROSES },
    { id: 'SELESAI', label: 'Selesai', count: counts.SELESAI },
  ];

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
      {/* Segmented Filter Track (Zero Border) */}
      <div
        className="flex items-center gap-1 p-1 bg-[var(--bg-seg-track)] rounded-xl overflow-x-auto select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {tabs.map((tab) => {
          const isActive = filterTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#4638F5] text-[#FFFFFF]'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums ${
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

      {/* Search & Date Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1 sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pelanggan, kode, produk..."
            aria-label="Cari pesanan"
            className="w-full pl-9 pr-9 py-2 min-h-[38px] rounded-xl bg-[var(--bg-subtle)] text-xs font-medium text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Bersihkan pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[10px] font-semibold text-[var(--ink-muted)] pointer-events-none">
              /
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-initial flex items-center">
            <Calendar className="w-3.5 h-3.5 absolute left-3 text-[var(--ink-muted)] pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter tanggal pesanan"
              title="Filter Tanggal"
              className="w-full sm:w-auto pl-9 pr-3 py-2 min-h-[38px] rounded-xl bg-[var(--bg-subtle)] text-xs font-medium text-[var(--ink-primary)]"
            />
          </div>

          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter('')}
              className="px-3 py-2 min-h-[38px] rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--ink-primary)] flex items-center gap-1"
              title="Hapus filter tanggal"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
