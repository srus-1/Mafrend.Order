'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  useCalculator,
  formatCalculatorDisplay,
  CalcOperator,
} from '@/context/CalculatorContext';
import { Maximize2, X, Copy, Check } from 'lucide-react';

export default function FloatingCalculator() {
  const {
    isOpen,
    isMinimized,
    position,
    display,
    expression,
    activeOperator,
    closeCalculator,
    toggleMinimize,
    setPosition,
    inputDigit,
    inputDecimal,
    clearAll,
    toggleSign,
    inputPercent,
    performOperation,
    evaluateResult,
    backspace,
  } = useCalculator();

  const panelRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Keyboard numpad support when calculator is open and user is not typing inside a form control
  useEffect(() => {
    if (!isOpen || isMinimized) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        if (
          tag === 'input' ||
          tag === 'textarea' ||
          tag === 'select' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      if (e.altKey || e.ctrlKey || e.metaKey) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        inputDigit(e.key);
      } else if (e.key === '.' || e.key === ',') {
        e.preventDefault();
        inputDecimal();
      } else if (e.key === '+') {
        e.preventDefault();
        performOperation('+');
      } else if (e.key === '-') {
        e.preventDefault();
        performOperation('-');
      } else if (e.key === '*') {
        e.preventDefault();
        performOperation('*');
      } else if (e.key === '/') {
        e.preventDefault();
        performOperation('/');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        evaluateResult();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        backspace();
      } else if (e.key === '%') {
        e.preventDefault();
        inputPercent();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        clearAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    isMinimized,
    inputDigit,
    inputDecimal,
    performOperation,
    evaluateResult,
    backspace,
    inputPercent,
    clearAll,
  ]);

  if (!isOpen) return null;

  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const panel = panelRef.current;
    if (!panel) return;

    e.preventDefault();
    const rect = panel.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setIsDragging(true);

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const maxX = Math.max(12, window.innerWidth - rect.width - 12);
      const maxY = Math.max(12, window.innerHeight - rect.height - 12);
      const nextX = Math.min(Math.max(12, moveEvt.clientX - offsetX), maxX);
      const nextY = Math.min(Math.max(12, moveEvt.clientY - offsetY), maxY);
      setPosition({ x: Math.round(nextX), y: Math.round(nextY) });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleCopyValue = async () => {
    const cleanNum = display === 'Error' ? '0' : String(Math.round(parseFloat(display) * 100) / 100);
    try {
      await navigator.clipboard?.writeText(cleanNum);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore clipboard failure
    }
  };

  const formattedDisplay = formatCalculatorDisplay(display);
  const displaySizeClass =
    formattedDisplay.length > 11
      ? 'text-2xl'
      : formattedDisplay.length > 8
      ? 'text-3xl'
      : 'text-4xl';

  const positionStyle: React.CSSProperties = position
    ? { left: position.x, top: position.y }
    : { right: 24, bottom: 24 };

  const renderOpBtn = (label: string, op: CalcOperator, ariaLabel: string) => {
    const isActive = activeOperator === op;
    return (
      <button
        type="button"
        onClick={() => performOperation(op)}
        aria-label={ariaLabel}
        className={`h-13 rounded-full text-xl font-semibold flex items-center justify-center transition-transform active:scale-95 select-none ${
          isActive
            ? 'bg-[#FFFFFF] text-[#C97800]'
            : 'bg-[#FF9F0A] hover:bg-[#FFB340] text-[#0A0A0A]'
        }`}
      >
        {label}
      </button>
    );
  };

  if (isMinimized) {
    return (
      <div
        ref={panelRef}
        style={positionStyle}
        className="fixed z-50 w-56 rounded-2xl bg-[#1C1C1E] text-[#FFFFFF] shadow-[0_20px_48px_rgba(0,0,0,0.45)] select-none"
      >
        <div
          onPointerDown={handleHeaderPointerDown}
          className={`px-3.5 py-2.5 flex items-center justify-between gap-2 ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-medium text-[#A5A5A5] uppercase tracking-wider">
              Kalkulator
            </div>
            <div className="text-sm font-bold text-[#FFFFFF] tabular-nums truncate">
              {formattedDisplay}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleMinimize}
              aria-label="Perbesar kalkulator"
              title="Perbesar kalkulator"
              className="w-7 h-7 rounded-full bg-[#333333] hover:bg-[#48484A] text-[#FFFFFF] flex items-center justify-center"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={closeCalculator}
              aria-label="Tutup kalkulator"
              title="Tutup kalkulator"
              className="w-7 h-7 rounded-full bg-[#333333] hover:bg-[#FF453A] text-[#FFFFFF] flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside
      ref={panelRef}
      aria-label="Kalkulator Mafrend.Studio"
      style={positionStyle}
      className="fixed z-50 w-[276px] rounded-[28px] bg-[#1C1C1E] text-[#FFFFFF] shadow-[0_24px_60px_rgba(0,0,0,0.5)] overflow-hidden select-none"
    >
      {/* Draggable Top Bar with macOS Traffic-Light Dots (FigCraft Reference) */}
      <div
        onPointerDown={handleHeaderPointerDown}
        className={`px-4 pt-3.5 pb-1 flex items-center justify-between ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={closeCalculator}
            aria-label="Tutup kalkulator"
            title="Tutup kalkulator (Alt+K)"
            className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] hover:brightness-110 flex items-center justify-center transition-all"
          />
          <button
            type="button"
            onClick={toggleMinimize}
            aria-label="Kecilkan kalkulator"
            title="Kecilkan kalkulator"
            className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] hover:brightness-110 flex items-center justify-center transition-all"
          />
          <button
            type="button"
            onClick={clearAll}
            aria-label="Reset kalkulator"
            title="Reset angka"
            className="w-3.5 h-3.5 rounded-full bg-[#27C93F] hover:brightness-110 flex items-center justify-center transition-all"
          />
        </div>

        <span className="text-[11px] font-semibold text-[#A5A5A5] tracking-wide">
          Kalkulator
        </span>

        <button
          type="button"
          onClick={handleCopyValue}
          aria-label="Salin hasil kalkulator"
          title="Salin angka ke clipboard"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#333333] hover:bg-[#48484A] text-[11px] font-semibold text-[#FFFFFF] transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#6EEB9A]" />
              <span>Tersalin</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Salin</span>
            </>
          )}
        </button>
      </div>

      {/* Apple Display Readout */}
      <div className="px-5 pt-2.5 pb-2.5 text-right flex flex-col justify-end min-h-[84px]">
        <div className="text-xs font-medium text-[#A5A5A5] tabular-nums min-h-[18px] truncate">
          {expression || '\u00A0'}
        </div>
        <output
          aria-live="polite"
          data-testid="calculator-display"
          className={`${displaySizeClass} font-light tracking-tight text-[#FFFFFF] tabular-nums leading-tight truncate mt-0.5`}
        >
          {formattedDisplay}
        </output>
      </div>
      <div className="px-5 pb-2.5 text-[11px] font-medium text-[#FF9F0A]">
        Tetap terbuka saat pindah halaman
      </div>

      {/* Apple 4x5 Circular Keypad */}
      <div className="px-4 pb-4 grid grid-cols-4 gap-2.5">
        {/* Row 1: Utility (#A5A5A5 + #0A0A0A => 8.53:1) + Divide */}
        <button
          type="button"
          onClick={clearAll}
          className="h-13 rounded-full bg-[#A5A5A5] hover:bg-[#BDBDBD] text-[#0A0A0A] text-base font-semibold flex items-center justify-center transition-transform active:scale-95"
        >
          {display === '0' && !expression ? 'AC' : 'C'}
        </button>
        <button
          type="button"
          onClick={toggleSign}
          aria-label="Ubah tanda positif negatif"
          className="h-13 rounded-full bg-[#A5A5A5] hover:bg-[#BDBDBD] text-[#0A0A0A] text-base font-semibold flex items-center justify-center transition-transform active:scale-95"
        >
          +/-
        </button>
        <button
          type="button"
          onClick={inputPercent}
          aria-label="Persen"
          className="h-13 rounded-full bg-[#A5A5A5] hover:bg-[#BDBDBD] text-[#0A0A0A] text-base font-semibold flex items-center justify-center transition-transform active:scale-95"
        >
          %
        </button>
        {renderOpBtn('÷', '/', 'Bagi')}

        {/* Row 2: 7 8 9 × */}
        {['7', '8', '9'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => inputDigit(d)}
            className="h-13 rounded-full bg-[#333333] hover:bg-[#48484A] text-[#FFFFFF] text-xl font-medium flex items-center justify-center transition-transform active:scale-95 tabular-nums"
          >
            {d}
          </button>
        ))}
        {renderOpBtn('×', '*', 'Kali')}

        {/* Row 3: 4 5 6 − */}
        {['4', '5', '6'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => inputDigit(d)}
            className="h-13 rounded-full bg-[#333333] hover:bg-[#48484A] text-[#FFFFFF] text-xl font-medium flex items-center justify-center transition-transform active:scale-95 tabular-nums"
          >
            {d}
          </button>
        ))}
        {renderOpBtn('−', '-', 'Kurang')}

        {/* Row 4: 1 2 3 + */}
        {['1', '2', '3'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => inputDigit(d)}
            className="h-13 rounded-full bg-[#333333] hover:bg-[#48484A] text-[#FFFFFF] text-xl font-medium flex items-center justify-center transition-transform active:scale-95 tabular-nums"
          >
            {d}
          </button>
        ))}
        {renderOpBtn('+', '+', 'Tambah')}

        {/* Row 5: Wide 0, Decimal, Equals */}
        <button
          type="button"
          onClick={() => inputDigit('0')}
          className="col-span-2 h-13 rounded-full bg-[#333333] hover:bg-[#48484A] text-[#FFFFFF] text-xl font-medium flex items-center justify-start pl-6 transition-transform active:scale-95 tabular-nums"
        >
          0
        </button>
        <button
          type="button"
          onClick={inputDecimal}
          aria-label="Koma desimal"
          className="h-13 rounded-full bg-[#333333] hover:bg-[#48484A] text-[#FFFFFF] text-xl font-medium flex items-center justify-center transition-transform active:scale-95"
        >
          ,
        </button>
        <button
          type="button"
          onClick={evaluateResult}
          aria-label="Sama dengan"
          className="h-13 rounded-full bg-[#FF9F0A] hover:bg-[#FFB340] text-[#0A0A0A] text-xl font-semibold flex items-center justify-center transition-transform active:scale-95"
        >
          =
        </button>
      </div>
    </aside>
  );
}
