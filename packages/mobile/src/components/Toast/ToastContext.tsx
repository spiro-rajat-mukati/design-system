import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { ToastStack } from "./ToastStack";
import type { ToastContextValue, ToastItem } from "./Toast.types";

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (opts: Omit<ToastItem, "id">): string => {
      const id = `toast-${++counter.current}`;
      const item: ToastItem = { tone: "neutral", duration: 4000, ...opts, id };
      setToasts((prev) => [item, ...prev]);
      if (item.duration && item.duration > 0) {
        timers.current[id] = setTimeout(() => dismiss(id), item.duration);
      }
      return id;
    },
    [dismiss],
  );

  const dismissAll = useCallback(() => {
    Object.values(timers.current).forEach(clearTimeout);
    timers.current = {};
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ show, dismiss, dismissAll }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
