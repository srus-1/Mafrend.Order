'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  FileText,
} from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import { DesignFile } from '@/types/order';

interface LightboxContentProps {
  file: DesignFile;
  onClose: () => void;
}

function LightboxContent({ file, onClose }: LightboxContentProps) {
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const isImage = ['PNG', 'JPG', 'JPEG', 'WEBP', 'SVG'].includes(
    file.fileType.toUpperCase()
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pratinjau ${file.fileName}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md overscroll-contain"
    >
      {/* Top Bar */}
      <div className="absolute top-0 inset-x-0 p-4 md:px-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent text-white z-10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-[#4638F5] text-white shrink-0">
            {file.fileType}
          </span>
          <h2 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
            {file.fileName}
          </h2>
          <span
            className={`hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
              file.isReadyToPrint
                ? 'bg-[#6EEB9A] text-[#14161D]'
                : 'bg-[#F9DC7E] text-[#14161D]'
            }`}
          >
            {file.isReadyToPrint ? 'Siap Cetak' : 'Perlu Setting'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={file.fileUrl}
            download={file.fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-[#4638F5] hover:bg-[#3B2EE0] text-white text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Unduh</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white"
            aria-label="Tutup pratinjau"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="relative w-full h-full flex items-center justify-center p-8 overflow-hidden">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.fileUrl}
            alt={file.fileName}
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: 'transform 0.15s ease-out',
            }}
            className="max-h-[80vh] max-w-[85vw] object-contain rounded-xl shadow-2xl select-none"
          />
        ) : (
          <div
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: 'transform 0.15s ease-out',
            }}
            className="p-8 rounded-2xl bg-[#151822] text-center max-w-md flex flex-col items-center justify-center shadow-2xl select-none"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#272D3F] text-[#8EA6FF] flex items-center justify-center mb-4">
              <FileText className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-white mb-4">{file.fileName}</h2>
            <a
              href={file.fileUrl}
              download={file.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-[#4638F5] text-white text-xs font-semibold inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Berkas</span>
            </a>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-5 inset-x-0 flex justify-center z-10 pointer-events-none">
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-[#151822]/95 text-white shadow-2xl pointer-events-auto">
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10"
            aria-label="Perkecil"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold px-2 tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10"
            aria-label="Perbesar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10"
            aria-label="Putar 90 derajat"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl hover:bg-white/10"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LightboxModal() {
  const { lightboxFile, setLightboxFile } = useOrders();

  if (!lightboxFile) return null;

  return (
    <LightboxContent
      key={lightboxFile.id}
      file={lightboxFile}
      onClose={() => setLightboxFile(null)}
    />
  );
}
