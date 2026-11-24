'use client';

import React from 'react';
import { DashboardMetrics } from '@/types/order';
import { formatRp } from '@/lib/utils';

interface MetricCardsProps {
  metrics: DashboardMetrics;
}

export default function MetricCards({ metrics }: MetricCardsProps) {
  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {/* 1. Electric Indigo Hero Card: Total Omzet Bruto (FigCraft Frame 03 & 08) */}
      <div className="rounded-2xl p-5 bg-[#4638F5] text-[#FFFFFF] shadow-[var(--shadow-card)] flex flex-col justify-between gap-3">
        <span className="text-xs font-semibold text-white/90">Total Omzet Bruto</span>
        <div className="text-2xl font-bold tracking-tight tabular-nums">
          {formatRp(metrics.totalOmzet)}
        </div>
        <div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#6EEB9A] text-[#14161D] text-[11px] font-bold tabular-nums">
            Margin {metrics.averageMarginPct}%
          </span>
        </div>
      </div>

      {/* 2. Surface Card: Total Produksi */}
      <div className="rounded-2xl p-5 bg-[var(--bg-surface)] shadow-[var(--shadow-card)] flex flex-col justify-between gap-3">
        <span className="text-xs font-semibold text-[var(--ink-muted)]">Total Produksi</span>
        <div className="text-2xl font-bold tracking-tight text-[var(--ink-primary)] tabular-nums">
          {metrics.totalPcs.toLocaleString('id-ID')} pcs
        </div>
        <div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#8EA6FF] text-[#14161D] text-[11px] font-bold tabular-nums">
            {metrics.activeOrdersCount} aktif • {metrics.completedOrdersCount} selesai
          </span>
        </div>
      </div>

      {/* 3. Surface Card: Laba Bersih */}
      <div className="rounded-2xl p-5 bg-[var(--bg-surface)] shadow-[var(--shadow-card)] flex flex-col justify-between gap-3">
        <span className="text-xs font-semibold text-[var(--ink-muted)]">Laba Bersih</span>
        <div className="text-2xl font-bold tracking-tight text-[var(--ink-primary)] tabular-nums">
          {formatRp(metrics.totalProfit)}
        </div>
        <div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#6EEB9A] text-[#14161D] text-[11px] font-bold tabular-nums">
            Setelah HPP {formatRp(metrics.totalHpp)}
          </span>
        </div>
      </div>

      {/* 4. Surface Card: Total Piutang DP */}
      <div className="rounded-2xl p-5 bg-[var(--bg-surface)] shadow-[var(--shadow-card)] flex flex-col justify-between gap-3">
        <span className="text-xs font-semibold text-[var(--ink-muted)]">Total Piutang DP</span>
        <div className="text-2xl font-bold tracking-tight text-[var(--ink-primary)] tabular-nums">
          {formatRp(metrics.totalPiutangDp)}
        </div>
        <div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
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
