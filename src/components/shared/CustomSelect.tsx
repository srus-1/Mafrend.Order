'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  badgeClass?: string;
}

export interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  ariaLabel?: string;
  placeholder?: string;
  leadingIcon?: React.ReactNode;
  triggerClassName?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
  direction?: 'down' | 'up';
  size?: 'pill' | 'field';
  disabled?: boolean;
}

export default function CustomSelect({
  id,
  value,
  onChange,
  options,
  ariaLabel,
  placeholder = 'Pilih...',
  leadingIcon,
  triggerClassName = '',
  menuClassName = '',
  align = 'left',
  direction = 'down',
  size = 'field',
  disabled = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const autoId = useId();
  const listboxId = `${id || autoId}-listbox`;

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
        triggerRef.current?.focus();
        return;
      }
      if (options.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = prev < options.length - 1 ? prev + 1 : 0;
          optionRefs.current[next]?.focus();
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = prev > 0 ? prev - 1 : options.length - 1;
          optionRefs.current[next]?.focus();
          return next;
        });
      } else if (e.key === 'Home') {
        e.preventDefault();
        setActiveIndex(0);
        optionRefs.current[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        const last = options.length - 1;
        setActiveIndex(last);
        optionRefs.current[last]?.focus();
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, options.length]);

  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const toggleOpen = () => {
    if (disabled) return;
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
      }
      return next;
    });
  };

  const baseTrigger =
    size === 'pill'
      ? 'inline-flex items-center justify-between gap-1.5 pl-3 pr-2.5 py-1.5 min-h-[32px] rounded-full text-[11px] font-bold transition-all active:scale-[0.98] select-none cursor-pointer'
      : 'inline-flex items-center justify-between gap-2 px-3 py-2 min-h-[38px] rounded-xl text-xs font-semibold transition-all active:scale-[0.99] select-none cursor-pointer';

  const alignClass = align === 'right' ? 'right-0' : 'left-0';
  const directionClass = direction === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5';

  return (
    <div ref={containerRef} className={`relative ${size === 'field' ? 'w-full' : 'inline-flex'}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          toggleOpen();
        }}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            toggleOpen();
          }
        }}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        className={`${baseTrigger} ${size === 'field' ? 'w-full' : ''} ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        } ${triggerClassName}`}
      >
        <span className="inline-flex items-center gap-2 min-w-0 truncate">
          {leadingIcon && <span className="shrink-0 flex items-center">{leadingIcon}</span>}
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown
          className={`shrink-0 transition-transform duration-150 ${
            size === 'pill' ? 'w-3 h-3' : 'w-3.5 h-3.5 opacity-75'
          } ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute ${alignClass} ${directionClass} min-w-full w-max max-w-[260px] max-h-60 overflow-y-auto rounded-xl bg-[var(--bg-surface-elevated)] p-1.5 shadow-[0_14px_34px_rgba(0,0,0,0.18)] z-50 flex flex-col gap-0.5 text-left ${menuClassName}`}
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isHighlighted = idx === activeIndex;
            return (
              <button
                key={opt.value}
                ref={(el) => {
                  optionRefs.current[idx] = el;
                }}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  if (opt.value !== value) {
                    onChange(opt.value);
                  }
                  triggerRef.current?.focus();
                }}
                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors min-h-[34px] flex items-center justify-between gap-2.5 ${
                  isSelected || isHighlighted
                    ? 'bg-[var(--bg-row)] text-[var(--ink-primary)]'
                    : 'text-[var(--ink-primary)] hover:bg-[var(--bg-row)]'
                }`}
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  {opt.badgeClass && (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${opt.badgeClass}`} />
                  )}
                  <span className="truncate">{opt.label}</span>
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-[#4638F5]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
