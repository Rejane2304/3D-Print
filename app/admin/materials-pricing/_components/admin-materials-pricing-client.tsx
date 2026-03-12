"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Settings,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { useToast } from "@/components/toast-provider";
import dynamic from "next/dynamic";
import { calculatePriceFromDimensions } from "@/lib/price-calculator";
import type { MaterialType } from "@/lib/types";

const MaterialColorsManager = dynamic(
  () => import("../../materials/_components/material-colors-manager"),
  { ssr: false }
);

interface PricingConfig {
  id: string;
  machineAmortizationPerHour: number;
  operationCostPerHour: number;
  consumablesCostPerHour: number;
  marginUnit: number;
  marginMedium: number;
  marginBulk: number;
  updatedAt: string;
}

const emptyMaterial: Omit<MaterialType, "id" | "createdAt" | "updatedAt"> = {
  name: "",
  code: "",
  pricePerKg: 0,
  maintenanceFactor: 0,
  density: 0,
  description: "",
  color: "#00FFFF",
  inStock: true,
};

export default function AdminMaterialsPricingClient() {
  const { showToast } = useToast();

  // Estado materiales
  const [materials, setMaterials] = useState<MaterialType[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [materialForm, setMaterialForm] = useState<typeof emptyMaterial>(emptyMaterial);

  const [savingMaterial, setSavingMaterial] = useState(false);

  // Estado configuración de precios
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  // Estado simulador
  const [simMaterialCode, setSimMaterialCode] = useState<string>("");
  const [simDimX, setSimDimX] = useState<number>(5);
  const [simDimY, setSimDimY] = useState<number>(5);
  const [simDimZ, setSimDimZ] = useState<number>(5);
  const [simQty, setSimQty] = useState<number>(1);
  const [simPrintTime, setSimPrintTime] = useState<number>(60);
  const [simFinishCost, setSimFinishCost] = useState<number>(2.5);

  // Estado recalculador
  const [recalculating, setRecalculating] = useState(false);
  const [recalcResult, setRecalcResult] = useState<string | null>(null);

  // Cargar materiales
  const loadMaterials = useCallback(async () => {
    setLoadingMaterials(true);
    try {
      const res = await fetch("/api/admin/materials");
      const data = await res.json();
      if (Array.isArray(data)) setMaterials(data);
    } finally {
      setLoadingMaterials(false);
    }
  }, []);

  // Cargar configuración de precios
  const loadConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch("/api/admin/pricing");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    loadMaterials();
    loadConfig();
  }, [loadMaterials, loadConfig]);

  // Guardar material (crear o editar)
  const handleSaveMaterial = async () => {
    setSavingMaterial(true);
    try {
      const url = editingId ? `/api/admin/materials/${editingId}` : "/api/admin/materials";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(materialForm),
      });
      if (res.ok) {
        showToast("success", editingId ? "Material actualizado" : "Material creado");
        setMaterialForm(emptyMaterial);
        setEditingId(null);
        loadMaterials();
      } else {
        showToast("error", "Error al guardar material");
      }
    } finally {
      setSavingMaterial(false);
    }
  };

  // Editar material
  const handleEditMaterial = (mat: MaterialType) => {
    setEditingId(mat.id);
    setMaterialForm({
      name: mat.name,
      code: mat.code,
      pricePerKg: mat.pricePerKg,
      maintenanceFactor: mat.maintenanceFactor,
      density: mat.density,
      description: mat.description ?? "",
      color: mat.color ?? "#00FFFF",
      inStock: mat.inStock,
    });
  };

  // Eliminar material
  const handleDeleteMaterial = async (id: string) => {
    if (!confirm("¿Eliminar este material?")) return;
    const res = await fetch(`/api/admin/materials/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("success", "Material eliminado");
      loadMaterials();
    } else {
      showToast("error", "Error al eliminar material");
    }
  };

  // Guardar configuración de precios
  const handleSaveConfig = async () => {
    if (!config) return;
    setSavingConfig(true);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        showToast("success", "Configuración guardada");
        loadConfig();
      } else {
        showToast("error", "Error al guardar configuración");
      }
    } finally {
      setSavingConfig(false);
    }
  };

  // Actualizar material seleccionado en simulador al cargar materiales
  useEffect(() => {
    if (materials.length > 0 && !simMaterialCode) {
      setSimMaterialCode(materials[0].code);
    }
  }, [materials, simMaterialCode]);

  // Handler recalcular precios
  const handleRecalculate = async () => {
    setRecalculating(true);
    setRecalcResult(null);
    try {
      const res = await fetch("/api/admin/pricing/recalculate", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        const msg = `${data.updated ?? 0} productos recalculados`;
        setRecalcResult(msg);
        showToast("success", msg);
      } else {
        showToast("error", "Error al recalcular precios");
      }
    } catch {
      showToast("error", "Error de conexión al recalcular");
    } finally {
      setRecalculating(false);
    }
  };

  // Simulación de precio
  const simMaterial = materials.find((m) => m.code === simMaterialCode);
  const simResult = simMaterial
    ? calculatePriceFromDimensions(
        simDimX * 10,
        simDimY * 10,
        simDimZ * 10,
        simPrintTime,
        {
          pricePerKg: simMaterial.pricePerKg,
          density: simMaterial.density,
          maintenanceFactor: simMaterial.maintenanceFactor,
        },
        {
          quantity: simQty,
          finishCost: simFinishCost,
        }
      )
    : null;

  // Renderizado
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header principal */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <DollarSign className="w-7 h-7 text-cyan" />
          Gestión de materiales y precios
        </h1>
        <p className="text-muted text-sm">
          Administra materiales, factores de coste, márgenes y simulador de precios desde una sola
          vista.
        </p>
      </div>

      {/* Sección: Configuración de precios */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-bg-secondary border border-border rounded-xl p-6"
      >
        <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-cyan" /> Motor de costes y márgenes
        </h2>
        {loadingConfig || !config ? (
          <div className="py-6 text-center text-muted">Cargando configuración...</div>
        ) : (
          <form
            className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end"
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveConfig();
            }}
          >
            <div>
              <label className="block text-xs mb-1" htmlFor="machineAmortizationPerHour">
                Amortización máquina €/h
              </label>
              <input
                id="machineAmortizationPerHour"
                type="number"
                step="0.01"
                className="input"
                value={config.machineAmortizationPerHour}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    machineAmortizationPerHour: Number.parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs mb-1" htmlFor="operationCostPerHour">
                Electricidad €/h
              </label>
              <input
                id="operationCostPerHour"
                type="number"
                step="0.01"
                className="input"
                value={config.operationCostPerHour}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    operationCostPerHour: Number.parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs mb-1" htmlFor="consumablesCostPerHour">
                Consumibles €/h
              </label>
              <input
                id="consumablesCostPerHour"
                type="number"
                step="0.01"
                className="input"
                value={config.consumablesCostPerHour}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    consumablesCostPerHour: Number.parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs mb-1" htmlFor="marginUnit">
                Margen 1-4ud
              </label>
              <input
                id="marginUnit"
                type="number"
                step="0.01"
                className="input"
                value={config.marginUnit}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    marginUnit: Number.parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs mb-1" htmlFor="marginMedium">
                Margen 5-9ud
              </label>
              <input
                id="marginMedium"
                type="number"
                step="0.01"
                className="input"
                value={config.marginMedium}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    marginMedium: Number.parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs mb-1" htmlFor="marginBulk">
                Margen 10+ud
              </label>
              <input
                id="marginBulk"
                type="number"
                step="0.01"
                className="input"
                value={config.marginBulk}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    marginBulk: Number.parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <button
              type="submit"
              className="btn btn-cyan col-span-2 md:col-span-1 flex items-center gap-2"
              disabled={savingConfig}
            >
              <Save className="w-4 h-4" />
              {savingConfig ? "Guardando..." : "Guardar configuración"}
            </button>
          </form>
        )}
      </motion.div>

      {/* Sección: Tabla de materiales con gestión de colores expandible */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-bg-secondary border border-border rounded-xl p-6"
      >
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-cyan" /> Materiales
        </h2>
        {loadingMaterials ? (
          <div className="py-6 text-center text-muted">Cargando materiales...</div>
        ) : (
          <>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="text-left text-xs text-muted border-b">
                  <th>Nombre</th>
                  <th>Código</th>
                  <th>€/kg</th>
                  <th>Densidad</th>
                  <th>Mantenimiento</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {materials.map((mat) => (
                  <ExpandableMaterialRow
                    key={mat.id}
                    material={mat}
                    onEdit={handleEditMaterial}
                    onDelete={handleDeleteMaterial}
                  />
                ))}
              </tbody>
            </table>
            {/* Formulario crear/editar material */}
            <form
              className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveMaterial();
              }}
            >
              <input
                type="text"
                className="input"
                placeholder="Nombre"
                value={materialForm.name}
                onChange={(e) => setMaterialForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                type="text"
                className="input"
                placeholder="Código"
                value={materialForm.code}
                onChange={(e) => setMaterialForm((f) => ({ ...f, code: e.target.value }))}
                required
              />
              <input
                type="number"
                step="0.01"
                className="input"
                placeholder="€/kg"
                value={materialForm.pricePerKg}
                onChange={(e) =>
                  setMaterialForm((f) => ({
                    ...f,
                    pricePerKg: Number.parseFloat(e.target.value),
                  }))
                }
                required
              />
              <input
                type="number"
                step="0.01"
                className="input"
                placeholder="Densidad"
                value={materialForm.density}
                onChange={(e) =>
                  setMaterialForm((f) => ({
                    ...f,
                    density: Number.parseFloat(e.target.value),
                  }))
                }
                required
              />
              <input
                type="number"
                step="0.01"
                className="input"
                placeholder="Mantenimiento"
                value={materialForm.maintenanceFactor}
                onChange={(e) =>
                  setMaterialForm((f) => ({
                    ...f,
                    maintenanceFactor: Number.parseFloat(e.target.value),
                  }))
                }
                required
              />
              <input
                type="text"
                className="input"
                placeholder="Descripción"
                value={materialForm.description ?? ""}
                onChange={(e) =>
                  setMaterialForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={materialForm.inStock}
                  onChange={(e) =>
                    setMaterialForm((f) => ({
                      ...f,
                      inStock: e.target.checked,
                    }))
                  }
                />{' '}
                Stock
              </label>
              <button
                type="submit"
                className="btn btn-cyan flex items-center gap-2"
                disabled={savingMaterial}
              >
                <Save className="w-4 h-4" />
                {(() => {
                  if (savingMaterial) return "Guardando...";
                  if (editingId) return "Actualizar";
                  return "Crear";
                })()}
              </button>
            </form>
          </>
        )}
      </motion.div>

      {/* Sección: Simulador de precios y recalculador */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-bg-secondary border border-border rounded-xl p-6"
      >
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <RefreshCw className="w-5 h-5 text-cyan" />
          Simulador de precio y recalculador
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs mb-1" htmlFor="simMaterial">
              Material
            </label>
            <select
              className="input"
              value={simMaterialCode}
              onChange={(e) => setSimMaterialCode(e.target.value)}
            >
              {materials.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" htmlFor="simDimX">
              Dim X (cm)
            </label>
            <input
              type="number"
              className="input"
              value={simDimX}
              min={1}
              max={100}
              onChange={(e) => setSimDimX(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" htmlFor="simDimY">
              Dim Y (cm)
            </label>
            <input
              type="number"
              className="input"
              value={simDimY}
              min={1}
              max={100}
              onChange={(e) => setSimDimY(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" htmlFor="simDimZ">
              Dim Z (cm)
            </label>
            <input
              type="number"
              className="input"
              value={simDimZ}
              min={1}
              max={100}
              onChange={(e) => setSimDimZ(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" htmlFor="simQty">
              Cantidad
            </label>
            <input
              type="number"
              className="input"
              value={simQty}
              min={1}
              max={100}
              onChange={(e) => setSimQty(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" htmlFor="simPrintTime">
              Tiempo impresión (min)
            </label>
            <input
              type="number"
              className="input"
              value={simPrintTime}
              min={1}
              max={10000}
              onChange={(e) => setSimPrintTime(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" htmlFor="simFinishCost">
              Coste acabado (€)
            </label>
            <input
              type="number"
              className="input"
              value={simFinishCost}
              min={0}
              step={0.01}
              onChange={(e) => setSimFinishCost(Number(e.target.value))}
            />
          </div>
        </div>
        {simResult && (
          <div className="mb-4">
            <div className="font-semibold mb-2">Desglose estimado:</div>
            <ul className="text-xs grid grid-cols-2 md:grid-cols-4 gap-2">
              <li>
                Material: <span className="font-mono">{simResult.materialCost.toFixed(2)} €</span>
              </li>
              <li>
                Máquina: <span className="font-mono">{simResult.machineCost.toFixed(2)} €</span>
              </li>
              <li>
                Mantenimiento: <span className="font-mono">{simResult.maintenanceCost.toFixed(2)} €</span>
              </li>
              <li>
                Electricidad: <span className="font-mono">{simResult.operationCost.toFixed(2)} €</span>
              </li>
              <li>
                Consumibles: <span className="font-mono">{simResult.consumablesCost.toFixed(2)} €</span>
              </li>
              <li>
                Acabado: <span className="font-mono">{simResult.finishCost.toFixed(2)} €</span>
              </li>
              <li className="col-span-2 md:col-span-4 font-bold">
                Precio final: <span className="font-mono text-cyan">{simResult.finalPrice.toFixed(2)} €</span>
              </li>
            </ul>
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-4 items-center mt-4">
          <button
            className="btn btn-outline flex items-center gap-2"
            onClick={handleRecalculate}
            disabled={recalculating}
          >
            <RefreshCw className="w-5 h-5" />{" "}
            {recalculating ? "Recalculando..." : "Recalcular todos los precios"}
          </button>
          {recalcResult && <span className="text-green-600 text-xs">{recalcResult}</span>}
        </div>
      </motion.div>
    </div>
  );
}

// Fila de material con sección expandible para gestión de colores
function ExpandableMaterialRow({
  material,
  onEdit,
  onDelete,
}: Readonly<{
  material: MaterialType;
  onEdit: (mat: MaterialType) => void;
  onDelete: (id: string) => void;
}>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="border-b last:border-0">
        <td className="cursor-pointer" onClick={() => setOpen((o) => !o)}>
          <span className="underline decoration-dotted">{material.name}</span>
        </td>
        <td>{material.code}</td>
        <td>{material.pricePerKg}</td>
        <td>{material.density}</td>
        <td>{material.maintenanceFactor}</td>
        <td>
          {material.inStock ? (
            <CheckCircle className="text-green-500 w-4 h-4" />
          ) : (
            <AlertTriangle className="text-yellow-500 w-4 h-4" />
          )}
        </td>
        <td className="flex gap-2">
          <button className="btn btn-xs btn-outline" onClick={() => onEdit(material)}>
            <Edit className="w-4 h-4" />
          </button>
          <button className="btn btn-xs btn-outline" onClick={() => onDelete(material.id)}>
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      </tr>
      {open && (
        <tr className="bg-bg-tertiary">
          <td colSpan={7} className="p-4 border-b">
            <div className="mb-2 font-semibold flex items-center gap-2">
              <span className="text-cyan">Colores y stock para {material.name}</span>
            </div>
            <MaterialColorsManager materialId={material.id} />
          </td>
        </tr>
      )}
    </>
  );
}
