"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";
interface Toast { id: string; type: ToastType; message: string; }
interface ToastContextType { showToast: (type: ToastType, message: string) => void; }

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

const icons = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info };
const colors = { success: "text-green-400 bg-green-400/10 border-green-400/30", error: "text-red-400 bg-red-400/10 border-red-400/30", warning: "text-amber bg-amber/10 border-amber/30", info: "text-cyan bg-cyan/10 border-cyan/30" };

export function Toaster({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev?.filter(t => t?.id !== id) ?? []), 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev?.filter(t => t?.id !== id) ?? []);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {(toasts ?? []).map(toast => {
            const Icon = icons[toast?.type ?? "info"];
            return (
              <motion.div
                key={toast?.id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className={`pointer-events-auto flex items-center gap-3 p-4 rounded-lg border ${colors[toast?.type ?? "info"]} backdrop-blur-md`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm flex-1">{toast?.message ?? ""}</p>
                <button onClick={() => dismiss(toast?.id)} className="opacity-60 hover:opacity-100" aria-label="Cerrar">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
