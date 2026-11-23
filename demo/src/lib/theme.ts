import { useCallback, useSyncExternalStore } from 'react';

import { themes } from 'virtual:cybercore-css';

/**
 * Theme state lives on <html data-theme="…">, the hook cybercore-css selects
 * on. The charts read the same custom properties, so they follow without
 * being told. No attribute means the default accent.
 */

export const DEFAULT_THEME = 'cyan';
// Shared with the cybercore-css site: same origin, same preference.
const STORAGE_KEY = 'cybercore-theme';
const listeners = new Set<() => void>();

/** Whatever accents the bundled cybercore-css declares, default first. */
export const THEMES: string[] =
  themes.length === 0 ? [] : [DEFAULT_THEME, ...themes.filter((name) => name !== DEFAULT_THEME)];

function read(): string {
  return document.documentElement.dataset.theme ?? DEFAULT_THEME;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function applyTheme(name: string): void {
  const next = THEMES.includes(name) ? name : DEFAULT_THEME;
  if (next === DEFAULT_THEME) {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = next;
  }
  try {
    if (next === DEFAULT_THEME) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, next);
    }
  } catch {
    // Storage can be blocked (private mode). The theme still applies for this visit.
  }
  listeners.forEach((listener) => listener());
}

export function useTheme(): [string, (name: string) => void] {
  const theme = useSyncExternalStore(subscribe, read, () => DEFAULT_THEME);
  const setTheme = useCallback((name: string) => applyTheme(name), []);
  return [theme, setTheme];
}

export function titleCase(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
