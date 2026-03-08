'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, DollarSign, Percent, Package, Save } from 'lucide-react';
import { useToast } from '@/components/toast-provider';
import { MATERIAL_INFO } from '@/lib/price-calculator';
export default function AdminSettingsPage() {
    const { showToast } = useToast();
    const [settings, setSettings] = useState({
        pla: { pricePerGram: '0.02', density: '1.24' },
        petg: { pricePerGram: '0.025', density: '1.27' },
        taxRate: '21',
        freeShippingThreshold: '50',
        shippingCost: '4.95',
        pointsPerEuro: '1',
        pointsValue: '0.05',
    });
    const [saving, setSaving] = useState(false);
    const handleSave = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        showToast('success', 'Configuración guardada');
        setSaving(false);
    };
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configuración</h1>
        <p className="text-muted">Ajusta los parámetros de tu tienda</p>
      </div>

      <div className="grid gap-6">
        {/* Materials */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-bg-secondary border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-cyan/20 rounded-lg">
              <Package className="w-6 h-6 text-cyan"/>
            </div>
            <div>
              <h2 className="text-xl font-bold">Materiales</h2>
              <p className="text-sm text-muted">Precios y densidades por material</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-cyan">PLA</h3>
              <div>
                <label htmlFor="pla-pricePerGram" className="block text-sm text-muted mb-1">Precio por Gramo (€)</label>
                <input id="pla-pricePerGram" type="number" step="0.001" value={settings.pla.pricePerGram} onChange={(e) => setSettings({ ...settings, pla: { ...settings.pla, pricePerGram: e.target.value } })} className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"/>
              </div>
              <div>
                <label htmlFor="pla-density" className="block text-sm text-muted mb-1">Densidad (g/cm³)</label>
                <input id="pla-density" type="number" step="0.01" value={settings.pla.density} onChange={(e) => setSettings({ ...settings, pla: { ...settings.pla, density: e.target.value } })} className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"/>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-amber">PETG</h3>
              <div>
                <label htmlFor="petg-pricePerGram" className="block text-sm text-muted mb-1">Precio por Gramo (€)</label>
                <input id="petg-pricePerGram" type="number" step="0.001" value={settings.petg.pricePerGram} onChange={(e) => setSettings({ ...settings, petg: { ...settings.petg, pricePerGram: e.target.value } })} className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"/>
              </div>
              <div>
                <label htmlFor="petg-density" className="block text-sm text-muted mb-1">Densidad (g/cm³)</label>
                <input id="petg-density" type="number" step="0.01" value={settings.petg.density} onChange={(e) => setSettings({ ...settings, petg: { ...settings.petg, density: e.target.value } })} className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"/>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Technical specs (solo para administrador) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-bg-secondary border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-bg-tertiary rounded-lg">
              <Settings className="w-6 h-6 text-muted"/>
            </div>
            <div>
              <h2 className="text-xl font-bold">Ficha técnica de materiales</h2>
              <p className="text-sm text-muted">
                Propiedades avanzadas visibles solo en el panel de administración.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-bg-tertiary/60">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted">Propiedad</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-cyan">
                    PLA
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-amber">
                    PETG
                  </th>
                </tr>
              </thead>
              <tbody>
                {MATERIAL_INFO.PLA.properties.map((prop, index) => (<tr key={prop.name} className="border-t border-border/60">
                    <td className="px-4 py-2 text-muted">{prop.name}</td>
                    <td className="px-4 py-2 text-center">
                      {prop.value}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {MATERIAL_INFO.PETG.properties[index]?.value ?? ''}
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-bg-secondary border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-amber"/>
            </div>
            <div>
              <h2 className="text-xl font-bold">Precios y Envío</h2>
              <p className="text-sm text-muted">Impuestos y costos de envío</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="taxRate" className="block text-sm text-muted mb-1">IVA (%)</label>
              <input id="taxRate" type="number" value={settings.taxRate} onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })} className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"/>
            </div>
            <div>
              <label htmlFor="freeShippingThreshold" className="block text-sm text-muted mb-1">Envío Gratis desde (€)</label>
              <input id="freeShippingThreshold" type="number" value={settings.freeShippingThreshold} onChange={(e) => setSettings({ ...settings, freeShippingThreshold: e.target.value })} className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"/>
            </div>
            <div>
              <label htmlFor="shippingCost" className="block text-sm text-muted mb-1">Costo de Envío (€)</label>
              <input id="shippingCost" type="number" step="0.01" value={settings.shippingCost} onChange={(e) => setSettings({ ...settings, shippingCost: e.target.value })} className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"/>
            </div>
          </div>
        </motion.div>

        {/* Loyalty */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-bg-secondary border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-cyan/20 rounded-lg">
              <Percent className="w-6 h-6 text-cyan"/>
            </div>
            <div>
              <h2 className="text-xl font-bold">Programa de Fidelidad</h2>
              <p className="text-sm text-muted">Configuración de puntos</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pointsPerEuro" className="block text-sm text-muted mb-1">Puntos por Euro Gastado</label>
              <input id="pointsPerEuro" type="number" value={settings.pointsPerEuro} onChange={(e) => setSettings({ ...settings, pointsPerEuro: e.target.value })} className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"/>
            </div>
            <div>
              <label htmlFor="pointsValue" className="block text-sm text-muted mb-1">Valor por Punto (€)</label>
              <input id="pointsValue" type="number" step="0.01" value={settings.pointsValue} onChange={(e) => setSettings({ ...settings, pointsValue: e.target.value })} className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"/>
            </div>
          </div>
          <p className="text-sm text-muted mt-4">
            Con esta configuración: 100 puntos = €{(100 * Number.parseFloat(settings.pointsValue || '0')).toFixed(2)} de descuento
          </p>
        </motion.div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-cyan text-black font-medium rounded-lg hover:bg-cyan-dark transition-colors disabled:opacity-50">
          {saving ? (<div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"/>) : (<Save className="w-5 h-5"/>)}
          Guardar Cambios
        </button>
      </div>
    </div>);
}
