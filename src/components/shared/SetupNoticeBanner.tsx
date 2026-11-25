'use client';

import React from 'react';
import { Copy, Check, AlertCircle, X, Lock, LogOut } from 'lucide-react';
import { useOrderData } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';

export default function SetupNoticeBanner() {
  const { isConfigured, configReason, error, clearError } = useOrderData();
  const { user, authRequired, openAuthModal, signOut } = useAuth();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(
      'NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key'
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {!isConfigured && (
        <div className="w-full bg-[#F9DC7E] text-[#14161D] px-4 py-2 text-xs">
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#23252C] text-[#FFFFFF]">
                Mode Lokal
              </span>
              <p className="font-semibold line-clamp-1">
                {configReason || 'Supabase belum terhubung. Isi kredensial di .env.local.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFFFFF] text-[#14161D] font-bold text-[11px]"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Tersalin' : 'Salin Contoh Env'}</span>
            </button>
          </div>
        </div>
      )}

      {isConfigured && authRequired && (
        <div className="w-full bg-[#8EA6FF] text-[#14161D] px-4 py-2 text-xs">
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#23252C] text-[#FFFFFF]">
                Autentikasi Staf
              </span>
              <p className="font-semibold line-clamp-1">
                Akses database dilindungi RLS. Silakan masuk menggunakan akun staf workshop.
              </p>
            </div>

            <button
              type="button"
              onClick={openAuthModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#4638F5] text-[#FFFFFF] font-bold text-[11px]"
            >
              <Lock className="w-3 h-3" />
              <span>Masuk Staf</span>
            </button>
          </div>
        </div>
      )}

      {isConfigured && user && (
        <div className="w-full bg-[var(--bg-surface)] text-[var(--ink-secondary)] px-4 py-1.5 text-[11px]">
          <div className="max-w-[1400px] mx-auto flex items-center justify-end gap-2.5">
            <span className="truncate">
              Staf aktif: <strong className="text-[var(--ink-primary)]">{user.email}</strong>
            </span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--ink-primary)] font-semibold"
            >
              <LogOut className="w-3 h-3" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 p-3.5 bg-[var(--bg-surface-elevated)] text-[var(--ink-primary)] shadow-2xl rounded-xl text-xs max-w-md">
          <AlertCircle className="w-4 h-4 text-[var(--ink-danger)] shrink-0" />
          <span className="flex-1 font-semibold">{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="w-7 h-7 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-center"
            aria-label="Tutup pesan"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
