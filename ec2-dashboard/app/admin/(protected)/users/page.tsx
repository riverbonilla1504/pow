'use client';

/**
 * UsersPage — gestión de usuarios del sistema.
 * Muestra: cards de resumen por rol, búsqueda por email, tabla de usuarios
 * con dropdown para cambiar roles (cliente/operador/admin), y paginación.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Shield, ShieldCheck, User, ChevronDown, Check, Search } from 'lucide-react';
import { adminUsers, updateRole } from '@/lib/api';

/** Roles disponibles en el sistema */
const ROLES = ['cliente', 'operador', 'admin'];

const ROLE_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  admin:    { color: 'var(--green)',  bg: 'var(--green-subtle)',          icon: ShieldCheck },
  operador: { color: '#3b82f6',       bg: 'rgba(59,130,246,0.12)',        icon: Shield      },
  cliente:  { color: 'var(--text-muted)', bg: 'var(--surface-hover)',     icon: User        },
};

function RoleDropdown({ userId, current, onChanged }: { userId: string; current: string; onChanged: (role: string) => void }) {
  const [open, setOpen]       = useState(false);
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
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
        style={{ background: conf.bg, color: conf.color, border: `1px solid ${conf.color === 'var(--green)' ? 'var(--green-border)' : conf.color + '30'}` }}
      >
        <Icon size={11} />
        {current}
        {loading
          ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          : <ChevronDown size={10} />
        }
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden py-1 min-w-[120px]"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
            >
              {ROLES.map(role => {
                const rc = ROLE_CONFIG[role];
                const RI = rc.icon;
                return (
                  <button
                    key={role}
                    onClick={() => change(role)}
                    className="flex items-center justify-between gap-2 w-full px-3 py-2 text-xs transition-colors"
                    style={{ color: rc.color }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
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
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">Usuarios</h1>
          <p className="admin-page-subtitle">{total} usuarios registrados</p>
        </div>
        <button onClick={load} className="admin-icon-btn">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </motion.div>

      {/* Role summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className="grid grid-cols-3 gap-4"
      >
        {ROLES.map((role, i) => {
          const conf = ROLE_CONFIG[role];
          const Icon = conf.icon;
          return (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 + i * 0.06 }}
              className="dashboard-stat glass"
            >
              <div
                className="dashboard-stat__icon"
                style={{ background: conf.bg, color: conf.color, border: `1px solid ${conf.color === 'var(--green)' ? 'var(--green-border)' : conf.color + '30'}` }}
              >
                <Icon size={16} />
              </div>
              <div>
                <p className="dashboard-stat__value" style={{ color: conf.color, fontSize: '1.25rem' }}>
                  {loading ? '—' : roleCount(role)}
                </p>
                <p className="dashboard-stat__label capitalize">{role}s</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="dashboard-panel glass p-4"
      >
        <div className="admin-search-wrap">
          <Search size={13} className="admin-search-icon" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por email…"
            className="admin-search-input"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="dashboard-panel glass overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="admin-thead">
              <tr>
                {['Avatar', 'Email', 'Rol', '2FA', 'Teléfono', 'Creado'].map(h => (
                  <th key={h} className="admin-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="admin-row">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="admin-td">
                        <div className="h-3 rounded skeleton" style={{ width: j === 1 ? '180px' : '70px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty-cell">
                    {search ? 'Sin resultados' : 'Sin usuarios'}
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filtered.map((u: any, i: number) => {
                    const conf = ROLE_CONFIG[u.role] || ROLE_CONFIG.cliente;
                    return (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                        className="admin-row"
                      >
                        <td className="admin-td">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: conf.bg, color: conf.color }}
                          >
                            {u.email?.[0]?.toUpperCase() || '?'}
                          </div>
                        </td>
                        <td className="admin-td">{u.email}</td>
                        <td className="admin-td">
                          <RoleDropdown userId={u.id} current={u.role || 'cliente'} onChanged={role => patchRole(u.id, role)} />
                        </td>
                        <td className="admin-td">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={u.two_factor_enabled
                              ? { background: 'var(--green-subtle)', color: 'var(--green)' }
                              : { background: 'var(--surface-hover)', color: 'var(--text-muted)' }
                            }
                          >
                            {u.two_factor_enabled ? 'Activo' : 'Off'}
                          </span>
                        </td>
                        <td className="admin-td admin-td--muted">{u.phone || '—'}</td>
                        <td className="admin-td admin-td--muted">
                          {new Date(u.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="admin-pagination">
            <span className="admin-pagination__info">Página {page} de {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="admin-action-btn"
                style={page === 1 ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="admin-action-btn"
                style={page === totalPages ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
