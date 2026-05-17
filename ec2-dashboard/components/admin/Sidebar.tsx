'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, ShoppingCart, Bell, AlertTriangle, Users, LogOut, Zap } from 'lucide-react';
import { clearToken } from '@/lib/api';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Órdenes', icon: ShoppingCart },
  { href: '/admin/notifications', label: 'Notificaciones', icon: Bell },
  { href: '/admin/dlq', label: 'Dead Letter Queue', icon: AlertTriangle },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
];

export default function AdminSidebar() {
  const path = usePathname();
  const router = useRouter();

  function logout() { clearToken(); window.location.href = '/login'; }

  return (
    <aside className="fixed left-0 top-0 h-full w-56 flex flex-col z-30" style={{ background: '#0a0a14', borderRight: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2.5 px-4 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--green)' }}>
          <Zap size={14} className="text-black" />
        </div>
        <div>
          <p className="text-xs font-bold text-white">admin.freck.lat</p>
          <p className="text-[10px] text-slate-600">Panel de Control</p>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/admin' && path.startsWith(href));
          return (
            <Link key={href} href={href}>
              <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                style={{
                  color: active ? 'var(--green)' : '#64748b',
                  background: active ? 'rgba(0,237,100,0.08)' : 'transparent',
                  border: active ? '1px solid rgba(0,237,100,0.15)' : '1px solid transparent',
                }}>
                <Icon size={14} />
                {label}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <button onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-xs text-slate-600 hover:text-red-400 hover:bg-red-400/5 transition-colors">
          <LogOut size={14} />Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
