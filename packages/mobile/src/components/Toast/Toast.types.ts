export type ToastTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  tone?: ToastTone;
  duration?: number;
}

export interface ToastContextValue {
  show: (opts: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}
