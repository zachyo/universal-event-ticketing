import toast from "react-hot-toast";
import type { ToastOptions } from "react-hot-toast";
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from "lucide-react";

/**
 * Default toast options
 */
const defaultOptions: ToastOptions = {
  duration: 4000,
  position: "top-right",
  style: {
    background: "#fff",
    color: "#333",
    borderRadius: "8px",
    padding: "16px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  },
};

/**
 * Success toast
 */
export function toastSuccess(message: string, options?: ToastOptions) {
  return toast.success(message, {
    ...defaultOptions,
    ...options,
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    style: {
      ...defaultOptions.style,
      ...options?.style,
      borderLeft: "4px solid #22c55e",
    },
  });
}

/**
 * Error toast
 */
export function toastError(message: string, options?: ToastOptions) {
  return toast.error(message, {
    ...defaultOptions,
    duration: 6000, // Errors stay longer
    ...options,
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    style: {
      ...defaultOptions.style,
      ...options?.style,
      borderLeft: "4px solid #ef4444",
    },
  });
}

/**
 * Warning toast
 */
export function toastWarning(message: string, options?: ToastOptions) {
  return toast(message, {
    ...defaultOptions,
    ...options,
    icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    style: {
      ...defaultOptions.style,
      ...options?.style,
      borderLeft: "4px solid #eab308",
    },
  });
}

/**
 * Info toast
 */
export function toastInfo(message: string, options?: ToastOptions) {
  return toast(message, {
    ...defaultOptions,
    ...options,
    icon: <Info className="w-5 h-5 text-primary" />,
    style: {
      ...defaultOptions.style,
      ...options?.style,
      borderLeft: "4px solid #DA76EC",
    },
  });
}

/**
 * Loading toast
 */
export function toastLoading(message: string, options?: ToastOptions) {
  return toast.loading(message, {
    ...defaultOptions,
    duration: Infinity, // Loading toasts don't auto-dismiss
    ...options,
    icon: <Loader2 className="w-5 h-5 text-primary animate-spin" />,
    style: {
      ...defaultOptions.style,
      ...options?.style,
      borderLeft: "4px solid #DA76EC",
    },
  });
}

/**
 * Promise toast - shows loading, success, and error states
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  },
  options?: ToastOptions
) {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      ...defaultOptions,
      ...options,
      success: {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        style: {
          ...defaultOptions.style,
          borderLeft: "4px solid #22c55e",
        },
      },
      error: {
        icon: <XCircle className="w-5 h-5 text-red-500" />,
        style: {
          ...defaultOptions.style,
          borderLeft: "4px solid #ef4444",
        },
        duration: 6000,
      },
      loading: {
        icon: <Loader2 className="w-5 h-5 text-primary animate-spin" />,
        style: {
          ...defaultOptions.style,
          borderLeft: "4px solid #DA76EC",
        },
      },
    }
  );
}

/**
 * Dismiss toast
 */
export function toastDismiss(toastId?: string) {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
}

/**
 * Transaction toast helper - shows loading, then success with tx link
 */
export function toastTransaction(
  promise: Promise<{ hash: string }>,
  messages: {
    loading?: string;
    success?: string;
    error?: string;
  } = {}
) {
  const loadingId = toastLoading(messages.loading || "Transaction pending...");

  promise
    .then((result) => {
      toastDismiss(loadingId);
      toastSuccess(messages.success || "Transaction successful!", {
        duration: 6000,
      });
      return result;
    })
    .catch((error) => {
      toastDismiss(loadingId);
      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message || messages.error || "Transaction failed";
      toastError(errorMessage);
      throw error;
    });

  return promise;
}

/**
 * Copy to clipboard toast
 */
export function toastCopy(
  text: string,
  successMessage: string = "Copied to clipboard!"
) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      toastSuccess(successMessage);
    })
    .catch(() => {
      toastError("Failed to copy to clipboard");
    });
}

// Re-export the base toast for custom use cases
export { toast };
