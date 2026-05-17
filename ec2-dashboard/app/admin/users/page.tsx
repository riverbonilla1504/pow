'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, RefreshCw, Shield, ShieldCheck, User, ChevronDown, Check, Search } from 'lucide-react';
import { adminUsers, updateRole } from '@/lib/api';

const ROLES = ['cliente', 'operador', 'admin'];

const ROLE_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  admin:    { color: '#00ed64', bg: 'rgba(0,237,100,0.12)',  icon: ShieldCheck },
  operador: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: Shield },
  cliente:  { color: '#64748b', bg: 'rgba(100,116,139,0.12)', icon: User },
};

function RoleDropdown({ userId, current, onChanged }: { userId: string; current: string; onChanged: (role: string) => void }) {
  const [open, setOpen]     = useState(false);
  const [loading, setLoading] = useState(false);
  const conf = ROLE_CONFIG[current] || ROLE_CONFIG.cliente;
  const Icon = conf.icon;

  async function change(role: string) {
    if (role === current) { setOpen(false); return; }
    setLoading(true); setOpen(false);
    try {
      await updateRole(userId, role);
      onChanged(role);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} disabled={loading}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
        style={{ background: conf.bg, color: conf.color, border: `1px solid ${conf.color}30` }}>
        <Icon size={11} />
        {current}
        {loading ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                 : <ChevronDown size={10} />}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden py-1 min-w-[120px]"
              style={{ background: '#0f1020', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              {ROLES.map(role => {
                const rc = ROLE_CONFIG[role];
                const RI = rc.icon;
                return (
                  <button key={role} onClick={() => change(role)}
                    className="flex items-center justify-between gap-2 w-full px-3 py-2 text-xs hover:bg-white/5 transition-colors"
                    style={{ color: rc.color }}>
                    <div className="flex items-center gap-2"><RI size={11} />{role}</div>
                    {role === current && <Check size={10} />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers]     = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    adminUsers(page, limit)
      .then((r: any) => { setUsers(r.users || []); setTotal(r.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  function patchRole(userId: string, role: string) {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  }

  const filtered = search
    ? users.filter(u => u.email?.toLowerCase().includes(search.toLowerCase()))
    : users;

  const roleCount = (role: string) => users.filter(u => u.role === role).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Usuarios</h1>
          <p className="text-slate-500 text-sm mt-1">{total} usuarios registrados</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </motion.div>

      {/* Role summary cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className="grid grid-cols-3 gap-4">
        {ROLES.map((role, i) => {
          const conf = ROLE_CONFIG[role];
          const Icon = conf.icon;
          return (
            <motion.div key={role} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 + i * 0.06 }}
              className="glass rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: conf.bg }}>
                <Icon size={16} style={{ color: conf.color }} />
              </div>
              <div>
                <p className="text-lg font-black text-white">{loading ? '—' : roleCount(role)}</p>
                <p className="text-xs capitalize" style={{ color: conf.color }}>{role}s</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por email…"
            className="w-full pl-8 pr-3 py-2 rounded-xl text-sm text-white placeholder-slate-600 outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }} />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-slate-600 uppercase tracking-wider" style={{ borderBottom: '1px solid var(--border)' }}>
              {['Usuario', 'Email', 'Rol', '2FA', 'Teléfono', 'Creado'].map(h => (
                <th key={h} className="px-5 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-3 rounded skeleton" style={{ width: j === 1 ? '180px' : '70px' }} /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-16 text-center text-slate-600 text-sm">
                {search ? 'Sin resultados' : 'Sin usuarios'}
              </td></tr>
            ) : (
              <AnimatePresence>
                {filtered.map((u: any, i: number) => {
                  const conf = ROLE_CONFIG[u.role] || ROLE_CONFIG.cliente;
                  return (
                    <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="hover:bg-white/2 transition-colors" style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="px-5 py-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: conf.bg, color: conf.color }}>
                          {u.email?.[0]?.toUpperCase() || '?'}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-300">{u.email}</td>
                      <td className="px-5 py-3">
                        <RoleDropdown userId={u.id} current={u.role || 'cliente'} onChanged={role => patchRole(u.id, role)} />
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={u.two_factor_enabled
                            ? { background: 'rgba(0,237,100,0.12)', color: 'var(--green)' }
                            : { background: 'rgba(100,116,139,0.1)', color: '#475569' }}>
                          {u.two_factor_enabled ? 'Activo' : 'Off'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">{u.phone || '—'}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {new Date(u.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>

        {Math.ceil(total / limit) > 1 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-xs text-slate-600">Página {page} de {Math.ceil(total / limit)}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                Anterior
              </button>
              <button onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))} disabled={page === Math.ceil(total / limit)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                Siguiente
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
