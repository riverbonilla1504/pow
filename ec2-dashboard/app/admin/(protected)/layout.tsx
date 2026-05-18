'use client';

/**
 * AdminProtectedLayout — layout que protege todas las rutas admin.
 * Verifica: 1) JWT válido, 2) rol admin, 3) 2FA verificado.
 * Si falta alguno, muestra pantalla de error o enrollment de 2FA.
 * Usa flex layout con sidebar sticky + main flexible.
 */

import { useEffect, useState } from 'react';
import { hasToken, getTokenPayload, clearToken, isAdminRole } from '@/lib/api';
import AdminSidebar from '@/components/admin/Sidebar';
import TwoFactorEnroll from '@/components/auth/TwoFactorEnroll';

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'no-auth' | 'wrong-role' | 'needs-2fa' | 'ready'>('loading');

  useEffect(() => {
    if (!hasToken()) {
      window.location.href = '/login';
      return;
    }
    const payload = getTokenPayload();
    if (!payload) {
      window.location.href = '/login';
      return;
    }
    if (!isAdminRole(payload.role)) {
      setState('wrong-role');
      return;
    }
    if (!payload.twoFactorVerified) {
      setState('needs-2fa');
      return;
    }
    setState('ready');
  }, []);

  if (state === 'loading' || state === 'no-auth') return null;

  if (state === 'wrong-role') {
    return (
      <div className="auth-shell">
        <div className="auth-card glass rounded-2xl p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-white">Acceso denegado</h1>
          <p className="text-sm text-slate-400">Solo cuentas con rol administrador pueden acceder a este panel.</p>
          <a href="https://freck.lat/"
            className="inline-block px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--green)' }}>
            Ir a freck.lat
          </a>
        </div>
      </div>
    );
  }

  if (state === 'needs-2fa') {
    return (
      <div className="auth-shell">
        <div className="auth-card glass rounded-2xl p-8">
          <p className="text-sm text-slate-400 mb-6 text-center">
            El panel de administración requiere autenticación de dos factores.
          </p>
          <TwoFactorEnroll
            onComplete={() => {
              clearToken();
              window.location.href = '/login';
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 min-w-0 animate-fade-in py-6 px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
