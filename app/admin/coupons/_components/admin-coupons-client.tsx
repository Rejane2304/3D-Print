'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Tag, CheckCircle, AlertTriangle } from 'lucide-react';
import type { CouponType } from '@/lib/types';

const emptyForm = {
  code: '', discountType: 'percentage', discountValue: '',
  minPurchase: '', maxUses: '',
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: '', isActive: true,
};

export default function AdminCouponsClient() {
  const [coupons, setCoupons] = useState<CouponType[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (data.coupons) setCoupons(data.coupons);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCoupons(); }, [loadCoupons]);

  const notify = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editing ? `/api/admin/coupons/${editing}` : '/api/admin/coupons';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        notify('success', editing ? 'Cupón actualizado' : 'Cupón creado');
        setShowForm(false); setEditing(null); setForm(emptyForm);
        loadCoupons();
      } else {
        const err = await res.json();
        notify('error', err.error ?? 'Error al guardar');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (c: CouponType) => {
    setForm({
      code: c.code, discountType: c.discountType,
      discountValue: String(c.discountValue),
      minPurchase: c.minPurchase ? String(c.minPurchase) : '',
      maxUses: c.maxUses ? String(c.maxUses) : '',
      validFrom: c.validFrom.slice(0, 10),
      validUntil: c.validUntil ? c.validUntil.slice(0, 10) : '',
      isActive: c.isActive,
    });
    setEditing(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cupón?')) return;
    const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    if (res.ok) { notify('success', 'Cupón eliminado'); loadCoupons(); }
    else notify('error', 'Error al eliminar');
  };

  const isExpired = (c: CouponType) => c.validUntil && new Date(c.validUntil) < new Date();
  const isExhausted = (c: CouponType) => c.maxUses !== null && c.usedCount >= (c.maxUses ?? 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Tag className="w-6 h-6 text-cyan" /> Cupones</h1>
          <p className="text-sm text-zinc-400 mt-1">Crea y gestiona códigos de descuento por porcentaje o importe fijo.</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditing(null); setShowForm(true); }} className="flex items-center gap-2 px-3 py-2 bg-cyan text-black rounded-lg text-sm font-semibold hover:bg-cyan-dim transition">
          <Plus className="w-4 h-4" /> Nuevo cupón
        </button>
      </div>

      {feedback && (
        <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {feedback.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {feedback.msg}
        </div>
      )}

      {showForm && (
        <div className="bg-bg-card border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">{editing ? 'Editar cupón' : 'Nuevo cupón'}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Código</label>
              <input type="text" placeholder="SUMMER20" disabled={!!editing}
                value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-cyan disabled:opacity-40 uppercase" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Tipo de descuento</label>
              <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan">
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Importe fijo (€)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Valor {form.discountType === 'percentage' ? '(%)' : '(€)'}</label>
              <input type="number" placeholder={form.discountType === 'percentage' ? '10' : '5'} min="0"
                value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Compra mínima (€)</label>
              <input type="number" placeholder="0 (sin límite)" min="0"
                value={form.minPurchase} onChange={e => setForm(f => ({ ...f, minPurchase: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Usos máximos</label>
              <input type="number" placeholder="Ilimitado" min="1"
                value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Válido desde</label>
              <input type="date" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Válido hasta (opcional)</label>
              <input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan" />
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input type="checkbox" id="couponActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-cyan" />
              <label htmlFor="couponActive" className="text-sm">Activo</label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-cyan text-black rounded-lg text-sm font-semibold hover:bg-cyan-dim transition disabled:opacity-50">
              {saving ? 'Guardando...' : (editing ? 'Actualizar' : 'Crear')}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10 transition">Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-bg-card border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr className="text-zinc-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Código</th>
                <th className="text-left px-4 py-3">Descuento</th>
                <th className="text-right px-4 py-3">Usos</th>
                <th className="text-left px-4 py-3">Válido hasta</th>
                <th className="text-center px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {coupons.map(c => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3 font-mono font-semibold tracking-wide">{c.code}</td>
                  <td className="px-4 py-3">
                    {c.discountType === 'percentage' ? `${c.discountValue}%` : `€${c.discountValue.toFixed(2)}`}
                    {c.minPurchase ? <span className="text-zinc-500 text-xs ml-1">(min €{c.minPurchase})</span> : null}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {c.validUntil ? new Date(c.validUntil).toLocaleDateString('es-ES') : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!c.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700/20 text-zinc-400">Inactivo</span>
                    )}
                    {c.isActive && isExpired(c) && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">Expirado</span>
                    )}
                    {c.isActive && isExhausted(c) && !isExpired(c) && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber/10 text-amber">Agotado</span>
                    )}
                    {c.isActive && !isExpired(c) && !isExhausted(c) && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Activo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(c)} className="p-1.5 rounded-lg hover:bg-white/10 transition text-zinc-400 hover:text-white"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition text-zinc-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500 text-sm">No hay cupones. Crea el primero.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
