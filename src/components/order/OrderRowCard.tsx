'use client';

import React, { useState } from 'react';
import {
  GripVertical,
  ChevronRight,
  ChevronDown,
  MessageCircle,
} from 'lucide-react';
import { Order, PaymentStatus, ProcessStatus } from '@/types/order';
import { formatRp, formatDateShort, buildWhatsAppUrl } from '@/lib/utils';
import { useOrders } from '@/context/OrderContext';
import ActionMenuDropdown from '@/components/shared/ActionMenuDropdown';
import CustomSelect, { CustomSelectOption } from '@/components/shared/CustomSelect';

const PAYMENT_OPTIONS: CustomSelectOption[] = [
  { value: 'LUNAS', label: 'Lunas', badgeClass: 'bg-[#6EEB9A]' },
  { value: 'DP', label: 'DP', badgeClass: 'bg-[#8EA6FF]' },
  { value: 'BELUM_LUNAS', label: 'Belum lunas', badgeClass: 'bg-[#F29B76]' },
];

const PROCESS_OPTIONS: CustomSelectOption[] = [
  { value: 'ANTREAN', label: 'Antrean 1/6', badgeClass: 'bg-[#8EA6FF]' },
  { value: 'SETTING_DESAIN', label: 'Setting 2/6', badgeClass: 'bg-[#8EA6FF]' },
  { value: 'PROSES_CETAK', label: 'Cetak 3/6', badgeClass: 'bg-[#8EA6FF]' },
  { value: 'FINISHING', label: 'Finishing 4/6', badgeClass: 'bg-[#F9DC7E]' },
  { value: 'SIAP_KIRIM', label: 'Siap Kirim 5/6', badgeClass: 'bg-[#F29B76]' },
  { value: 'SELESAI', label: 'Selesai 6/6', badgeClass: 'bg-[#6EEB9A]' },
];

// Vivid Reference Palette Pills (WCAG AA >= 7.79:1 with #14161D ink)
const PAYMENT_BADGE_STYLES: Record<PaymentStatus, string> = {
  LUNAS: 'bg-[#6EEB9A] text-[#14161D]',
  DP: 'bg-[#8EA6FF] text-[#14161D]',
  BELUM_LUNAS: 'bg-[#F29B76] text-[#14161D]',
};

const PROCESS_BADGE_STYLES: Record<ProcessStatus, string> = {
  ANTREAN: 'bg-[#8EA6FF] text-[#14161D]',
  SETTING_DESAIN: 'bg-[#8EA6FF] text-[#14161D]',
  PROSES_CETAK: 'bg-[#8EA6FF] text-[#14161D]',
  FINISHING: 'bg-[#F9DC7E] text-[#14161D]',
  SIAP_KIRIM: 'bg-[#F29B76] text-[#14161D]',
  SELESAI: 'bg-[#6EEB9A] text-[#14161D]',
};

