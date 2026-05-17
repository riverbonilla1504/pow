'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, Check, X } from 'lucide-react';
import AuthGuard from '../../components/AuthGuard';
import StatusBadge from '../../components/StatusBadge';
import { api } from '../../lib/api';

const ROLES = ['cliente', 'operador', 'admin'];

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    api.users().then(r => setUsers(r.users)).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function changeRole(id: string, role: string) {
    setUpdating(id);
    try {
      const res = await api.updateRole(id, role);
      setUsers(u => u.map(user => user.id === id ? { ...user, role: res.user.role } : user));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  }

  return (
    <AuthGuard>
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-slate-400 text-sm mt-1">{users.length} registered users</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-left">Phone</th>
                  <th className="px-5 py-3 text-left">2FA</th>
                  <th className="px-5 py-3 text-left">Joined</th>
                  <th className="px-5 py-3 text-left">Change Role</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="border-t border-white/5">
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-5 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : users.map((user, i) => (
                  <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-t border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3 text-slate-300 text-xs">{user.email}</td>
                    <td className="px-5 py-3"><StatusBadge value={user.role} /></td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{user.phone || '—'}</td>
                    <td className="px-5 py-3">
                      {user.totp_enabled
                        ? <span className="flex items-center gap-1 text-green-400 text-xs"><Check size={12} /> Enabled</span>
                        : <span className="flex items-center gap-1 text-slate-500 text-xs"><X size={12} /> Disabled</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        {ROLES.map(r => (
                          <button key={r} onClick={() => changeRole(user.id, r)} disabled={user.role === r || updating === user.id}
                            className={`px-2.5 py-1 rounded-md text-xs transition-colors ${user.role === r ? 'bg-brand-600/30 text-brand-400 cursor-default' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-40'}`}>
                            {updating === user.id ? '…' : r}
                          </button>
                        ))}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AuthGuard>
  );
}
