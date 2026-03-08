"use client";

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, RefreshCw, CheckCircle, AlertTriangle, Layers } from 'lucide-react';
import type { MaterialType } from '@/lib/types';

const emptyForm = {
  name: '', code: '', pricePerKg: '', maintenanceFactor: '', density: '',
  description: '', color: '#00FFFF', inStock: true,
};

export default function AdminMaterialsClient() {
    // ...existing code...
    const getSaveButtonLabel = () => {
      if (saving) return 'Guardando...';
      if (editing) return 'Actualizar';
      return 'Crear';
    };
  const [materials, setMaterials] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/materials');
      const data = await res.json();
      if (Array.isArray(data)) setMaterials(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMaterials(); }, [loadMaterials]);

  const notify = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editing ? `/api/admin/materials/${editing}` : '/api/admin/materials';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        notify('success', editing ? 'Material actualizado' : 'Material creado');
        setShowForm(false); setEditing(null); setForm(emptyForm);
        loadMaterials();
      } else {
        const err = await res.json();
        notify('error', err.error ?? 'Error al guardar');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (m: MaterialType) => {
    setForm({
      name: m.name, code: m.code,
      pricePerKg: String(m.pricePerKg),
      maintenanceFactor: String(m.maintenanceFactor),
      density: String(m.density),
      description: m.description ?? '',
      color: m.color ?? '#00FFFF',
      inStock: m.inStock,
    });
    setEditing(m.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este material? Se eliminarán sus precios asociados.')) return;
    const res = await fetch(`/api/admin/materials/${id}`, { method: 'DELETE' });
    if (res.ok) { notify('success', 'Material eliminado'); loadMaterials(); }
    else notify('error', 'Error al eliminar');
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await fetch('/api/admin/pricing/recalculate', { method: 'POST' });
      const data = await res.json();
      notify('success', `Precios recalculados: ${data.updated ?? 0} productos actualizados`);
    } catch {
      notify('error', 'Error al recalcular precios');
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Layers className="w-6 h-6 text-cyan" /> Materiales</h1>
          <p className="text-sm text-zinc-400 mt-1">Gestiona los materiales y sus parámetros de coste. Los cambios actualizan los precios automáticamente.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRecalculate} disabled={recalculating} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10 transition disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
            Recalcular precios
          </button>
          <button onClick={() => { setForm(emptyForm); setEditing(null); setShowForm(true); }} className="flex items-center gap-2 px-3 py-2 bg-cyan text-black rounded-lg text-sm font-semibold hover:bg-cyan-dim transition">
            <Plus className="w-4 h-4" /> Nuevo material
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {feedback.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {feedback.msg}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-bg-card border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">{editing ? 'Editar material' : 'Nuevo material'}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'name', label: 'Nombre', placeholder: 'PLA Basic', type: 'text' },
              { key: 'code', label: 'Código', placeholder: 'PLA', type: 'text', disabled: !!editing },
              { key: 'pricePerKg', label: 'Precio/kg (€)', placeholder: '20', type: 'number' },
              { key: 'maintenanceFactor', label: 'Factor mantenimiento (€/h)', placeholder: '0.03', type: 'number' },
              { key: 'density', label: 'Densidad (g/cm³)', placeholder: '1.24', type: 'number' },
              { key: 'description', label: 'Descripción', placeholder: 'Opcional', type: 'text' },
            ].map(({ key, label, placeholder, type, disabled }) => (
              <div key={key}>
                <label className="text-xs text-zinc-400 block mb-1">{label}</label>
                <input type={type} placeholder={placeholder} disabled={disabled}
                  value={form[key as keyof typeof form] as string}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan disabled:opacity-40" />
              </div>
            ))}
            <div>
              <label htmlFor="colorHex" className="text-xs text-zinc-400 block mb-1">Color (hex)</label>
              <div className="flex items-center gap-2">
                <input id="colorHex" type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-10 h-9 rounded cursor-pointer bg-transparent border border-white/10" />
                <input type="text" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-cyan" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input type="checkbox" id="inStock" checked={form.inStock} onChange={e => setForm(f => ({ ...f, inStock: e.target.checked }))} className="accent-cyan" />
              <label htmlFor="inStock" className="text-sm">En stock</label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-cyan text-black rounded-lg text-sm font-semibold hover:bg-cyan-dim transition disabled:opacity-50">
              {getSaveButtonLabel()}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10 transition">Cancelar</button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-bg-card border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr className="text-zinc-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Material</th>
                <th className="text-right px-4 py-3">€/kg</th>
                <th className="text-right px-4 py-3">Factor mant.</th>
                <th className="text-right px-4 py-3">Densidad</th>
                <th className="text-center px-4 py-3">Stock</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {materials.map(m => (
                <tr key={m.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block border border-white/20" style={{ backgroundColor: m.color ?? '#888' }} />
                      <span className="font-semibold">{m.code}</span>
                      <span className="text-zinc-400">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">€{m.pricePerKg.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono">{m.maintenanceFactor.toFixed(3)}</td>
                  <td className="px-4 py-3 text-right font-mono">{m.density}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.inStock ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {m.inStock ? 'Disponible' : 'Sin stock'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(m)} className="p-1.5 rounded-lg hover:bg-white/10 transition text-zinc-400 hover:text-white"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition text-zinc-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {materials.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500 text-sm">No hay materiales. Crea el primero.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
