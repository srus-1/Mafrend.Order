'use client';

import React from 'react';
import { Inbox } from 'lucide-react';
import { CapexEntry, RawMaterialEntry } from '@/types/capex';
import { formatRp, formatDateShort, formatMonthLabel } from '@/lib/utils';
import {
  exportCapexToCSV,
  exportRawMaterialsToCSV,
  downloadCSVFile,
  exportCapexToPDF,
  exportRawMaterialsToPDF,
} from '@/lib/csvExport';
import {
  downloadCapexExcelXlsx,
  downloadRawMaterialsExcelXlsx,
} from '@/lib/excelExport';
import ExportMenuButton from '@/components/shared/ExportMenuButton';
import ActionMenuDropdown from '@/components/shared/ActionMenuDropdown';

export interface CapexSpendingSectionsProps {
  activeTab: 'ALL' | 'CAPEX' | 'RAW_MATERIAL';
  selectedMonth: string;
  filteredCapex: CapexEntry[];
  filteredMaterials: RawMaterialEntry[];
  totalCapexAmount: number;
  totalMaterialsAmount: number;
  onEditCapex: (item: CapexEntry) => void;
  onEditMaterial: (item: RawMaterialEntry) => void;
  onRequestDelete: (target: { type: 'capex' | 'material'; id: string; title: string }) => void;
  onNoticeError: (message: string) => void;
}

