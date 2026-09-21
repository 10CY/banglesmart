"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

export type ConfirmTone = "default" | "danger";
export type ToastTone = "success" | "error" | "info";

export type ConfirmOptions = {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

type ConfirmRequest = {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
};

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type FeedbackContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  toast: (message: string, tone?: ToastTone) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setRequest({ options, resolve });
    });
  }, []);

  const closeConfirm = useCallback((value: boolean) => {
    setRequest((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  const toast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = ++toastId.current;
    setToasts((items) => [...items, { id, message, tone }]);

    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  useEffect(() => {
    if (!request) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeConfirm(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [request, closeConfirm]);

  const value = useMemo(() => ({ confirm, toast }), [confirm, toast]);
  const tone = request?.options.tone || "default";

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {request && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#12080b]/55 px-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeConfirm(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="global-confirm-title"
            className="w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_32px_100px_rgba(42,15,22,.28)]"
          >
            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                    tone === "danger"
                      ? "bg-red-50 text-red-600"
                      : "bg-[#fbf4e6] text-[#9b7418]"
                  }`}
                >
                  <AlertTriangle size={21} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-[#b4923e]">
                        Confirmation
                      </p>
                      <h2 id="global-confirm-title" className="mt-2 text-xl font-semibold text-[#21191b]">
                        {request.options.title || "Confirm action"}
                      </h2>
                    </div>

                    <button
                      type="button"
                      aria-label="Close confirmation"
                      onClick={() => closeConfirm(false)}
                      className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-600">
                    {request.options.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-[#fcfaf7] px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                {request.options.cancelLabel || "Cancel"}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => closeConfirm(true)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
                  tone === "danger"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#650b12] hover:bg-[#7b0d17]"
                }`}
              >
                {request.options.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed right-4 top-20 z-[110] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((item) => {
          const Icon = item.tone === "success" ? CheckCircle2 : item.tone === "error" ? XCircle : Info;
          const classes =
            item.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : item.tone === "error"
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-blue-200 bg-blue-50 text-blue-900";

          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-[0_16px_50px_rgba(17,24,39,.13)] ${classes}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1 text-sm font-medium leading-5">{item.message}</p>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => setToasts((items) => items.filter((toastItem) => toastItem.id !== item.id))}
                className="rounded-md p-0.5 opacity-60 transition hover:opacity-100"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used inside FeedbackProvider.");
  }
  return context;
}