interface OrderRowCardProps {
  order: Order;
  index: number;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'MF';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

const AVATAR_TONES = [
  'bg-[#F9DC7E] text-[#14161D]',
  'bg-[#8EA6FF] text-[#14161D]',
  'bg-[#6EEB9A] text-[#14161D]',
  'bg-[#F29B76] text-[#14161D]',
];

function getAvatarTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

function OrderRowCardComponent({
  order,
  index,
  isDragging = false,
  dragHandleProps,
  isSelected: propIsSelected,
  onToggleSelect,
}: OrderRowCardProps) {
  const {
    openEditModal,
    deleteOrder,
    setActiveDrawerOrder,
    updateOrder,
    selectedOrderIds = [],
    toggleSelectOrder,
  } = useOrders();

  const [isExpanded, setIsExpanded] = useState(false);

  const isSelected =
    propIsSelected !== undefined
      ? propIsSelected
      : selectedOrderIds.includes(order.id);

  const handleToggleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(order.id);
    } else if (toggleSelectOrder) {
      toggleSelectOrder(order.id);
    }
  };

  const handlePaymentChange = (nextValue: string) => {
    updateOrder(order.id, { paymentStatus: nextValue as PaymentStatus });
  };

  const handleProcessChange = (nextValue: string) => {
    updateOrder(order.id, { processStatus: nextValue as ProcessStatus });
  };

  const waUrl = buildWhatsAppUrl(
    order.buyerPhone,
    `Halo ${order.buyerName}, update pesanan ${order.orderNumber} di Mafrend.Studio`
  );

  const totalFilesCount = (order.designFiles || []).length;
  const readyFilesCount = (order.designFiles || []).filter((f) => f.isReadyToPrint).length;
  const isNegativeMargin = order.marginPct < 0;

  const actionMenuItems = [
    { label: 'Edit', onClick: () => openEditModal(order) },
    {
      label: `Lihat berkas (${totalFilesCount})`,
      onClick: () => setActiveDrawerOrder(order),
    },
    {
      label: 'Hapus',
      tone: 'danger' as const,
      onClick: () => {
        if (confirm(`Hapus pesanan ${order.orderNumber}?`)) {
          deleteOrder(order.id);
        }
      },
    },
  ];

  const hasSpecs = Boolean(order.specs && order.specs.trim());
  const hasNotes = Boolean(order.notes && order.notes.trim());

  return (
    <div
      className={`rounded-xl transition-colors ${
        isSelected
          ? 'bg-[var(--bg-hover)]'
          : 'bg-[var(--bg-row)] hover:bg-[var(--bg-hover)]/70'
      } ${isDragging ? 'order-row-active z-30' : ''}`}
    >
      <div className="p-3 lg:px-3.5 lg:py-2.5 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3">
        <div className="flex items-center justify-between lg:justify-start gap-2 min-w-0 lg:w-[270px] shrink-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleToggleSelect}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded accent-[#4638F5] shrink-0"
              aria-label={`Pilih pesanan ${order.orderNumber}`}
            />

            <button
              type="button"
              {...dragHandleProps}
              className="w-7 h-7 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-chip-on-row)] cursor-grab active:cursor-grabbing flex items-center justify-center touch-none shrink-0"
              title={`Antrean #${order.queueOrder || index + 1}`}
              aria-label="Atur prioritas antrean"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Tutup rincian pesanan' : 'Buka rincian pesanan'}
              className="w-7 h-7 rounded-lg bg-[var(--bg-chip-on-row)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] flex items-center justify-center shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            <div
              className={`w-8 h-8 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${getAvatarTone(
                order.buyerName
              )}`}
            >
              {getInitials(order.buyerName)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-xs font-bold text-[var(--ink-primary)] truncate lg:max-w-[125px]"
                  title={order.buyerName}
                >
                  {order.buyerName}
                </span>
              </div>
              <div className="text-[11px] font-medium text-[var(--ink-muted)] tabular-nums">
                #{order.orderNumber}
              </div>
            </div>
          </div>

          <div className="lg:hidden shrink-0">
            <ActionMenuDropdown
              ariaLabel={`Menu aksi ${order.orderNumber}`}
              items={actionMenuItems}
            />
          </div>
        </div>

        <div className="flex items-start justify-between gap-3 lg:contents">
          <div
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex-1 min-w-0 cursor-pointer"
          >
            <div
              className="text-xs font-semibold text-[var(--ink-primary)] line-clamp-1 break-words"
              title={order.productName}
            >
              {order.productName}
            </div>
            <div
              className="text-[11px] text-[var(--ink-muted)] line-clamp-1 break-words mt-0.5"
              title={order.specs || 'Spesifikasi standar'}
            >
              {hasSpecs ? order.specs : 'Spesifikasi standar'}
            </div>
          </div>

          <div className="lg:hidden shrink-0 text-right">
            <div className="text-xs font-bold text-[var(--ink-primary)] tabular-nums whitespace-nowrap">
              {formatRp(order.omzet)}
            </div>
            <div className="text-[11px] font-semibold tabular-nums whitespace-nowrap mt-0.5">
              <span className="text-[var(--ink-muted)]">
                {order.qty.toLocaleString('id-ID')} pcs
              </span>
              <span className="mx-1 text-[var(--ink-muted)]">·</span>
              <span
                className={
                  isNegativeMargin ? 'text-[var(--ink-danger)]' : 'text-[var(--ink-profit)]'
                }
              >
                {order.marginPct}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-2 shrink-0 pt-1 lg:pt-0">
          <span className="hidden lg:inline-block px-2.5 py-1 rounded-lg bg-[var(--bg-chip-on-row)] text-[11px] font-bold text-[var(--ink-primary)] tabular-nums whitespace-nowrap">
            {order.qty.toLocaleString('id-ID')} pcs
          </span>

          <div className="hidden lg:flex flex-col items-end min-w-[116px]">
            <span className="text-xs font-bold text-[var(--ink-primary)] tabular-nums whitespace-nowrap">
              {formatRp(order.omzet)}
            </span>
            <span
              className={`text-[11px] font-semibold tabular-nums whitespace-nowrap ${
                isNegativeMargin ? 'text-[var(--ink-danger)]' : 'text-[var(--ink-profit)]'
              }`}
            >
              Laba {order.marginPct}%
            </span>
          </div>

          <span className="hidden xl:inline-block w-[86px] text-right text-[11px] font-medium text-[var(--ink-muted)] tabular-nums whitespace-nowrap">
            {formatDateShort(order.deadline)}
          </span>

          <div className="flex items-center gap-1.5 lg:gap-2">
            <CustomSelect
              size="pill"
              align="left"
              ariaLabel={`Status pembayaran ${order.orderNumber}`}
              value={order.paymentStatus}
              onChange={handlePaymentChange}
              options={PAYMENT_OPTIONS}
              triggerClassName={
                PAYMENT_BADGE_STYLES[order.paymentStatus] || PAYMENT_BADGE_STYLES.BELUM_LUNAS
              }
            />

            <CustomSelect
              size="pill"
              align="right"
              ariaLabel={`Status produksi ${order.orderNumber}`}
              value={order.processStatus}
              onChange={handleProcessChange}
              options={PROCESS_OPTIONS}
              triggerClassName={
                PROCESS_BADGE_STYLES[order.processStatus] || PROCESS_BADGE_STYLES.ANTREAN
              }
            />
          </div>

          <span className="lg:hidden text-[11px] font-medium text-[var(--ink-muted)] tabular-nums whitespace-nowrap">
            {formatDateShort(order.deadline)}
          </span>

          <div className="hidden lg:block shrink-0">
            <ActionMenuDropdown
              ariaLabel={`Menu aksi ${order.orderNumber}`}
              items={actionMenuItems}
            />
          </div>
        </div>
      </div>

      {/* Expandable Inline Detail Drawer (Preserves 12-Col Grid & Scrollable Specs/Notes) */}
      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-1">
          <div className="bg-[var(--bg-chip-on-row)] rounded-xl p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch min-w-0">
            {/* Left 7 Columns: HPP Breakdown Chips + Financial Summary + WhatsApp */}
            <div className="md:col-span-7 flex flex-col justify-between gap-3 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#6EEB9A] text-[#14161D] text-[11px] font-bold min-h-[30px]"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{order.buyerPhone}</span>
                </a>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--ink-secondary)]">
                  <span>Deadline: <strong>{formatDateShort(order.deadline)}</strong></span>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setActiveDrawerOrder(order)}
                    className="font-semibold text-[var(--ink-primary)] underline"
                  >
                    Berkas ({readyFilesCount}/{totalFilesCount} siap)
                  </button>
                </div>
              </div>

              {/* 5 Separated HPP Component Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="px-2 py-1 rounded-lg bg-[var(--bg-row)] text-[var(--ink-secondary)] tabular-nums">
                  Bahan <strong>{formatRp(order.hppBreakdown.bahanBaku)}</strong>
                </span>
                <span className="px-2 py-1 rounded-lg bg-[var(--bg-row)] text-[var(--ink-secondary)] tabular-nums">
                  Tinta <strong>{formatRp(order.hppBreakdown.tintaSablon)}</strong>
                </span>
                <span className="px-2 py-1 rounded-lg bg-[var(--bg-row)] text-[var(--ink-secondary)] tabular-nums">
                  Kerja <strong>{formatRp(order.hppBreakdown.tenagaKerja)}</strong>
                </span>
                <span className="px-2 py-1 rounded-lg bg-[var(--bg-row)] text-[var(--ink-secondary)] tabular-nums">
                  Kemas <strong>{formatRp(order.hppBreakdown.kemasan)}</strong>
                </span>
                <span className="px-2 py-1 rounded-lg bg-[var(--bg-row)] text-[var(--ink-secondary)] tabular-nums">
                  OH <strong>{formatRp(order.hppBreakdown.overhead)}</strong>
                </span>
              </div>

              {/* Bottom Financial Strip */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-[var(--bg-row)] px-2.5 py-2">
                  <div className="text-[10px] font-medium text-[var(--ink-muted)]">Total HPP</div>
                  <div className="text-xs font-bold text-[var(--ink-primary)] tabular-nums mt-0.5">
                    {formatRp(order.hppBreakdown.totalHpp)}
                  </div>
                </div>
                <div className="rounded-lg bg-[var(--bg-row)] px-2.5 py-2">
                  <div className="text-[10px] font-medium text-[var(--ink-muted)]">Laba Bersih</div>
                  <div className="text-xs font-bold text-[var(--ink-profit)] tabular-nums mt-0.5">
                    {formatRp(order.profit)}
                  </div>
                </div>
                <div className="rounded-lg bg-[var(--bg-row)] px-2.5 py-2">
                  <div className="text-[10px] font-medium text-[var(--ink-muted)]">Sisa Tagihan</div>
                  <div className="text-xs font-bold text-[var(--ink-primary)] tabular-nums mt-0.5">
                    {formatRp(order.remainingPayment)}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Detail Pesanan + Bounded Scrollable Specs & Notes */}
            <div className="md:col-span-5 min-w-0 flex flex-col justify-between bg-[var(--bg-row)] rounded-xl p-3 gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                  Detail Pesanan
                </div>
                <div className="text-xs font-bold text-[var(--ink-primary)] line-clamp-1 break-words mt-0.5">
                  {order.productName} (@{formatRp(order.pricePerPcs)}/pcs)
                </div>
                <div className="max-h-14 overflow-y-auto overflow-x-hidden pr-1 text-xs text-[var(--ink-secondary)] leading-relaxed break-words mt-1">
                  {hasSpecs ? order.specs : 'Spesifikasi standar'}
                </div>
              </div>

              {hasNotes && (
                <div className="px-2.5 py-1.5 rounded-lg bg-[#F9DC7E] text-[#14161D] text-[11px] max-h-14 overflow-y-auto overflow-x-hidden break-words leading-snug">
                  <strong>Catatan: </strong>
                  <span>{order.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const OrderRowCard = React.memo(OrderRowCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.order === nextProps.order &&
    prevProps.index === nextProps.index &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isSelected === nextProps.isSelected
  );
});

export default OrderRowCard;
