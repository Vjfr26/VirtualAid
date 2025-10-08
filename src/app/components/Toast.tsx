"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';

type ToastType = "success" | "error" | "info";
type ToastItem = { id: number; message: string; type: ToastType };

type ToastContextValue = {
  addToast: (message: string, type?: ToastType, durationMs?: number) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const { t } = useTranslation('common');

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "info", durationMs = 3000) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, type }]);
    if (durationMs > 0) {
      setTimeout(() => remove(id), durationMs);
    }
  }, [remove]);

  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Contenedor visual de toasts */}
      <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto max-w-xs sm:max-w-sm px-4 py-3 rounded-lg shadow-lg text-white text-sm transition-opacity ${
              toast.type === "success" ? "bg-green-600" : toast.type === "error" ? "bg-red-600" : "bg-blue-600"
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <span className="flex-1">{toast.message}</span>
              <button
                className="opacity-80 hover:opacity-100"
                onClick={() => remove(toast.id)}
                aria-label={t('toast_close_notification')}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