export default function CapexSpendingSections({
  activeTab,
  selectedMonth,
  filteredCapex,
  filteredMaterials,
  totalCapexAmount,
  totalMaterialsAmount,
  onEditCapex,
  onEditMaterial,
  onRequestDelete,
  onNoticeError,
}: CapexSpendingSectionsProps) {
  return (
    <>
      {(activeTab === 'ALL' || activeTab === 'CAPEX') && (
        <div className="bg-[var(--bg-surface)] shadow-[var(--shadow-card)] rounded-2xl p-3.5 sm:p-5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[var(--ink-primary)]">
                Belanja Modal (Capex)
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-[#8EA6FF] text-[#14161D] text-[10px] font-bold">
                {filteredCapex.length} item
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--ink-primary)] tabular-nums">
                {formatRp(totalCapexAmount)}
              </span>
              <ExportMenuButton
                iconOnlyMobile
                label="Unduh Laporan"
                ariaLabel="Unduh CSV, Excel, atau PDF capex"
                variant="light-neutral"
                onExportExcel={() => {
                  void downloadCapexExcelXlsx(
                    filteredCapex,
                    formatMonthLabel(selectedMonth),
                    `mafrend-studio-capex-${selectedMonth || 'all'}.xlsx`,
                    onNoticeError
                  );
                }}
                onExportPDF={() => {
                  exportCapexToPDF(filteredCapex, formatMonthLabel(selectedMonth));
                }}
                onExportCSV={() => {
                  const csvContent = exportCapexToCSV(filteredCapex);
                  downloadCSVFile(
                    `mafrend-studio-capex-ml-${selectedMonth || 'all'}.csv`,
                    csvContent
                  );
                }}
              />
            </div>
          </div>

          {filteredCapex.length === 0 ? (
            <div className="py-10 px-6 bg-[var(--bg-row)] rounded-xl flex flex-col items-center justify-center text-center">
              <Inbox className="w-6 h-6 text-[var(--ink-muted)] mb-2" />
              <p className="text-xs font-medium text-[var(--ink-muted)]">
                Belum ada belanja modal pada periode ini.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-3.5 text-[11px] font-semibold text-[var(--ink-muted)]">
                <span className="col-span-4">Aset & Kategori</span>
                <span className="col-span-2">Tanggal</span>
                <span className="col-span-3">Keterangan</span>
                <span className="col-span-3 text-right">Biaya & Aksi</span>
              </div>

              {filteredCapex.map((item) => {
                const actionItems = [
                  { label: 'Edit', onClick: () => onEditCapex(item) },
                  {
                    label: 'Hapus',
                    tone: 'danger' as const,
                    onClick: () =>
                      onRequestDelete({
                        type: 'capex',
                        id: item.id,
                        title: item.itemName,
                      }),
                  },
                ];

                return (
                  <div
                    key={item.id}
                    className="p-3 sm:p-3.5 rounded-xl bg-[var(--bg-row)] hover:bg-[var(--bg-hover)]/70 transition-colors grid grid-cols-1 lg:grid-cols-12 lg:items-center gap-1.5 lg:gap-3"
                  >
                    <div className="lg:col-span-4 flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-[var(--ink-primary)] truncate">
                          {item.itemName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#8EA6FF] text-[#14161D] text-[10px] font-bold shrink-0">
                          {item.category}
                        </span>
                      </div>

                      <div className="lg:hidden shrink-0">
                        <ActionMenuDropdown
                          ariaLabel={`Menu aksi ${item.itemName}`}
                          items={actionItems}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 lg:contents">
                      <div className="lg:hidden min-w-0 flex-1 text-[11px] text-[var(--ink-muted)] truncate">
                        <span className="tabular-nums">{formatDateShort(item.entryDate)}</span>
                        {item.description && <span> · {item.description}</span>}
                      </div>

                      <div className="hidden lg:block lg:col-span-2 text-[11px] font-medium text-[var(--ink-muted)] tabular-nums">
                        {formatDateShort(item.entryDate)}
                      </div>

                      <div className="hidden lg:block lg:col-span-3 text-xs text-[var(--ink-secondary)] line-clamp-1">
                        {item.description || '-'}
                      </div>

                      <div className="lg:col-span-3 flex items-center justify-end gap-3 shrink-0">
                        <span className="text-xs sm:text-sm font-bold text-[var(--ink-primary)] tabular-nums whitespace-nowrap">
                          {formatRp(item.amount)}
                        </span>

                        <div className="hidden lg:block shrink-0">
                          <ActionMenuDropdown
                            ariaLabel={`Menu aksi ${item.itemName}`}
                            items={actionItems}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {(activeTab === 'ALL' || activeTab === 'RAW_MATERIAL') && (
        <div className="bg-[var(--bg-surface)] shadow-[var(--shadow-card)] rounded-2xl p-3.5 sm:p-5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[var(--ink-primary)]">
                Bahan Baku Berulang
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-[#F9DC7E] text-[#14161D] text-[10px] font-bold">
                {filteredMaterials.length} item
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--ink-primary)] tabular-nums">
                {formatRp(totalMaterialsAmount)}
              </span>
              <ExportMenuButton
                iconOnlyMobile
                label="Unduh Laporan"
                ariaLabel="Unduh CSV, Excel, atau PDF bahan baku"
                variant="light-neutral"
                onExportExcel={() => {
                  void downloadRawMaterialsExcelXlsx(
                    filteredMaterials,
                    formatMonthLabel(selectedMonth),
                    `mafrend-studio-bahan-baku-${selectedMonth || 'all'}.xlsx`,
                    onNoticeError
                  );
                }}
                onExportPDF={() => {
                  exportRawMaterialsToPDF(
                    filteredMaterials,
                    formatMonthLabel(selectedMonth)
                  );
                }}
                onExportCSV={() => {
                  const csvContent = exportRawMaterialsToCSV(filteredMaterials);
                  downloadCSVFile(
                    `mafrend-studio-raw-materials-ml-${selectedMonth || 'all'}.csv`,
                    csvContent
                  );
                }}
              />
            </div>
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="py-10 px-6 bg-[var(--bg-row)] rounded-xl flex flex-col items-center justify-center text-center">
              <Inbox className="w-6 h-6 text-[var(--ink-muted)] mb-2" />
              <p className="text-xs font-medium text-[var(--ink-muted)]">
                Belum ada belanja bahan baku pada periode ini.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-3.5 text-[11px] font-semibold text-[var(--ink-muted)]">
                <span className="col-span-4">Bahan & Kategori</span>
                <span className="col-span-3">Supplier & Tanggal</span>
                <span className="col-span-2">Volume & Harga</span>
                <span className="col-span-3 text-right">Total & Aksi</span>
              </div>

              {filteredMaterials.map((item) => {
                const actionItems = [
                  { label: 'Edit', onClick: () => onEditMaterial(item) },
                  {
                    label: 'Hapus',
                    tone: 'danger' as const,
                    onClick: () =>
                      onRequestDelete({
                        type: 'material',
                        id: item.id,
                        title: item.materialName,
                      }),
                  },
                ];

                return (
                  <div
                    key={item.id}
                    className="p-3 sm:p-3.5 rounded-xl bg-[var(--bg-row)] hover:bg-[var(--bg-hover)]/70 transition-colors grid grid-cols-1 lg:grid-cols-12 lg:items-center gap-1.5 lg:gap-3"
                  >
                    <div className="lg:col-span-4 flex items-start justify-between gap-2 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-[var(--ink-primary)] truncate">
                            {item.materialName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#F9DC7E] text-[#14161D] text-[10px] font-bold shrink-0">
                            {item.category}
                          </span>
                        </div>
                        <div className="lg:hidden text-[11px] text-[var(--ink-muted)] truncate mt-0.5">
                          {item.supplier ? `${item.supplier} · ` : ''}
                          <span className="tabular-nums">{formatDateShort(item.entryDate)}</span>
                        </div>
                        {item.notes && (
                          <div className="hidden lg:block text-[11px] text-[var(--ink-muted)] truncate mt-0.5">
                            {item.notes}
                          </div>
                        )}
                      </div>

                      <div className="lg:hidden shrink-0">
                        <ActionMenuDropdown
                          ariaLabel={`Menu aksi ${item.materialName}`}
                          items={actionItems}
                        />
                      </div>
                    </div>

                    <div className="hidden lg:block lg:col-span-3 min-w-0 text-[11px] text-[var(--ink-secondary)]">
                      <div className="font-semibold text-[var(--ink-primary)] truncate">
                        {item.supplier || '-'}
                      </div>
                      <div className="text-[var(--ink-muted)] tabular-nums mt-0.5">
                        {formatDateShort(item.entryDate)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-0.5 lg:pt-0 lg:contents">
                      <div className="lg:col-span-2 flex items-center">
                        <span className="px-2 sm:px-2.5 py-1 rounded-lg bg-[var(--bg-chip-on-row)] text-[10px] sm:text-[11px] font-bold text-[var(--ink-primary)] tabular-nums whitespace-nowrap">
                          {item.quantity} {item.unit} @ {formatRp(item.unitPrice)}
                        </span>
                      </div>

                      <div className="lg:col-span-3 flex items-center justify-end gap-3 shrink-0">
                        <span className="text-xs sm:text-sm font-bold text-[var(--ink-primary)] tabular-nums text-right whitespace-nowrap">
                          {formatRp(item.totalAmount)}
                        </span>

                        <div className="hidden lg:block shrink-0">
                          <ActionMenuDropdown
                            ariaLabel={`Menu aksi ${item.materialName}`}
                            items={actionItems}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
