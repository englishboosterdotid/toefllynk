"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
}

interface ToastContextType {
  toasts: ToastProps[];
  toast: (props: Omit<ToastProps, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const toast = React.useCallback((props: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...props, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({
  toasts,
  dismiss,
}: {
  toasts: ToastProps[];
  dismiss: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            className={cn(
              "relative overflow-hidden rounded-xl border p-4 shadow-lg backdrop-blur-sm",
              "bg-white/95 border-slate-200",
              toast.variant === "success" && "bg-green-50/95 border-green-200",
              toast.variant === "error" && "bg-red-50/95 border-red-200",
              toast.variant === "warning" && "bg-amber-50/95 border-amber-200"
            )}
          >
            <button
              onClick={() => dismiss(toast.id)}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-black/5 transition-colors"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
            <div className="pr-6">
              <p
                className={cn(
                  "text-sm font-semibold text-slate-900",
                  toast.variant === "success" && "text-green-900",
                  toast.variant === "error" && "text-red-900",
                  toast.variant === "warning" && "text-amber-900"
                )}
              >
                {toast.title}
              </p>
              {toast.description && (
                <p
                  className={cn(
                    "mt-1 text-sm text-slate-600",
                    toast.variant === "success" && "text-green-700",
                    toast.variant === "error" && "text-red-700",
                    toast.variant === "warning" && "text-amber-700"
                  )}
                >
                  {toast.description}
                </p>
              )}
            </div>
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-blue-500"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Toaster() {
  return <ToastProvider>{null}</ToastProvider>;
}