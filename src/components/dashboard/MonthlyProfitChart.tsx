'use client';

import React, { useState } from 'react';
import { MonthlyProfitData } from '@/types/order';
import { formatRp } from '@/lib/utils';

interface MonthlyProfitChartProps {
  data: MonthlyProfitData[];
}

export default function MonthlyProfitChart({ data }: MonthlyProfitChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-[var(--bg-surface)] rounded-2xl p-6 flex items-center justify-center text-[var(--ink-muted)] text-xs font-medium">
        Belum ada data bulanan.
      </div>
    );
  }

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.omzet, d.profit, 1000000)),
    5000000
  );
  const roundedMax = Math.ceil(maxVal / 5000000) * 5000000;

  const chartWidth = 680;
  const chartHeight = 220;
  const paddingLeft = 58;
  const paddingRight = 24;
  const paddingTop = 18;
  const paddingBottom = 34;

  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  const barGroupWidth = usableWidth / data.length;
  const singleBarWidth = Math.min(22, (barGroupWidth - 18) / 2);

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const activeItem = hoveredIdx !== null ? data[hoveredIdx] : data[data.length - 1];

  return (
    <div className="w-full bg-[var(--bg-surface)] shadow-[var(--shadow-card)] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-[var(--ink-primary)] truncate">
          Tren Omzet & Laba
        </h2>

        <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-semibold shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#4638F5]" />
            <span className="text-[var(--ink-secondary)]">Omzet</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[var(--chart-profit-bar)]" />
            <span className="text-[var(--ink-secondary)]">Laba</span>
          </div>
        </div>
      </div>

      {activeItem && (
        <div className="px-3 sm:px-3.5 py-2 rounded-xl bg-[var(--bg-row)] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
            <span className="px-2 py-0.5 rounded-md bg-[#4638F5] text-[#FFFFFF] font-bold text-[10px] sm:text-[11px] shrink-0">
              {activeItem.monthLabel}
            </span>
            <span className="sm:hidden px-2 py-0.5 rounded-md bg-[#6EEB9A] text-[#14161D] font-bold text-[10px] tabular-nums shrink-0">
              Margin {activeItem.marginPct}%
            </span>
            <span className="hidden sm:inline text-[var(--ink-secondary)] tabular-nums">
              Omzet: <strong className="text-[var(--ink-primary)]">{formatRp(activeItem.omzet)}</strong>
            </span>
            <span className="hidden sm:inline text-[var(--ink-secondary)] tabular-nums">
              Laba: <strong className="text-[var(--ink-profit)]">{formatRp(activeItem.profit)}</strong>
            </span>
          </div>

          <div className="flex sm:hidden items-center justify-between gap-2 tabular-nums">
            <span className="text-[var(--ink-secondary)]">
              Omzet <strong className="text-[var(--ink-primary)]">{formatRp(activeItem.omzet)}</strong>
            </span>
            <span className="text-[var(--ink-secondary)]">
              Laba <strong className="text-[var(--ink-profit)]">{formatRp(activeItem.profit)}</strong>
            </span>
          </div>

          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-[#6EEB9A] text-[#14161D] font-bold text-[11px] tabular-nums shrink-0">
            Margin {activeItem.marginPct}%
          </span>
        </div>
      )}

      {/* Responsive SVG Bar Chart */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[500px] select-none"
        >
          {yTicks.map((pct) => {
            const y = paddingTop + usableHeight * (1 - pct);
            const val = roundedMax * pct;
            const formatted = val >= 1000000 ? `${(val / 1000000).toFixed(0)} jt` : '0';

            return (
              <g key={pct}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="var(--chart-grid)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="var(--ink-muted)"
                  fontSize="11"
                  fontWeight="500"
                >
                  {formatted}
                </text>
              </g>
            );
          })}

          {data.map((item, idx) => {
            const groupCenterX = paddingLeft + idx * barGroupWidth + barGroupWidth / 2;
            const omzetHeight = Math.max(4, (item.omzet / roundedMax) * usableHeight);
            const profitHeight = Math.max(4, (item.profit / roundedMax) * usableHeight);

            const omzetY = paddingTop + usableHeight - omzetHeight;
            const profitY = paddingTop + usableHeight - profitHeight;

            const omzetX = groupCenterX - singleBarWidth - 2;
            const profitX = groupCenterX + 2;
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={item.month}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setHoveredIdx(hoveredIdx === idx ? null : idx)}
                className="cursor-pointer"
              >
                {isHovered && (
                  <rect
                    x={paddingLeft + idx * barGroupWidth + 4}
                    y={paddingTop}
                    width={barGroupWidth - 8}
                    height={usableHeight}
                    fill="var(--bg-row)"
                    rx="8"
                  />
                )}

                <rect
                  x={omzetX}
                  y={omzetY}
                  width={singleBarWidth}
                  height={omzetHeight}
                  fill="#4638F5"
                  rx="4"
                  className="animate-bar-grow"
                  opacity={isHovered ? 1 : 0.92}
                />

                <rect
                  x={profitX}
                  y={profitY}
                  width={singleBarWidth}
                  height={profitHeight}
                  fill="var(--chart-profit-bar)"
                  rx="4"
                  className="animate-bar-grow"
                  opacity={isHovered ? 1 : 0.92}
                />

                <text
                  x={groupCenterX}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  fill={isHovered ? 'var(--ink-primary)' : 'var(--ink-muted)'}
                  fontWeight={isHovered ? '700' : '500'}
                  fontSize="11"
                >
                  {item.monthLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
