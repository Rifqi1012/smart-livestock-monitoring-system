"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

type ToastType = "success" | "error";
type Toast = { id: number; type: ToastType; message: string };

const ToastCtx = createContext<{ toast: (message: string, type?: ToastType) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = ++idRef.current;
      setToasts((t) => [...t, { id, type, message }]);
      setTimeout(() => remove(id), 3500);
    },
    [remove],
  );

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => {
          const ok = t.type === "success";
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-lg"
              role="status"
            >
              {ok ? (
                <CheckCircle2 size={20} className="shrink-0 text-[#10B981]" aria-hidden />
              ) : (
                <XCircle size={20} className="shrink-0 text-[#EF4444]" aria-hidden />
              )}
              <span className="flex-1 text-sm text-[#1F2937]">{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                aria-label="Tutup"
                className="shrink-0 text-[#9CA3AF] hover:text-[#6B7280]"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
