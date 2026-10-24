'use client';

import React from 'react';
import { useOrders } from '@/context/OrderContext';
import MetricCards from '@/components/dashboard/MetricCards';
import MonthlyProfitChart from '@/components/dashboard/MonthlyProfitChart';
import BuyerProfitTable from '@/components/dashboard/BuyerProfitTable';
import { BarChart3, CheckCircle2 } from 'lucide-react';
import { formatRp } from '@/lib/utils';

export default function DashboardPage() {
  const { metrics, monthlyProfit, buyerSummaries } = useOrders();

  const totalCollected = Math.max(0, metrics.totalOmzet - metrics.totalPiutangDp);
  const collectionRate =
    metrics.totalOmzet > 0
      ? Math.round((totalCollected / metrics.totalOmzet) * 100)
      : 100;

  return (
    <div className="flex flex-col gap-5">
      {/* Header Banner - Notion deep navy hero band */}
      <div className="relative overflow-hidden bg-[#0a1530] p-4 sm:p-5 md:p-6 rounded-xl border border-[#1a2a52] shadow-notion-hero animate-fade-in-up flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Subtle decorative Notion sticky-note dots & mesh background */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#5645d4]/10 blur-2xl pointer-events-none" />
        <div className="absolute top-3 right-28 w-2 h-2 rounded-full bg-[#ffe8d4] opacity-80" />
        <div className="absolute top-6 right-20 w-1.5 h-1.5 rounded-full bg-[#d9f3e1] opacity-70" />
        <div className="absolute bottom-4 right-36 w-2 h-2 rounded-full bg-[#dcecfa] opacity-75" />
        <div className="absolute top-5 right-8 w-2 h-2 rounded-full bg-[#fde0ec] opacity-80" />
        <div className="absolute bottom-3 right-12 w-1.5 h-1.5 rounded-full bg-[#f9e79f] opacity-70" />

        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#5645d4] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(86,69,212,0.4)] shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Rekapan & Omzet
            </h1>
            <p className="text-xs text-white/85 mt-0.5">
              Pantau omzet, laba bersih, dan pelanggan terbaik.
            </p>
          </div>
        </div>

        {/* Cash Flow Quick Status - Dark navy chip with crisp contrast */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1a2a52] border border-[#2a3c6b] text-white text-xs font-medium shadow-xs w-full sm:w-auto">
            <CheckCircle2 className="w-4 h-4 text-[#1aae39]" />
            <span>Kas Terkumpul: <strong className="text-white font-semibold">{formatRp(totalCollected)}</strong> ({collectionRate}%)</span>
          </div>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <MetricCards metrics={metrics} />

      {/* Monthly Profit Pure SVG Chart */}
      <MonthlyProfitChart data={monthlyProfit} />

      {/* Customer Profitability Table */}
      <BuyerProfitTable buyers={buyerSummaries} />
    </div>
  );
}
