'use client';

import React from 'react';
import { useOrders } from '@/context/OrderContext';
import OrderFilterTabs from '@/components/order/OrderFilterTabs';
import OrderSortableList from '@/components/order/OrderSortableList';
import { Layers, ArrowUpDown, Sparkles, Plus } from 'lucide-react';

export default function OrderPage() {
  const {
    orders,
    searchQuery,
    filterTab,
    dateFilter,
    openCreateModal,
    loading,
  } = useOrders();

  // Filter and sort orders according to active criteria
  const sortedOrders = React.useMemo(() => {
    const filtered = orders.filter((order) => {
      // 1. Text Search query
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

      // 2. Tab Filter
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

      // 3. Date Filter
      if (dateFilter) {
        if (order.deadline !== dateFilter && order.orderDate !== dateFilter) {
          return false;
        }
      }

      return true;
    });

    return [...filtered].sort(
      (a, b) => (a.queueOrder || 0) - (b.queueOrder || 0)
    );
  }, [orders, searchQuery, filterTab, dateFilter]);

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
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Antrean Pesanan
            </h1>
            <p className="text-xs text-white/85 mt-0.5">
              Kelola prioritas cetak dan verifikasi berkas.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1a2a52] border border-[#2a3c6b] text-xs font-medium text-white/90 shadow-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#d6b6f6]" />
            <span>Urutan Prioritas</span>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5645d4] hover:bg-[#4534b3] active:bg-[#3a2a99] text-white text-xs font-semibold rounded-md shadow-[0_4px_12px_rgba(86,69,212,0.4)] btn-bounce cursor-pointer min-h-[36px]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Input Pesanan</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Content Section */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-[#d6d3cd] shadow-notion-panel animate-fade-in-up delay-75 flex flex-col gap-4">
        <OrderFilterTabs />

        {/* Tip Banner - Notion pastel lavender */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#e6e0f5]/40 border border-[#e5e3df] text-xs text-[#37352f]">
          <Sparkles className="w-4 h-4 text-[#5645d4] shrink-0" />
          <span>
            Tips: Geser baris untuk mengatur urutan prioritas mesin sablon.
          </span>
        </div>

        {/* Sortable Orders List */}
        {loading ? (
          <div className="p-12 text-center text-xs text-[#787671]">
            Memuat antrean...
          </div>
        ) : (
          <OrderSortableList orders={sortedOrders} />
        )}
      </div>
    </div>
  );
}
