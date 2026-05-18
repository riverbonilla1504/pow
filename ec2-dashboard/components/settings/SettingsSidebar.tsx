'use client';

/** SettingsSidebar — sidebar de navegación dentro de la sección de configuración */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, LayoutDashboard } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/settings/security', label: 'Seguridad', icon: Shield },
  { href: '/dashboard', label: 'Órdenes', icon: LayoutDashboard, external: true },
] as const;

export default function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="settings-sidebar" aria-label="Configuración">
      <p className="settings-sidebar__label">Cuenta</p>
      <ul className="settings-sidebar__list">
        {NAV_ITEMS.map(({ href, label, icon: Icon, ...rest }) => {
          const external = 'external' in rest && rest.external;
          const active = !external && pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={`settings-sidebar__link${active ? ' settings-sidebar__link--active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
