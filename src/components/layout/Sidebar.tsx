'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Layers,
  Package,
  BarChart3,
  History,
  Receipt,
  PanelLeftClose,
  PanelLeftOpen,
  Calculator,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { useOrders } from '@/context/OrderContext';
import { useTheme } from '@/context/ThemeContext';
import { useCalculator } from '@/context/CalculatorContext';
import {
  SIDEBAR_COLLAPSED_WIDTH,
  resolveSidebarDrag,
  detectSwipeGesture,
} from '@/lib/sidebar';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: 'ordersCount' | 'new';
}

const navItems: NavItem[] = [
  {
    label: 'Antrean Pesanan',
    href: '/order',
    icon: Layers,
    badge: 'ordersCount',
  },
  {
    label: 'Katalog & HPP',
    href: '/catalog',
    icon: Package,
    badge: 'new',
  },
  {
    label: 'Rekapan & Omzet',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    label: 'Riwayat & Arsip',
    href: '/history',
    icon: History,
  },
  {
    label: 'Capex & Bahan',
    href: '/capex',
    icon: Receipt,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { orders } = useOrders();
  const {
    width,
    isCollapsed,
    isDragging,
    isMobileOpen,
    setWidth,
    setIsCollapsed,
    toggleCollapsed,
    closeMobile,
    setIsDragging,
  } = useSidebar();
  const { isDark, toggleTheme } = useTheme();
  const { isOpen: isCalcOpen, toggleCalculator } = useCalculator();

  const mobileTouchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMobileTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (e.touches.length === 1) {
      mobileTouchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleMobileTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    if (e.changedTouches.length === 1) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const gesture = detectSwipeGesture(mobileTouchStartRef.current, { x: endX, y: endY });
      if (gesture === 'CLOSE_MOBILE') {
        closeMobile();
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const resolved = resolveSidebarDrag(moveEvent.clientX);
      if (resolved.isCollapsed) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
        setWidth(resolved.width);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const desktopWidth = isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : width;

  return (
    <>
      {/* 1. DESKTOP SIDEBAR (Zero-Border Tonal Surface) */}
      <aside
        style={{ width: desktopWidth }}
        className={`hidden md:flex flex-col justify-between shrink-0 min-h-screen bg-[var(--bg-surface)] text-[var(--ink-primary)] shadow-[var(--shadow-card)] relative z-20 select-none ${
          isDragging ? 'transition-none' : 'transition-[width] duration-200 ease-in-out'
        }`}
      >
        <div>
          {/* Brand Header (Zero Sub-Headline, Crisp Uncropped Logo) */}
          {isCollapsed ? (
            <div className="pt-5 pb-4 px-2 flex flex-col items-center gap-3">
              <Link
                href="/order"
                className="w-9 h-9 rounded-xl bg-[#191D32] p-1.5 flex items-center justify-center shrink-0 transition-transform active:scale-95"
                title="Mafrend.Studio"
              >
                <Image
                  src="/logo-mafrend.png"
                  alt="Mafrend.Studio"
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain"
                />
              </Link>
              <button
                type="button"
                onClick={toggleCollapsed}
                className="w-9 h-9 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--ink-secondary)] flex items-center justify-center transition-all active:scale-95"
                aria-label="Perluas sidebar"
                title="Perluas sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="pt-5 pb-4 px-4 flex items-center justify-between gap-2">
              <Link href="/order" className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-[#191D32] p-1 flex items-center justify-center shrink-0">
                  <Image
                    src="/logo-mafrend.png"
                    alt="Mafrend.Studio"
                    width={24}
                    height={24}
                    className="w-6 h-6 object-contain"
                  />
                </span>
                <span className="text-[15px] font-bold tracking-tight text-[var(--ink-primary)] truncate">
                  Mafrend.Studio
                </span>
              </Link>
              <button
                type="button"
                onClick={toggleCollapsed}
                className="w-8 h-8 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--ink-secondary)] flex items-center justify-center transition-all active:scale-95 shrink-0"
                aria-label="Ciutkan sidebar"
                title="Ciutkan sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Menu (No Sub-Headlines) */}
          <nav className={`mt-2 flex flex-col gap-1.5 ${isCollapsed ? 'px-2.5' : 'px-3'}`}>
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/order' && pathname?.startsWith(item.href)) ||
                (item.href === '/order' && (pathname === '/' || pathname === '/order'));
              const Icon = item.icon;

              return (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    className={`rounded-xl flex items-center text-[13px] font-semibold transition-colors min-h-[42px] ${
                      isCollapsed ? 'justify-center px-2' : 'px-3.5 gap-3'
                    } ${
                      isActive
                        ? 'bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]'
                        : 'text-[var(--ink-secondary)] hover:bg-[var(--bg-row)] hover:text-[var(--ink-primary)]'
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    {!isCollapsed && (
                      <span className="flex-1 truncate">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge === 'ordersCount' && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums shrink-0 ${
                          isActive
                            ? 'bg-[#4638F5] text-[#FFFFFF]'
                            : 'bg-[#8EA6FF] text-[#14161D]'
                        }`}
                      >
                        {orders.length}
                      </span>
                    )}
                    {!isCollapsed && item.badge === 'new' && (
                      <span className="px-2 py-0.5 rounded-full bg-[#8EA6FF] text-[#14161D] text-[10px] font-bold shrink-0">
                        Baru
                      </span>
                    )}
                  </Link>

                  {isCollapsed && (
                    <div
                      role="tooltip"
                      className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[#23252C] text-[#FFFFFF] text-xs font-semibold whitespace-nowrap shadow-lg z-50 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150"
                    >
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Utility Dock: Calculator + Single-Icon Theme Toggle (Replaces Shift Workshop Aktif) */}
        {isCollapsed ? (
          <div className="p-2.5 pb-5 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={toggleCalculator}
              aria-label="Buka kalkulator (Alt+K)"
              title="Kalkulator (Alt+K)"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isCalcOpen
                  ? 'bg-[#4638F5] text-[#FFFFFF]'
                  : 'bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--ink-primary)]'
              }`}
            >
              <Calculator className="w-[18px] h-[18px]" />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
              title={isDark ? 'Mode Terang' : 'Mode Gelap'}
              className="w-10 h-10 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--ink-primary)] flex items-center justify-center transition-colors"
            >
              {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
              <span className="sr-only">
                {isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
              </span>
            </button>
          </div>
        ) : (
          <div className="p-3 pb-5 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleCalculator}
              aria-label="Kalkulator (Alt+K)"
              className={`flex-1 min-h-[42px] px-3 rounded-xl flex items-center justify-between text-xs font-semibold transition-colors ${
                isCalcOpen
                  ? 'bg-[#4638F5] text-[#FFFFFF]'
                  : 'bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--ink-primary)]'
              }`}
            >
              <span className="inline-flex items-center gap-2 truncate">
                <Calculator className="w-4 h-4 shrink-0" />
                <span className="truncate">Kalkulator</span>
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold shrink-0 ${
                  isCalcOpen
                    ? 'bg-white/20 text-[#FFFFFF]'
                    : 'bg-[var(--bg-surface)] text-[var(--ink-muted)]'
                }`}
              >
                Alt+K
              </span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
              title={isDark ? 'Mode Terang' : 'Mode Gelap'}
              className="w-[42px] h-[42px] shrink-0 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--ink-primary)] flex items-center justify-center transition-colors"
            >
              {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
              <span className="sr-only">
                {isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
              </span>
            </button>
          </div>
        )}

        {/* Desktop Drag Resize Handle */}
        <div
          onPointerDown={handlePointerDown}
          className="absolute top-0 right-0 w-2 h-full cursor-col-resize z-30 touch-none select-none group"
          title="Tarik untuk mengubah lebar sidebar"
        >
          <div
            className={`w-[3px] h-full ml-auto transition-colors duration-150 ${
              isDragging ? 'bg-[#4638F5]' : 'group-hover:bg-[#4638F5]/40'
            }`}
          />
        </div>
      </aside>

      {/* 2. MOBILE OFF-CANVAS DRAWER */}
      <div
        className={`fixed inset-0 z-40 bg-black/55 transition-opacity duration-200 md:hidden ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      <aside
        id="mobile-sidebar"
        aria-label="Navigasi Menu Mobile"
        onTouchStart={handleMobileTouchStart}
        onTouchEnd={handleMobileTouchEnd}
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[var(--bg-surface)] text-[var(--ink-primary)] shadow-2xl flex flex-col justify-between transform transition-transform duration-200 ease-out md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="pt-5 pb-4 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-[#191D32] p-1 flex items-center justify-center shrink-0">
                <Image
                  src="/logo-mafrend.png"
                  alt="Mafrend.Studio"
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain"
                />
              </span>
              <span className="text-base font-bold tracking-tight text-[var(--ink-primary)]">
                Mafrend.Studio
              </span>
            </div>

            <button
              type="button"
              onClick={closeMobile}
              className="w-11 h-11 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--ink-primary)] flex items-center justify-center"
              aria-label="Tutup menu navigasi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="mt-2 px-3 flex flex-col gap-1.5">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/order' && pathname?.startsWith(item.href)) ||
                (item.href === '/order' && (pathname === '/' || pathname === '/order'));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className={`px-3.5 min-h-[44px] rounded-xl flex items-center gap-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]'
                      : 'text-[var(--ink-secondary)] hover:bg-[var(--bg-row)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile Bottom Utility Dock */}
        <div className="p-3 pb-5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              closeMobile();
              toggleCalculator();
            }}
            className={`flex-1 min-h-[44px] px-3.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-colors ${
              isCalcOpen
                ? 'bg-[#4638F5] text-[#FFFFFF]'
                : 'bg-[var(--bg-subtle)] text-[var(--ink-primary)]'
            }`}
          >
            <Calculator className="w-4 h-4 shrink-0" />
            <span>Kalkulator</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            className="w-11 h-11 shrink-0 rounded-xl bg-[var(--bg-subtle)] text-[var(--ink-primary)] flex items-center justify-center"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="sr-only">
              {isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
