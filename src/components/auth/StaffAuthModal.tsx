'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function StaffAuthModal() {
  const { isAuthModalOpen, closeAuthModal, signInWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    emailInputRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Email dan kata sandi wajib diisi.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    const { error } = await signInWithPassword(email, password);
    setSubmitting(false);

    if (error) {
      setErrorMsg(error);
      return;
    }

    setPassword('');
    closeAuthModal();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-auth-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/55"
    >
      <div className="fixed inset-0" onClick={closeAuthModal} aria-hidden="true" />
      <div className="relative bg-[var(--bg-surface)] text-[var(--ink-primary)] rounded-t-2xl sm:rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden z-10">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#4638F5] text-[#FFFFFF] flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </span>
            <h2 id="staff-auth-modal-title" className="font-bold text-base text-[var(--ink-primary)]">
              Masuk Staf Workshop
            </h2>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="w-9 h-9 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--ink-primary)] flex items-center justify-center"
            aria-label="Tutup modal masuk staf"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 flex flex-col gap-3.5">
          {errorMsg && (
            <div role="alert" className="p-3 rounded-xl bg-[#F29B76] text-[#14161D] text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div>
            <label
              htmlFor="staff-auth-email"
              className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1"
            >
              Email Staf
            </label>
            <input
              ref={emailInputRef}
              id="staff-auth-email"
              type="email"
              autoComplete="email"
              required
              placeholder="operator@mafrend.studio"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] text-xs font-medium text-[var(--ink-primary)]"
            />
          </div>

          <div>
            <label
              htmlFor="staff-auth-password"
              className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1"
            >
              Kata Sandi
            </label>
            <input
              id="staff-auth-password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] text-xs font-medium text-[var(--ink-primary)]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={closeAuthModal}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--ink-primary)] min-h-[40px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#4638F5] hover:bg-[#3B2EE0] text-[#FFFFFF] text-xs font-semibold min-h-[40px]"
            >
              {submitting ? 'Memverifikasi...' : 'Masuk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
