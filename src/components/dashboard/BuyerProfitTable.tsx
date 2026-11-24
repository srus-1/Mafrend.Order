'use client';

import React, { useState } from 'react';
import { BuyerSummary } from '@/types/order';
import { formatRp } from '@/lib/utils';
import { MessageCircle, Search, X } from 'lucide-react';

interface BuyerProfitTableProps {
  buyers: BuyerSummary[];
}

export default function BuyerProfitTable({ buyers }: BuyerProfitTableProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredBuyers = buyers.filter(
    (b) =>
      b.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.buyerPhone.includes(searchTerm)
  );

  const getRankBadgeClass = (rank?: number) => {
    if (rank === 1) return 'bg-[#F9DC7E] text-[#14161D]';
    if (rank === 2) return 'bg-[#8EA6FF] text-[#14161D]';
    if (rank === 3) return 'bg-[#F29B76] text-[#14161D]';
    return 'bg-[var(--bg-chip-on-row)] text-[var(--ink-secondary)]';
  };

  return (
    <div className="bg-[var(--bg-surface)] shadow-[var(--shadow-card)] rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-[var(--ink-primary)]">
          Ranking Pelanggan
        </h2>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama atau nomor WhatsApp..."
            aria-label="Cari pelanggan"
            className="w-full pl-9 pr-8 py-2 min-h-[38px] text-xs font-medium bg-[var(--bg-subtle)] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] rounded-xl"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="Hapus pencarian pelanggan"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {filteredBuyers.length === 0 ? (
        <div className="py-10 text-center text-xs font-medium text-[var(--ink-muted)] bg-[var(--bg-row)] rounded-xl">
          Belum ada data pelanggan pada periode ini.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-3.5 text-[11px] font-semibold text-[var(--ink-muted)]">
            <span className="col-span-4">Pelanggan</span>
            <span className="col-span-2">Total Pesanan</span>
            <span className="col-span-2 text-right">Omzet</span>
            <span className="col-span-2 text-right">Modal (HPP)</span>
            <span className="col-span-2 text-right">Laba & Margin</span>
          </div>

          {filteredBuyers.map((buyer) => {
            const cleanPhone = buyer.buyerPhone.replace(/\D/g, '');
            const waNumber = cleanPhone.startsWith('0')
              ? `62${cleanPhone.slice(1)}`
              : cleanPhone;
            const waUrl = `https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(
              buyer.buyerName
            )},%20terima%20kasih%20telah%20memesan%20di%20Mafrend.Studio`;

            return (
              <div
                key={buyer.buyerName}
                className="p-3.5 rounded-xl bg-[var(--bg-row)] hover:bg-[var(--bg-hover)]/70 transition-colors grid grid-cols-1 lg:grid-cols-12 lg:items-center gap-3"
              >
                <div className="lg:col-span-4 flex items-center gap-3 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 tabular-nums ${getRankBadgeClass(
                      buyer.rank
                    )}`}
                  >
                    {buyer.rank}
                  </span>

                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[var(--ink-primary)] truncate">
                      {buyer.buyerName}
                    </div>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--ink-muted)] hover:text-[var(--ink-primary)] mt-0.5"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>{buyer.buyerPhone}</span>
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-2 flex items-center">
                  <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-chip-on-row)] text-[11px] font-bold text-[var(--ink-primary)] tabular-nums">
                    {buyer.totalOrders}x • {buyer.totalPcs.toLocaleString('id-ID')} pcs
                  </span>
                </div>

                <div className="lg:col-span-2 flex items-center justify-between lg:block lg:text-right">
                  <span className="text-[11px] font-semibold text-[var(--ink-muted)] lg:hidden">
                    Omzet
                  </span>
                  <span className="text-xs font-bold text-[var(--ink-primary)] tabular-nums">
                    {formatRp(buyer.totalOmzet)}
                  </span>
                </div>

                <div className="lg:col-span-2 flex items-center justify-between lg:block lg:text-right">
                  <span className="text-[11px] font-semibold text-[var(--ink-muted)] lg:hidden">
                    Modal (HPP)
                  </span>
                  <span className="text-xs font-semibold text-[var(--ink-secondary)] tabular-nums">
                    {formatRp(buyer.totalHpp)}
                  </span>
                </div>

                <div className="lg:col-span-2 flex items-center justify-between lg:justify-end gap-2.5">
                  <div className="text-left lg:text-right">
                    <div className="text-[10px] font-semibold text-[var(--ink-muted)] lg:hidden">
                      Laba Bersih
                    </div>
                    <div className="text-xs font-bold text-[var(--ink-profit)] tabular-nums">
                      {formatRp(buyer.totalProfit)}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold tabular-nums shrink-0 ${
                      buyer.marginPct >= 30
                        ? 'bg-[#6EEB9A] text-[#14161D]'
                        : buyer.marginPct >= 15
                        ? 'bg-[#8EA6FF] text-[#14161D]'
                        : 'bg-[#F29B76] text-[#14161D]'
                    }`}
                  >
                    {buyer.marginPct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
