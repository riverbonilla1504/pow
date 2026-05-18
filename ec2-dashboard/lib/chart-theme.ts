/**
 * Tema de colores para gráficas Recharts.
 * Define paletas para modo oscuro y claro, alineadas con los tokens CSS de globals.css.
 * También exporta colores semánticos para estados de órdenes, notificaciones y roles.
 */
import type { Theme } from '@/lib/theme';

/** Paleta de colores para gráficas en modo oscuro */
export const CHART_DARK = {
  brand: '#42b883',
  brandLight: '#5cdb95',
  bg: '#0f1020',
  border: 'rgba(255, 255, 255, 0.08)',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  tooltip: {
    background: '#0f1020',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    color: '#e2e8f0',
    fontSize: '12px',
  },
  tick: '#475569',
  cursor: 'rgba(255, 255, 255, 0.03)',
} as const;

/** Paleta de colores para gráficas en modo claro */
export const CHART_LIGHT = {
  brand: '#42b883',
  brandLight: '#5cdb95',
  bg: '#ffffff',
  border: 'rgba(15, 23, 42, 0.1)',
  text: '#0f172a',
  textMuted: '#64748b',
  tooltip: {
    background: '#ffffff',
    border: '1px solid rgba(15, 23, 42, 0.1)',
    borderRadius: '10px',
    color: '#0f172a',
    fontSize: '12px',
  },
  tick: '#94a3b8',
  cursor: 'rgba(15, 23, 42, 0.04)',
} as const;

/** @deprecated use getChartTheme(theme) */
export const CHART = CHART_DARK;

/** Retorna la paleta de colores apropiada según el tema activo */
export function getChartTheme(theme: Theme = 'dark') {
  return theme === 'light' ? CHART_LIGHT : CHART_DARK;
}

/** Colores por estado de orden — usados en barras y badges */
export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: '#eab308',
  paid: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#22c55e',
  returned: '#ef4444',
};

/** Colores por tipo de notificación (email vs SMS) */
export const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  email: '#3b82f6',
  sms: '#8b5cf6',
};

/** Colores por estado de notificación */
export const NOTIFICATION_STATUS_COLORS: Record<string, string> = {
  sent: '#22c55e',
  failed: '#ef4444',
  pending: '#eab308',
};

/** Colores por rol de usuario — usados en badges y avatars */
export const ROLE_COLORS: Record<string, { color: string; bg: string }> = {
  admin: { color: CHART_DARK.brand, bg: 'var(--green-subtle)' },
  operador: { color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)' },
  cliente: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' },
};
