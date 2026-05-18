'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, ShoppingCart, Bell, AlertTriangle, Users, LogOut, Zap } from 'lucide-react';
import { clearToken } from '@/lib/api';
import ThemeToggle from '@/components/theme/ThemeToggle';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Órdenes', icon: ShoppingCart },
  { href: '/admin/notifications', label: 'Notificaciones', icon: Bell },
  { href: '/admin/dlq', label: 'Dead Letter Queue', icon: AlertTriangle },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
];

export default function AdminSidebar() {
  const path = usePathname();

  function logout() { clearToken(); window.location.href = '/login'; }

  return (
    <aside className="fixed left-0 top-0 h-full w-56 flex flex-col z-30 sidebar-shell">
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-divider">
        <div className="logo-mark w-7 h-7 rounded-lg">
          <Zap size={14} />
        </div>
        <div>
          <p className="text-xs font-bold theme-brand-name">admin.freck.lat</p>
          <p className="text-[10px] text-slate-600">Panel de Control</p>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/admin' && path.startsWith(href));
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`sidebar-item ${active ? 'sidebar-item--active' : ''}`}
              >
                <Icon size={14} />
                {label}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-3 border-t border-divider space-y-2">
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Tema</span>
          <ThemeToggle size="sm" />
        </div>
        <button
          type="button"
          onClick={logout}
          className="sidebar-item w-full text-slate-600 hover:text-red-400 hover:bg-red-400/5"
        >
          <LogOut size={14} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
