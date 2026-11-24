'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextType {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setThemePreference: (pref: ThemePreference) => void;
}

const STORAGE_KEY = 'color-scheme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemScheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applySchemeToDom(pref: ThemePreference, resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="color-scheme"]');
  const metaContent = pref === 'system' ? 'light dark' : pref;

  if (meta) {
    meta.setAttribute('content', metaContent);
  }
  root.setAttribute('data-theme', resolved);
  root.classList.toggle('dark', resolved === 'dark');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');

  useEffect(() => {
    let isMounted = true;

    async function hydrateTheme() {
      await Promise.resolve();
      if (!isMounted) return;

      const sys = getSystemScheme();
      let stored: ThemePreference = 'system';
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === 'light' || raw === 'dark') {
          stored = raw;
        }
      } catch {
        // Ignore storage access errors
      }

      const initialResolved: ResolvedTheme = stored === 'system' ? sys : stored;
      setSystemTheme(sys);
      setPreferenceState(stored);
      applySchemeToDom(stored, initialResolved);
    }

    void hydrateTheme();

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      const nextSys: ResolvedTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(nextSys);
      setPreferenceState((currPref) => {
        const nextResolved = currPref === 'system' ? nextSys : currPref;
        applySchemeToDom(currPref, nextResolved);
        return currPref;
      });
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const nextPref: ThemePreference =
        e.newValue === 'light' || e.newValue === 'dark' ? e.newValue : 'system';
      const curSys = getSystemScheme();
      const nextResolved = nextPref === 'system' ? curSys : nextPref;
      setPreferenceState(nextPref);
      applySchemeToDom(nextPref, nextResolved);
    };

    mql.addEventListener('change', handleMediaChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      isMounted = false;
      mql.removeEventListener('change', handleMediaChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const resolvedTheme: ResolvedTheme = preference === 'system' ? systemTheme : preference;

  const setThemePreference = useCallback((nextPref: ThemePreference) => {
    const curSys = getSystemScheme();
    const nextResolved: ResolvedTheme = nextPref === 'system' ? curSys : nextPref;
    setPreferenceState(nextPref);
    try {
      if (nextPref === 'system') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, nextPref);
      }
    } catch {
      // Ignore storage access errors
    }
    applySchemeToDom(nextPref, nextResolved);
  }, []);

  // Two-state toggle per modern-web-guidance dark-mode-toggle:
  // Picks the opposite of the currently rendered scheme; clears storage when matching system default.
  const toggleTheme = useCallback(() => {
    const curSys = getSystemScheme();
    const currentRendered: ResolvedTheme =
      preference === 'system' ? curSys : preference;
    const target: ResolvedTheme = currentRendered === 'dark' ? 'light' : 'dark';
    const nextPref: ThemePreference = target === curSys ? 'system' : target;

    setPreferenceState(nextPref);
    try {
      if (nextPref === 'system') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, nextPref);
      }
    } catch {
      // Ignore storage access errors
    }
    applySchemeToDom(nextPref, target);
  }, [preference]);

  const value = useMemo<ThemeContextType>(
    () => ({
      preference,
      resolvedTheme,
      isDark: resolvedTheme === 'dark',
      toggleTheme,
      setThemePreference,
    }),
    [preference, resolvedTheme, toggleTheme, setThemePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
