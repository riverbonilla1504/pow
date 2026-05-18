'use client';

/**
 * ThemeToggle — botón para alternar entre modo claro y oscuro.
 * Soporta dos tamaños: 'sm' (sidebar admin) y 'md' (nav principal).
 */

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

type ThemeToggleProps = {
  className?: string;
  size?: 'sm' | 'md';
};

export default function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = theme === 'dark';
  const dim = size === 'sm' ? 14 : 16;
  const btnClass = size === 'sm' ? 'theme-toggle theme-toggle--sm' : 'theme-toggle';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`${btnClass} ${className}`.trim()}
      aria-label={mounted ? (isDark ? 'Activar modo claro' : 'Activar modo oscuro') : 'Cambiar tema'}
      title={mounted ? (isDark ? 'Modo claro' : 'Modo oscuro') : 'Tema'}
    >
      <span className="theme-toggle__icon" aria-hidden>
        {mounted ? (isDark ? <Sun size={dim} /> : <Moon size={dim} />) : <Sun size={dim} />}
      </span>
    </button>
  );
}
