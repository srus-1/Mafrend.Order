'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  UploadCloud,
  FileImage,
  AlertCircle,
  Eye,
  Download,
  Trash2,
  Check,
} from 'lucide-react';
import { useOrders } from '@/context/OrderContext';

export default function OrderDesignDrawer() {
  const {
    activeDrawerOrder,
    setActiveDrawerOrder,
    uploadDesignFile,
    toggleDesignReady,
    deleteDesignFile,
    setLightboxFile,
  } = useOrders();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    if (!activeDrawerOrder) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDrawerOrder(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeDrawerOrder, setActiveDrawerOrder]);

  if (!activeDrawerOrder) return null;

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      void uploadDesignFile(activeDrawerOrder.id, file);
    });
  };

  const files = activeDrawerOrder.designFiles || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="design-drawer-title"
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4 bg-black/55 overscroll-contain"
    >
      <div
        className="fixed inset-0"
        onClick={() => setActiveDrawerOrder(null)}
        aria-hidden="true"
      />

      <aside className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] bg-[var(--bg-surface)] text-[var(--ink-primary)] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.3)] flex flex-col z-10 animate-fade-in-up">
        {/* Clean Header (Zero Sub-Headline) */}
        <div className="px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-[#4638F5] text-[#FFFFFF] text-xs font-bold tabular-nums">
              #{activeDrawerOrder.orderNumber}
            </span>
            <h1 id="design-drawer-title" className="text-base font-bold text-[var(--ink-primary)]">
              Galeri Desain
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setActiveDrawerOrder(null)}
            className="w-9 h-9 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--ink-primary)] flex items-center justify-center"
            aria-label="Tutup galeri desain"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5 flex flex-col gap-4">
          {/* Tonal Upload Dropzone (Zero Border) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileUpload(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-2xl p-5 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'bg-[#4638F5] text-[#FFFFFF]'
                : 'bg-[var(--bg-row)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".cdr,.ai,.psd,.pdf,.png,.jpg,.jpeg,.svg"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <div className="w-10 h-10 mx-auto rounded-xl bg-[var(--bg-chip-on-row)] text-[#4638F5] flex items-center justify-center mb-2">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold">Unggah Berkas Desain</p>
            <p className="text-[11px] opacity-80 mt-0.5">
              CDR, AI, PSD, PDF, PNG, JPG (maks. 50MB)
            </p>
          </div>

          {/* Separated File Cards */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink-muted)]">
              <span>Berkas ({files.length})</span>
              <span>{files.filter((f) => f.isReadyToPrint).length} siap cetak</span>
            </div>

            {files.length === 0 ? (
              <div className="p-6 text-center bg-[var(--bg-row)] rounded-xl">
                <FileImage className="w-6 h-6 text-[var(--ink-muted)] mx-auto mb-1.5" />
                <p className="text-xs text-[var(--ink-muted)]">Belum ada berkas desain.</p>
              </div>
            ) : (
              files.map((file) => {
                const isImage = ['PNG', 'JPG', 'JPEG', 'WEBP'].includes(
                  file.fileType.toUpperCase()
                );

                return (
                  <div
                    key={file.id}
                    className="p-3.5 bg-[var(--bg-row)] rounded-xl flex flex-col gap-2.5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[var(--bg-chip-on-row)] overflow-hidden flex items-center justify-center shrink-0">
                        {isImage && file.fileUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={file.fileUrl}
                            alt={file.fileName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-[var(--ink-primary)] uppercase">
                            {file.fileType}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div
                          className="text-xs font-bold text-[var(--ink-primary)] truncate"
                          title={file.fileName}
                        >
                          {file.fileName}
                        </div>
                        <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 tabular-nums">
                          {(file.fileSize / (1024 * 1024)).toFixed(2)} MB • {file.fileType}
                        </p>

                        <button
                          type="button"
                          onClick={() => toggleDesignReady(activeDrawerOrder.id, file.id)}
                          className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                            file.isReadyToPrint
                              ? 'bg-[#6EEB9A] text-[#14161D]'
                              : 'bg-[#F9DC7E] text-[#14161D]'
                          }`}
                        >
                          {file.isReadyToPrint ? (
                            <>
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>Siap Cetak</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 stroke-[2.5]" />
                              <span>Perlu Setting</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setLightboxFile(file)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-semibold text-[var(--ink-primary)] bg-[var(--bg-chip-on-row)] hover:bg-[var(--bg-hover)] rounded-lg"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspeksi</span>
                        </button>

                        <a
                          href={file.fileUrl}
                          download={file.fileName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-semibold text-[var(--ink-primary)] bg-[var(--bg-chip-on-row)] hover:bg-[var(--bg-hover)] rounded-lg"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh</span>
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus berkas ${file.fileName}?`)) {
                            deleteDesignFile(activeDrawerOrder.id, file.id);
                          }
                        }}
                        className="w-9 h-9 rounded-lg bg-[var(--bg-chip-on-row)] hover:bg-[var(--bg-danger-soft)] text-[var(--ink-danger)] flex items-center justify-center"
                        aria-label="Hapus berkas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="px-5 py-3.5 bg-[var(--bg-row)] flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={() => setActiveDrawerOrder(null)}
            className="min-h-[38px] px-4 py-2 bg-[var(--cta-bg)] hover:bg-[var(--cta-hover)] text-[var(--cta-text)] text-xs font-semibold rounded-xl"
          >
            Tutup
          </button>
        </div>
      </aside>
    </div>
  );
}
