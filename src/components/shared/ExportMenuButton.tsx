'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Download } from 'lucide-react';

export interface ExportMenuButtonProps {
  label: string;
  ariaLabel?: string;
  variant?: 'navy' | 'purple' | 'light-lavender' | 'light-mint' | 'light-neutral';
  iconOnlyMobile?: boolean;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
}

export default function ExportMenuButton({
  label,
  ariaLabel,
  iconOnlyMobile = false,
  onExportExcel,
  onExportPDF,
  onExportCSV,
}: ExportMenuButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={ariaLabel || label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] shadow-[var(--shadow-card)] text-[var(--ink-primary)] text-xs font-semibold transition-all active:scale-[0.97] min-h-[38px] ${
          iconOnlyMobile ? 'w-[38px] sm:w-auto px-0 sm:px-3.5 py-2' : 'px-3.5 py-2'
        }`}
      >
        {iconOnlyMobile && <Download className="w-4 h-4 sm:hidden" />}
        <span className={iconOnlyMobile ? 'hidden sm:inline' : ''}>{label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[var(--ink-muted)] transition-transform duration-150 ${
            iconOnlyMobile ? 'hidden sm:block' : ''
          } ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Pilih format unduhan PDF, Excel, atau CSV"
          className="absolute right-0 mt-1.5 w-56 rounded-2xl bg-[var(--bg-surface-elevated)] shadow-[0_16px_40px_rgba(0,0,0,0.2)] p-1.5 z-50 flex flex-col gap-0.5 text-left"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onExportPDF();
            }}
            className="w-full px-3 py-2.5 rounded-xl hover:bg-[var(--bg-row)] transition-colors text-left flex items-center justify-between gap-2"
          >
            <span className="text-xs font-bold text-[var(--ink-primary)]">Unduh PDF</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F29B76] text-[#14161D]">
              Cetak
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onExportExcel();
            }}
            className="w-full px-3 py-2.5 rounded-xl hover:bg-[var(--bg-row)] transition-colors text-left flex items-center justify-between gap-2"
          >
            <span className="text-xs font-bold text-[var(--ink-primary)]">Unduh Excel</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#6EEB9A] text-[#14161D]">
              .xlsx
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onExportCSV();
            }}
            className="w-full px-3 py-2.5 rounded-xl hover:bg-[var(--bg-row)] transition-colors text-left flex items-center justify-between gap-2"
          >
            <span className="text-xs font-bold text-[var(--ink-primary)]">Unduh CSV</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#8EA6FF] text-[#14161D]">
              Data
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
