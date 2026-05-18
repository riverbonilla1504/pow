'use client';

/**
 * SettingsShell — layout protegido para la sección de configuración.
 * Verifica autenticación, carga perfil del usuario, y renderiza
 * nav + sidebar de settings + contenido de la página activa.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { hasToken, clearToken, getMe } from '@/lib/api';
import DashboardNav from '@/components/dashboard/DashboardNav';
import SettingsSidebar from '@/components/settings/SettingsSidebar';
import { SettingsProfileProvider } from '@/components/settings/SettingsProfileContext';

export type UserProfile = {
  id: string;
  email: string;
  role: string;
  phone?: string | null;
  totp_enabled: boolean;
};

type SettingsShellProps = {
  children: React.ReactNode;
};

export default function SettingsShell({ children }: SettingsShellProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!hasToken()) {
      router.push('/login');
      return;
    }
    getMe()
      .then((data: UserProfile) => setProfile(data))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  function logout() {
    clearToken();
    router.push('/');
  }

  if (loading || !profile) {
    return (
      <div className="dashboard-page settings-page settings-page--loading">
        <Loader2 size={26} className="animate-spin text-[var(--green)]" aria-hidden />
      </div>
    );
  }

  return (
    <SettingsProfileProvider profile={profile}>
      <div className="dashboard-page settings-page">
        <DashboardNav variant="settings" onLogout={logout} />
        <main className="dashboard-main settings-main">
          <div className="settings-layout">
            <SettingsSidebar />
            <div className="settings-content">{children}</div>
          </div>
        </main>
      </div>
    </SettingsProfileProvider>
  );
}
