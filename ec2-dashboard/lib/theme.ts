export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'freck-theme';

export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function resolveTheme(stored: string | null): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return getSystemTheme();
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}
