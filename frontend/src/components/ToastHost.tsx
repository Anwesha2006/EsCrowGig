import { X } from "lucide-react";
import { useToast } from "../hooks/useToast";

const colors = {
  success: "border-emerald-200 bg-emerald-50",
  error: "border-red-200 bg-red-50",
  info: "border-slate-200 bg-white"
};

export const ToastHost = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(92vw,380px)] flex-col gap-3">
      {toasts.map((toast) => (
        <div key={toast.id} className={`rounded-md border p-4 shadow-soft ${colors[toast.type]}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink">{toast.title}</p>
              {toast.message ? <p className="mt-1 text-sm text-slate-600">{toast.message}</p> : null}
            </div>
            <button aria-label="Dismiss toast" onClick={() => removeToast(toast.id)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

