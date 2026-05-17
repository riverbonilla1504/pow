'use client';
import { useEffect, useState } from 'react';
import { hasToken, getTokenPayload } from '@/lib/api';
import AdminSidebar from '@/components/admin/Sidebar';
import TwoFactorSetup from '@/components/admin/TwoFactorSetup';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'no-auth' | 'needs-2fa' | 'ready'>('loading');

  useEffect(() => {
    if (!hasToken()) {
      window.location.href = 'https://freck.lat/login';
      return;
    }
    const payload = getTokenPayload();
    if (!payload) {
      window.location.href = 'https://freck.lat/login';
      return;
    }
    if (payload.role !== 'admin') {
      window.location.href = 'https://freck.lat/dashboard';
      return;
    }
    if (!payload.twoFactorVerified) {
      setState('needs-2fa');
      return;
    }
    setState('ready');
  }, []);

  if (state === 'loading' || state === 'no-auth') return null;

  if (state === 'needs-2fa') return <TwoFactorSetup />;

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="ml-56 flex-1 p-6 animate-fade-in">{children}</main>
    </div>
  );
}
