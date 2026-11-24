'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
}

export interface ActionMenuDropdownProps {
  items: ActionMenuItem[];
  ariaLabel?: string;
  triggerSurface?: 'on-row' | 'on-surface';
}

/**
 * Unified Three-Dots ("⋯") Action Dropdown across all Mafrend.Studio dashboards.
 * Pure text trigger ("⋯") and text-only menu items without icons, zero borders.
 */
export default function ActionMenuDropdown({
  items,
  ariaLabel = 'Menu aksi baris',
  triggerSurface = 'on-row',
}: ActionMenuDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const triggerClass =
    triggerSurface === 'on-row'
      ? 'bg-[var(--bg-chip-on-row)] hover:bg-[var(--bg-hover)] text-[var(--ink-primary)]'
      : 'bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--ink-primary)]';

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`min-w-[36px] min-h-[36px] px-2.5 rounded-lg text-sm font-bold tracking-widest flex items-center justify-center transition-all active:scale-95 select-none ${triggerClass}`}
      >
        ⋯
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 min-w-[148px] rounded-xl bg-[var(--bg-surface-elevated)] p-1.5 shadow-[0_14px_34px_rgba(0,0,0,0.18)] z-40 flex flex-col gap-0.5 text-left"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onClick();
              }}
              className={`w-full px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors min-h-[36px] flex items-center ${
                item.tone === 'danger'
                  ? 'text-[var(--ink-danger)] hover:bg-[var(--bg-danger-soft)]'
                  : 'text-[var(--ink-primary)] hover:bg-[var(--bg-row)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
