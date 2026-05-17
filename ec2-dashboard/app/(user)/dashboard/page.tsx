'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Plus, LogOut, Package, Clock, CheckCircle, Truck, RotateCcw, X, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { myOrders, createOrder, hasToken, clearToken } from '@/lib/api';
import StatusBadge from '@/components/shared/StatusBadge';

const STATUS_ICONS: Record<string, any> = {
  pending: Clock, paid: CheckCircle, shipped: Truck, delivered: CheckCircle, returned: RotateCcw,
};

function CreateOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [items, setItems] = useState([{ name: '', qty: 1, price: 0 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = items.reduce((s, i) => s + i.qty * i.price, 0);

  function addItem() { setItems(p => [...p, { name: '', qty: 1, price: 0 }]); }
  function removeItem(i: number) { setItems(p => p.filter((_, idx) => idx !== i)); }
  function updateItem(i: number, field: string, val: any) {
    setItems(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.some(i => !i.name || i.price <= 0)) { setError('Todos los items deben tener nombre y precio'); return; }
    setLoading(true); setError('');
    try {
      await createOrder(items, parseFloat(total.toFixed(2)));
      onCreated();
      onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        className="glass rounded-2xl p-6 w-full max-w-md" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Nueva Orden</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="p-3 rounded-xl space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Item {i + 1}</span>
                  {items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>}
                </div>
                <input type="text" placeholder="Nombre del producto" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} required
                  className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }} />
                <div className="flex gap-2">
                  <input type="number" placeholder="Cantidad" value={item.qty} min={1} onChange={e => updateItem(i, 'qty', parseInt(e.target.value))}
                    className="w-24 rounded-lg px-3 py-2 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }} />
                  <input type="number" placeholder="Precio USD" value={item.price || ''} step="0.01" min={0} onChange={e => updateItem(i, 'price', parseFloat(e.target.value) || 0)}
                    className="flex-1 rounded-lg px-3 py-2 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }} />
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addItem} className="w-full py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
            style={{ border: '1px dashed var(--border)' }}>
            <Plus size={14} /> Agregar item
          </button>

          <div className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ background: 'rgba(0,237,100,0.08)', border: '1px solid rgba(0,237,100,0.2)' }}>
            <span className="text-sm text-slate-300">Total</span>
            <span className="text-lg font-bold" style={{ color: 'var(--green)' }}>${total.toFixed(2)}</span>
          </div>

          {total > 500 && (
            <div className="flex items-center gap-2 text-xs p-3 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#c4b5fd' }}>
              <AlertCircle size={13} /> Orden +$500 — se enviará SMS al número registrado
            </div>
          )}

          {error && <div className="flex items-center gap-2 text-red-400 text-xs p-3 rounded-lg bg-red-500/10"><AlertCircle size={13} />{error}</div>}

          <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="w-full py-2.5 rounded-xl font-semibold text-black text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'var(--green)' }}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
            {loading ? 'Creando...' : 'Crear Orden'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    myOrders().then((r: any) => setOrders(r.orders || [])).catch(() => router.push('/login')).finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!hasToken()) { router.push('/login'); return; }
    load();
  }, [load, router]);

  function logout() { clearToken(); router.push('/'); }

  const total = orders.reduce((s: number, o: any) => s + parseFloat(o.total), 0);
  const delivered = orders.filter((o: any) => o.status === 'delivered').length;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 glass" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--green)' }}>
            <ShoppingBag size={14} className="text-black" />
          </div>
          <span className="font-bold text-white text-sm">freck.lat</span>
        </Link>
        <div className="flex items-center gap-3">
          <motion.button onClick={() => setShowModal(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-black"
            style={{ background: 'var(--green)' }}>
            <Plus size={14} /> Nueva Orden
          </motion.button>
          <button onClick={logout} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors"><LogOut size={15} /></button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Órdenes', value: orders.length, color: 'var(--green)' },
            { label: 'Entregadas', value: delivered, color: '#22c55e' },
            { label: 'Total Gastado', value: `$${total.toFixed(2)}`, color: '#3b82f6' },
          ].map(({ label, value, color }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-5">
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            </motion.div>
          ))}
        </div>

        {/* Orders */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-semibold text-white">Mis Órdenes</h2>
            <span className="text-xs text-slate-500">{orders.length} órdenes</span>
          </div>

          {loading ? (
            <div className="space-y-px">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 skeleton" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,237,100,0.1)', border: '1px solid rgba(0,237,100,0.2)' }}>
                <Package size={24} style={{ color: 'var(--green)' }} />
              </div>
              <p className="text-slate-400 font-medium">No tienes órdenes aún</p>
              <button onClick={() => setShowModal(true)} className="text-sm font-medium" style={{ color: 'var(--green)' }}>Crea tu primera orden →</button>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {orders.map((order: any, i: number) => {
                const Icon = STATUS_ICONS[order.status] || Package;
                return (
                  <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between px-5 py-4 hover:bg-white/2 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <Icon size={15} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium font-mono">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="text-sm font-semibold" style={{ color: 'var(--green)' }}>${parseFloat(order.total).toFixed(2)}</p>
                      <StatusBadge value={order.status} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showModal && <CreateOrderModal onClose={() => setShowModal(false)} onCreated={load} />}
      </AnimatePresence>
    </div>
  );
}
