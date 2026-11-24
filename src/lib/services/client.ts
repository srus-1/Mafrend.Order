import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  reason?: string;
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !key) {
    return {
      isConfigured: false,
      reason: 'URL atau Anon Key belum disetel di environment variables.',
    };
  }

  const placeholderTokens = [
    'project-id-kamu',
    'your-project',
    'placeholder',
    'example.com',
    '...',
    '<your-anon-key>',
    '<your-supabase-url>',
  ];

  const hasPlaceholder = placeholderTokens.some(
    (token) => url.toLowerCase().includes(token) || key.toLowerCase().includes(token)
  );

  if (hasPlaceholder) {
    return {
      isConfigured: false,
      reason: 'Environment variables masih menggunakan nilai placeholder.',
    };
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        isConfigured: false,
        reason: 'Protokol URL Supabase harus diawali http:// atau https://.',
      };
    }
  } catch {
    return {
      isConfigured: false,
      reason: 'Format NEXT_PUBLIC_SUPABASE_URL tidak valid.',
    };
  }

  if (key.length < 20) {
    return {
      isConfigured: false,
      reason: 'NEXT_PUBLIC_SUPABASE_ANON_KEY tampak tidak valid atau terlalu pendek.',
    };
  }

  return { isConfigured: true };
}

export const isSupabaseConfigured = getSupabaseConfigStatus().isConfigured;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
      (
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      )!.trim()
    )
  : null;

/**
 * Detects PostgreSQL RLS / PostgREST auth errors (42501, PGRST301) and notifies AuthContext.
 */
export function notifyIfAuthError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const candidate = err as { code?: string; message?: string; status?: number };
  const code = String(candidate.code || '');
  const msg = String(candidate.message || '').toLowerCase();
  const isAuthErr =
    code === '42501' ||
    code === 'PGRST301' ||
    candidate.status === 401 ||
    msg.includes('row-level security') ||
    msg.includes('jwt expired');

  if (isAuthErr && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mafrend:auth-required'));
  }
  return isAuthErr;
}
