'use client';

import React from 'react';
import { DashboardMetrics } from '@/types/order';
import { formatRp } from '@/lib/utils';

interface MetricCardsProps {
  metrics: DashboardMetrics;
}

export default function MetricCards({ metrics }: MetricCardsProps) {
  return (
    <div className="w-full grid grid-cols-2 gap-2.5 sm:gap-3.5">
      <div className="rounded-2xl p-3.5 sm:p-5 bg-[#4638F5] text-[#FFFFFF] shadow-[var(--shadow-card)] flex flex-col justify-between gap-2 sm:gap-3 min-w-0">
        <span className="text-[11px] sm:text-xs font-semibold text-white/90 truncate">
          Total Omzet Bruto
        </span>
        <div className="text-base sm:text-2xl font-bold tracking-tight tabular-nums truncate">
          {formatRp(metrics.totalOmzet)}
        </div>
        <div>
          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#6EEB9A] text-[#14161D] text-[10px] sm:text-[11px] font-bold tabular-nums">
            Margin {metrics.averageMarginPct}%
          </span>
        </div>
      </div>

      <div className="rounded-2xl p-3.5 sm:p-5 bg-[var(--bg-surface)] shadow-[var(--shadow-card)] flex flex-col justify-between gap-2 sm:gap-3 min-w-0">
        <span className="text-[11px] sm:text-xs font-semibold text-[var(--ink-muted)] truncate">
          Total Produksi
        </span>
        <div className="text-base sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)] tabular-nums truncate">
          {metrics.totalPcs.toLocaleString('id-ID')} pcs
        </div>
        <div>
          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#8EA6FF] text-[#14161D] text-[10px] sm:text-[11px] font-bold tabular-nums">
            {metrics.activeOrdersCount} aktif • {metrics.completedOrdersCount} selesai
          </span>
        </div>
      </div>

      <div className="rounded-2xl p-3.5 sm:p-5 bg-[var(--bg-surface)] shadow-[var(--shadow-card)] flex flex-col justify-between gap-2 sm:gap-3 min-w-0">
        <span className="text-[11px] sm:text-xs font-semibold text-[var(--ink-muted)] truncate">
          Laba Bersih
        </span>
        <div className="text-base sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)] tabular-nums truncate">
          {formatRp(metrics.totalProfit)}
        </div>
        <div>
          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#6EEB9A] text-[#14161D] text-[10px] sm:text-[11px] font-bold tabular-nums truncate max-w-full">
            HPP {formatRp(metrics.totalHpp)}
          </span>
        </div>
      </div>

      <div className="rounded-2xl p-3.5 sm:p-5 bg-[var(--bg-surface)] shadow-[var(--shadow-card)] flex flex-col justify-between gap-2 sm:gap-3 min-w-0">
        <span className="text-[11px] sm:text-xs font-semibold text-[var(--ink-muted)] truncate">
          Total Piutang DP
        </span>
        <div className="text-base sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)] tabular-nums truncate">
          {formatRp(metrics.totalPiutangDp)}
        </div>
        <div>
          <span
            className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold ${
              metrics.totalPiutangDp > 0
                ? 'bg-[#F29B76] text-[#14161D]'
                : 'bg-[#6EEB9A] text-[#14161D]'
            }`}
          >
            {metrics.totalPiutangDp > 0 ? 'Sisa tagihan aktif' : 'Semua lunas'}
          </span>
        </div>
      </div>
    </div>
  );
}
