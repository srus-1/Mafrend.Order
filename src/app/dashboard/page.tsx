'use client';

import React from 'react';
import { useOrders } from '@/context/OrderContext';
import MetricCards from '@/components/dashboard/MetricCards';
import MonthlyProfitChart from '@/components/dashboard/MonthlyProfitChart';
import BuyerProfitTable from '@/components/dashboard/BuyerProfitTable';
import { Calendar, ChevronDown, RotateCcw } from 'lucide-react';
import { formatRp, formatMonthLabel } from '@/lib/utils';

export default function DashboardPage() {
  const {
    metrics,
    monthlyProfit,
    buyerSummaries,
    selectedMonth,
    setSelectedMonth,
    availableMonths = [],
    selectedOrderIds = [],
    clearSelectedOrders,
  } = useOrders();

  const totalCollected = Math.max(0, metrics.totalOmzet - metrics.totalPiutangDp);
  const collectionRate =
    metrics.totalOmzet > 0
      ? Math.round((totalCollected / metrics.totalOmzet) * 100)
      : 100;

  const displayMonths = availableMonths.includes(selectedMonth)
    ? availableMonths
    : selectedMonth
    ? [selectedMonth, ...availableMonths]
    : availableMonths;

  return (
    <div className="flex flex-col gap-4">
      {/* Clean Single-Line Header (Zero Sub-Headline) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)]">
          Rekapan & Omzet
        </h1>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-2 rounded-xl bg-[#6EEB9A] text-[#14161D] text-xs font-bold tabular-nums min-h-[38px] flex items-center">
            Kas Terkumpul: {formatRp(totalCollected)} ({collectionRate}%)
          </div>

          <div className="relative flex items-center">
            <label htmlFor="dashboard-month-select" className="sr-only">
              Pilih Bulan Analitik
            </label>
            <Calendar className="w-3.5 h-3.5 absolute left-3 pointer-events-none text-[var(--ink-muted)]" />
            <select
              id="dashboard-month-select"
              aria-label="Pilih Bulan Analitik"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2 rounded-xl bg-[var(--bg-surface)] text-[var(--ink-primary)] text-xs font-semibold min-h-[38px]"
            >
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
        </div>
      </div>

      {/* Dynamic Multi-Select Override Notice */}
      {selectedOrderIds.length > 0 && (
        <div
          role="alert"
          aria-live="polite"
          className="bg-[var(--bg-surface)] rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <span className="text-xs font-semibold text-[var(--ink-primary)]">
            Menampilkan analitik khusus untuk{' '}
            <strong>{selectedOrderIds.length} pesanan terpilih</strong>.
          </span>

          <button
            type="button"
            onClick={clearSelectedOrders}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4638F5] text-[#FFFFFF] text-xs font-semibold min-h-[36px] self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Bulanan ({selectedMonth})</span>
          </button>
        </div>
      )}

      {/* Asymmetric Bento Grid: 2x2 KPIs (5 cols) + Monthly Profit Chart (7 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        <div className="xl:col-span-5 flex">
          <MetricCards metrics={metrics} />
        </div>
        <div className="xl:col-span-7 flex">
          <MonthlyProfitChart data={monthlyProfit} />
        </div>
      </div>

      {/* Customer Profitability Ranking */}
      <BuyerProfitTable buyers={buyerSummaries} />
    </div>
  );
}
