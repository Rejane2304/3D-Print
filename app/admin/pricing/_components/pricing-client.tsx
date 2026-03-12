"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
// Componente eliminado. Usar AdminMaterialsPricingClient
                  type="number"
                  step="0.001"
                  value={config?.machineAmortizationPerHour ?? 0}
                  onChange={(e) =>
                    setConfig((prev) =>
                      prev
                        ? {
                            ...prev,
                            machineAmortizationPerHour:
                              Number.parseFloat(e.target.value) || 0,
                          }
                        : prev,
                    )
                  }
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="motor-electricity"
                  className="text-xs text-muted block mb-1"
                >
                  Electricidad (€/hora)
                </label>
                <input
                  id="motor-electricity"
                  type="number"
                  step="0.001"
                  value={config?.operationCostPerHour ?? 0}
                  onChange={(e) =>
                    setConfig((prev) =>
                      prev
                        ? {
                            ...prev,
                            operationCostPerHour:
                              Number.parseFloat(e.target.value) || 0,
                          }
                        : prev,
                    )
                  }
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="motor-consumables"
                  className="text-xs text-muted block mb-1"
                >
                  Consumibles (€/hora)
                </label>
                <input
                  id="motor-consumables"
                  type="number"
                  step="0.001"
                  value={config?.consumablesCostPerHour ?? 0}
                  onChange={(e) =>
                    setConfig((prev) =>
                      prev
                        ? {
                            ...prev,
                            consumablesCostPerHour:
                              Number.parseFloat(e.target.value) || 0,
                          }
                        : prev,
                    )
                  }
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                />
              </div>
            </div>
          </motion.div>

          {/* ---- Section 2: Márgenes ---- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-bg-secondary border border-border rounded-xl p-6"
          >
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-cyan" />
              Márgenes de venta por volumen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="margin-unit"
                  className="text-xs text-muted block mb-1"
                >
                  1–4 unidades (×N)
                </label>
                <input
                  id="margin-unit"
                  type="number"
                  step="0.1"
                  value={config?.marginUnit ?? 1}
                  onChange={(e) =>
                    setConfig((prev) =>
                      prev
                        ? {
                            ...prev,
                            marginUnit: Number.parseFloat(e.target.value) || 1,
                          }
                        : prev,
                    )
                  }
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                />
                <p className="text-xs text-muted mt-1">
                  Margen efectivo:{" "}
                  <span className="text-cyan font-mono">
                    {marginPct(config?.marginUnit ?? 1)}
                  </span>
                </p>
              </div>
              <div>
                <label
                  htmlFor="margin-medium"
                  className="text-xs text-muted block mb-1"
                >
                  5–9 unidades (×N)
                </label>
                <input
                  id="margin-medium"
                  type="number"
                  step="0.1"
                  value={config?.marginMedium ?? 1}
                  onChange={(e) =>
                    setConfig((prev) =>
                      prev
                        ? {
                            ...prev,
                            marginMedium:
                              Number.parseFloat(e.target.value) || 1,
                          }
                        : prev,
                    )
                  }
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                />
                <p className="text-xs text-muted mt-1">
                  Margen efectivo:{" "}
                  <span className="text-cyan font-mono">
                    {marginPct(config?.marginMedium ?? 1)}
                  </span>
                </p>
              </div>
              <div>
                <label
                  htmlFor="margin-bulk"
                  className="text-xs text-muted block mb-1"
                >
                  10+ unidades (×N)
                </label>
                <input
                  id="margin-bulk"
                  type="number"
                  step="0.1"
                  value={config?.marginBulk ?? 1}
                  onChange={(e) =>
                    setConfig((prev) =>
                      prev
                        ? {
                            ...prev,
                            marginBulk: Number.parseFloat(e.target.value) || 1,
                          }
                        : prev,
                    )
                  }
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                />
                <p className="text-xs text-muted mt-1">
                  Margen efectivo:{" "}
                  <span className="text-cyan font-mono">
                    {marginPct(config?.marginBulk ?? 1)}
                  </span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* ---- Section 3: Materiales ---- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-bg-secondary border border-border rounded-xl p-6"
          >
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-cyan" />
              Precios de filamento (€/kg)
            </h2>

            {materials.length === 0 ? (
              <p className="text-muted text-sm py-4">
                No hay materiales. Crea materiales desde la sección de
                Materiales.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted text-xs uppercase tracking-wide border-b border-border">
                      <th className="text-left py-3 px-2">Código</th>
                      <th className="text-left py-3 px-2">Nombre</th>
                      <th className="text-right py-3 px-2">€/kg</th>
                      <th className="text-right py-3 px-2">Densidad</th>
                      <th className="text-right py-3 px-2">Factor mant.</th>
                      <th className="py-3 px-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {materials.map((m) => {
                      const edit = matEdits[m.id];
                      if (!edit) return null;
                      const savingLabel = edit.saving
                        ? "Guardando..."
                        : "Guardar";
                      return (
                        <tr
                          key={m.id}
                          className="hover:bg-white/[0.02] transition"
                        >
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full inline-block border border-white/20 flex-shrink-0"
                                style={{ backgroundColor: m.color ?? "#888" }}
                              />
                              <span className="font-mono font-semibold">
                                {m.code}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-muted">{m.name}</td>
                          <td className="py-3 px-2">
                            <input
                              type="number"
                              step="0.01"
                              value={edit.pricePerKg}
                              onChange={(e) =>
                                setMatEdits((prev) => ({
                                  ...prev,
                                  [m.id]: {
                                    ...prev[m.id],
                                    pricePerKg: e.target.value,
                                  },
                                }))
                              }
                              className="w-24 px-2 py-1 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm text-right font-mono"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="number"
                              step="0.001"
                              value={edit.density}
                              onChange={(e) =>
                                setMatEdits((prev) => ({
                                  ...prev,
                                  [m.id]: {
                                    ...prev[m.id],
                                    density: e.target.value,
                                  },
                                }))
                              }
                              className="w-24 px-2 py-1 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm text-right font-mono"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="number"
                              step="0.001"
                              value={edit.maintenanceFactor}
                              onChange={(e) =>
                                setMatEdits((prev) => ({
                                  ...prev,
                                  [m.id]: {
                                    ...prev[m.id],
                                    maintenanceFactor: e.target.value,
                                  },
                                }))
                              }
                              className="w-24 px-2 py-1 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm text-right font-mono"
                            />
                          </td>
                          <td className="py-3 px-2 text-right">
                            <button
                              onClick={() => handleSaveMaterial(m.id)}
                              disabled={edit.saving}
                              className="flex items-center gap-1 px-3 py-1.5 bg-cyan text-black text-xs font-medium rounded-lg hover:bg-cyan-dark transition-colors disabled:opacity-50 ml-auto"
                            >
                              <Save className="w-3 h-3" />
                              {savingLabel}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* ---- Section 4: Simulador ---- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-bg-secondary border border-border rounded-xl p-6"
          >
            <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
              <Calculator className="w-5 h-5 text-cyan" />
              Simulador de precio
            </h2>
            <p className="text-muted text-xs mb-4 flex items-center gap-1">
              <Info className="w-3 h-3 flex-shrink-0" />
              Usa los valores del código: amort. €
              {PRICING_CONFIG.machineAmortizationPerHour}/h · electricidad €
              {PRICING_CONFIG.operationCostPerHour}/h · consumibles €
              {PRICING_CONFIG.consumablesCostPerHour}/h
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label
                  htmlFor="sim-material"
                  className="text-xs text-muted block mb-1"
                >
                  Material
                </label>
                <select
                  id="sim-material"
                  value={simMaterialCode}
                  onChange={(e) => setSimMaterialCode(e.target.value)}
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                >
                  {materials.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.code} — {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="sim-dimx"
                  className="text-xs text-muted block mb-1"
                >
                  Dim X (cm)
                </label>
                <input
                  id="sim-dimx"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={simDimX}
                  onChange={(e) =>
                    setSimDimX(Number.parseFloat(e.target.value) || 1)
                  }
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="sim-dimy"
                  className="text-xs text-muted block mb-1"
                >
                  Dim Y (cm)
                </label>
                <input
                  id="sim-dimy"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={simDimY}
                  onChange={(e) =>
                    setSimDimY(Number.parseFloat(e.target.value) || 1)
                  }
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="sim-dimz"
                  className="text-xs text-muted block mb-1"
                >
                  Dim Z (cm)
                </label>
                <input
                  id="sim-dimz"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={simDimZ}
                  onChange={(e) =>
                    setSimDimZ(Number.parseFloat(e.target.value) || 1)
                  }
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="sim-qty"
                  className="text-xs text-muted block mb-1"
                >
                  Cantidad (1–20)
                </label>
                <input
                  id="sim-qty"
                  type="number"
                  step="1"
                  min="1"
                  max="20"
                  value={simQty}
                  onChange={(e) =>
                    setSimQty(Number.parseInt(e.target.value, 10) || 1)
                  }
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="sim-printtime"
                  className="text-xs text-muted block mb-1"
                >
                  Tiempo de impresión (min)
                </label>
                <input
                  id="sim-printtime"
                  type="number"
                  step="1"
                  min="1"
                  value={simPrintTime}
                  onChange={(e) =>
                    setSimPrintTime(Number.parseInt(e.target.value, 10) || 1)
                  }
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="sim-finishcost"
                  className="text-xs text-muted block mb-1"
                >
                  Acabado / manipulación (€)
                </label>
                <input
                  id="sim-finishcost"
                  type="number"
                  step="0.1"
                  min="0"
                  value={simFinishCost}
                  onChange={(e) =>
                    setSimFinishCost(Number.parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                />
              </div>
            </div>

            {simResult ? (
              <div className="space-y-4">
                {/* Main price cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-bg-tertiary rounded-xl p-4 text-center">
                    <p className="text-xs text-muted mb-1">Peso estimado</p>
                    <p className="text-2xl font-bold font-mono">
                      {simResult.weight} g
                    </p>
                  </div>
                  <div className="bg-bg-tertiary rounded-xl p-4 text-center">
                    <p className="text-xs text-muted mb-1">Coste base</p>
                    <p className="text-2xl font-bold font-mono flex items-center justify-center gap-1">
                      <Euro className="w-5 h-5" />
                      {simResult.baseCost.toFixed(3)}
                    </p>
                  </div>
                  <div className="bg-cyan/10 border border-cyan/30 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted mb-1">
                      Precio final × {simQty} ud.
                    </p>
                    <p className="text-2xl font-bold font-mono text-cyan flex items-center justify-center gap-1">
                      <Euro className="w-5 h-5" />
                      {(simResult.finalPrice * simQty).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="bg-bg-tertiary rounded-xl p-4">
                  <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-3">
                    Desglose de costes
                  </p>
                  <div className="space-y-2">
                    {breakdownRows.map((row) => (
                      <div
                        key={row.label}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-muted">{row.label}</span>
                        <span className="font-mono">
                          €{row.value.toFixed(3)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                      <span>Coste total</span>
                      <span className="font-mono">
                        €
                        {(simResult.baseCost + simResult.finishCost).toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Material info from MATERIAL_INFO (if available) */}
                {simMaterialInfo && (
                  <p className="text-xs text-muted">
                    <span className="font-semibold">
                      {simMaterialInfo.label}:
                    </span>{" "}
                    {simMaterialInfo.uses}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted text-sm py-4">
                Selecciona un material para ver la simulación.
              </p>
            )}
          </motion.div>

          {/* ---- Footer: Guardar configuración + Recalcular ---- */}
          <div className="flex flex-wrap items-center gap-4 pb-6">
            <button
              onClick={handleSaveConfig}
              disabled={configSaving || !config}
              className="flex items-center gap-2 px-6 py-3 bg-cyan text-black font-medium rounded-lg hover:bg-cyan-dark transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saveConfigLabel}
            </button>
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="flex items-center gap-2 px-6 py-3 bg-bg-tertiary border border-border text-white font-medium rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={recalculating ? "w-4 h-4 animate-spin" : "w-4 h-4"}
              />
              {recalcLabel}
            </button>
            {recalcResult && (
              <span className="text-sm text-green-400">{recalcResult}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
