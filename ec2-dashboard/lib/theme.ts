/**
 * Utilidades de tema (light/dark).
 * Maneja persistencia en localStorage y detección del tema del sistema operativo.
 */

/** Tipos de tema soportados */
export type Theme = 'light' | 'dark';

/** Clave de localStorage para persistir la preferencia de tema */
export const THEME_STORAGE_KEY = 'freck-theme';

/** Detecta el tema preferido del sistema operativo */
export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/** Resuelve el tema: usa el almacenado si es válido, sino el del sistema */
export function resolveTheme(stored: string | null): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return getSystemTheme();
}

/** Aplica el tema al DOM estableciendo data-theme en el html */
export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}
