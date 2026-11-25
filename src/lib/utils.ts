import { HPPBreakdown } from '@/types/order';

export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

/**
 * Formats a YYYY-MM month key into Indonesian full month label.
 * Example: "2026-11" -> "November 2026", "ALL" -> "Semua Bulan"
 */
export function formatMonthLabel(monthKey: string): string {
  if (!monthKey || monthKey === 'ALL') return 'Semua Bulan';
  if (!monthKey.includes('-')) return monthKey;
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${INDONESIAN_MONTHS[monthIdx]} ${yearStr}`;
  }
  return monthKey;
}

/**
 * Formats a number into Indonesian Rupiah currency string.
 * Example: 2500000 -> "Rp 2.500.000"
 */
export function formatRp(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }
  const isNegative = amount < 0;
  const absVal = Math.round(Math.abs(amount));
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(absVal);

  return `${isNegative ? '-Rp ' : 'Rp '}${formatted}`;
}

/**
 * Formats an ISO date string into Indonesian short date.
 * Example: "2026-10-24" -> "24 Okt 2026"
 */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-';
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];
  try {
    const isoMatch = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const monthIdx = Number(isoMatch[2]) - 1;
      const day = Number(isoMatch[3]);
      if (monthIdx >= 0 && monthIdx < 12 && day >= 1 && day <= 31) {
        return `${day} ${months[monthIdx]} ${year}`;
      }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

/**
 * Calculates total HPP per pcs and total HPP across given quantity.
 */
export function calculateHPP(
  breakdown: Omit<HPPBreakdown, 'totalHppPerPcs' | 'totalHpp'>,
  qty: number
): HPPBreakdown {
  const safeQty = Math.max(1, qty || 1);
  const bahanBaku = Math.max(0, breakdown.bahanBaku || 0);
  const tintaSablon = Math.max(0, breakdown.tintaSablon || 0);
  const tenagaKerja = Math.max(0, breakdown.tenagaKerja || 0);
  const kemasan = Math.max(0, breakdown.kemasan || 0);
  const overhead = Math.max(0, breakdown.overhead || 0);

  const totalHppPerPcs = bahanBaku + tintaSablon + tenagaKerja + kemasan + overhead;
  const totalHpp = totalHppPerPcs * safeQty;

  return {
    bahanBaku,
    tintaSablon,
    tenagaKerja,
    kemasan,
    overhead,
    totalHppPerPcs,
    totalHpp,
  };
}

/**
 * Computes net profit and profit margin percentage.
 */
export function calculateMargin(
  omzet: number,
  hpp: number
): { profit: number; marginPct: number } {
  const safeOmzet = Math.max(0, omzet || 0);
  const safeHpp = Math.max(0, hpp || 0);
  const profit = safeOmzet - safeHpp;
  const rawPct = safeOmzet > 0 ? (profit / safeOmzet) * 100 : 0;
  const marginPct = Math.round(rawPct * 10) / 10; // e.g. 38.5%

  return {
    profit,
    marginPct,
  };
}

/**
 * Builds a normalized Indonesian WhatsApp deep link (62... format).
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '');
  const waNumber = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  if (!message) {
    return `https://wa.me/${waNumber}`;
  }
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
}
