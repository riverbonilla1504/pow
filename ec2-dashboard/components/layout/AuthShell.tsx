'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Zap, ArrowLeft } from 'lucide-react';

interface AuthShellProps {
  children: React.ReactNode;
  variant?: 'user' | 'admin';
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}

export default function AuthShell({ children, variant = 'user', subtitle, backHref, backLabel }: AuthShellProps) {
  const isAdmin = variant === 'admin';
  const Icon = isAdmin ? Zap : ShoppingBag;
  const brand = isAdmin ? 'admin.freck.lat' : 'freck.lat';

  return (
    <div className="auth-shell">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[150px] opacity-15 pointer-events-none" style={{ background: 'var(--green)' }} />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="auth-card relative">
        {backHref && (
          <Link href={backHref} className="flex items-center gap-2 mb-8 text-slate-500 hover:text-white transition-colors text-sm">
            <ArrowLeft size={14} /> {backLabel || 'Volver'}
          </Link>
        )}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--green)' }}>
            <Icon size={17} className="text-black" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">{brand}</p>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
