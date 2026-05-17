'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, ShoppingCart, Bell, AlertTriangle, Users, LogOut, ShoppingBag } from 'lucide-react';
import { api } from '../lib/api';
import clsx from 'clsx';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/dlq', label: 'Dead Letter Queue', icon: AlertTriangle },
  { href: '/users', label: 'Users', icon: Users },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();

  function logout() {
    api.clearToken();
    router.push('/login');
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] glass border-r border-white/5 flex flex-col z-30">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <ShoppingBag size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">freck.lat</p>
          <p className="text-xs text-slate-500">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link key={href} href={href}>
              <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer',
                  active ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}>
                <Icon size={16} />
                {label}
                {active && (
                  <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/5">
        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors">
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
