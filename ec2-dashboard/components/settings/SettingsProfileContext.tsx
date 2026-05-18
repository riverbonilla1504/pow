'use client';

/** Contexto de React para compartir el perfil del usuario entre las páginas de settings */

import { createContext, useContext } from 'react';
import type { UserProfile } from '@/components/settings/SettingsShell';

const SettingsProfileContext = createContext<UserProfile | null>(null);

export function SettingsProfileProvider({
  profile,
  children,
}: {
  profile: UserProfile;
  children: React.ReactNode;
}) {
  return (
    <SettingsProfileContext.Provider value={profile}>{children}</SettingsProfileContext.Provider>
  );
}

export function useSettingsProfile() {
  const profile = useContext(SettingsProfileContext);
  if (!profile) throw new Error('useSettingsProfile must be used within SettingsShell');
  return profile;
}
