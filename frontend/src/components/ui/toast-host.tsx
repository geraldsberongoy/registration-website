"use client";

import { useEffect, useMemo, useState } from "react";

type ToastType = "success" | "error";

type ToastPayload = {
  type: ToastType;
  message: string;
};

type ToastItem = ToastPayload & {
  id: number;
};

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<ToastPayload>;
      if (!customEvent.detail?.message) return;

      const id = Date.now() + Math.floor(Math.random() * 1000);
      const nextToast: ToastItem = {
        id,
        type: customEvent.detail.type,
        message: customEvent.detail.message,
      };

      setToasts((prev) => [...prev, nextToast]);

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 2800);
    };

    window.addEventListener("app-toast", handler as EventListener);
    return () => {
      window.removeEventListener("app-toast", handler as EventListener);
    };
  }, []);

  const visibleToasts = useMemo(() => toasts.slice(-4), [toasts]);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
      {visibleToasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border px-4 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-all duration-200 ${
            toast.type === "success"
              ? "border-emerald-400/40 bg-emerald-500/20"
              : "border-red-400/40 bg-red-500/20"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
