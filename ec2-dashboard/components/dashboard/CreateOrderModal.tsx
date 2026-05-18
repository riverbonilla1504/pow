'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Package, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { createOrder } from '@/lib/api';

const sidebarTransition = { type: 'spring' as const, damping: 28, stiffness: 320 };

type Item = { name: string; qty: number; price: number };

type CreateOrderModalProps = {
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateOrderModal({ onClose, onCreated }: CreateOrderModalProps) {
  const [items, setItems] = useState<Item[]>([{ name: '', qty: 1, price: 0 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = items.reduce((s, i) => s + i.qty * i.price, 0);

  function addItem() {
    setItems((p) => [...p, { name: '', qty: 1, price: 0 }]);
  }

  function removeItem(i: number) {
    setItems((p) => p.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: keyof Item, val: string | number) {
    setItems((p) => p.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.some((i) => !i.name || i.price <= 0)) {
      setError('Todos los ítems deben tener nombre y precio');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createOrder(items, parseFloat(total.toFixed(2)));
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la orden');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="dashboard-sidebar-overlay theme-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={sidebarTransition}
        className="dashboard-sidebar glass"
        role="dialog"
        aria-labelledby="new-order-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dashboard-sidebar__header">
          <h2 id="new-order-title" className="dashboard-sidebar__title">
            Nueva orden
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="dashboard-sidebar__close"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          <div className="dashboard-modal__items">
            {items.map((item, i) => (
              <div key={i} className="dashboard-modal-item card-glass">
                <div className="dashboard-modal-item__head">
                  <span className="dashboard-modal-item__label">Ítem {i + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="dashboard-modal-item__remove"
                      aria-label={`Eliminar ítem ${i + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor={`item-name-${i}`}>
                    Producto
                  </label>
                  <input
                    id={`item-name-${i}`}
                    type="text"
                    placeholder="Nombre del producto"
                    value={item.name}
                    onChange={(e) => updateItem(i, 'name', e.target.value)}
                    required
                    className="auth-input auth-input--plain"
                  />
                </div>
                <div className="dashboard-modal-item__row">
                  <div className="auth-field">
                    <label className="auth-label" htmlFor={`item-qty-${i}`}>
                      Cantidad
                    </label>
                    <input
                      id={`item-qty-${i}`}
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) => updateItem(i, 'qty', parseInt(e.target.value, 10) || 1)}
                      className="auth-input auth-input--plain"
                    />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label" htmlFor={`item-price-${i}`}>
                      Precio (USD)
                    </label>
                    <input
                      id={`item-price-${i}`}
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min={0}
                      value={item.price || ''}
                      onChange={(e) => updateItem(i, 'price', parseFloat(e.target.value) || 0)}
                      className="auth-input auth-input--plain"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addItem} className="dashboard-modal__add-item">
            <Plus size={15} aria-hidden />
            Agregar ítem
          </button>

          <div className="dashboard-modal__total callout-green">
            <span>Total estimado</span>
            <strong>${total.toFixed(2)}</strong>
          </div>

          {total > 500 && (
            <div className="dashboard-modal__sms-hint">
              <AlertCircle size={14} aria-hidden />
              Orden superior a $500 — se enviará SMS al teléfono registrado
            </div>
          )}

          {error ? (
            <div className="auth-alert" role="alert">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              {error}
            </div>
          ) : null}

          <div className="dashboard-sidebar__footer">
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="btn-primary auth-submit"
            >
              {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Package size={16} aria-hidden />}
              {loading ? 'Creando…' : 'Crear orden'}
            </motion.button>
          </div>
        </form>
      </motion.aside>
    </motion.div>
  );
}
