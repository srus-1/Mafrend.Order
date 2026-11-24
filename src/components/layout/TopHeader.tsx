'use client';

import React from 'react';
import Image from 'next/image';
import { Menu, Calculator, Moon, Sun } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { useTheme } from '@/context/ThemeContext';
import { useCalculator } from '@/context/CalculatorContext';

/**
 * Clean Mobile Top Bar (< 768px only).
 * Desktop pages render their own minimalist single-line page header with zero redundant bars.
 */
export default function TopHeader() {
  const { isMobileOpen, toggleMobile } = useSidebar();
  const { isDark, toggleTheme } = useTheme();
  const { isOpen: isCalcOpen, toggleCalculator } = useCalculator();

  return (
    <header className="md:hidden sticky top-0 z-20 bg-[var(--bg-surface)] shadow-[var(--shadow-card)] px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={toggleMobile}
          className="w-10 h-10 -ml-1 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--ink-primary)] flex items-center justify-center shrink-0 transition-all active:scale-95"
          aria-label="Buka menu navigasi"
          aria-expanded={isMobileOpen}
          aria-controls="mobile-sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <span className="w-7 h-7 rounded-lg bg-[#191D32] p-1 flex items-center justify-center shrink-0">
          <Image
            src="/logo-mafrend.png"
            alt="Mafrend.Studio"
            width={20}
            height={20}
            className="w-5 h-5 object-contain"
          />
        </span>
        <span className="text-sm font-bold tracking-tight text-[var(--ink-primary)] truncate">
          Mafrend.Studio
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={toggleCalculator}
          aria-label="Buka kalkulator"
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isCalcOpen
              ? 'bg-[#4638F5] text-[#FFFFFF]'
              : 'bg-[var(--bg-subtle)] text-[var(--ink-primary)]'
          }`}
        >
          <Calculator className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
          className="w-10 h-10 rounded-xl bg-[var(--bg-subtle)] text-[var(--ink-primary)] flex items-center justify-center transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className="sr-only">
            {isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
          </span>
        </button>
      </div>
    </header>
  );
}
