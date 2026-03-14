import { useCallback } from "react";

/**
 * Hook for displaying user notifications
 */
export function useNotification() {
  const emitToast = useCallback(
    (type: "success" | "error", message: string) => {
      if (typeof window === "undefined") return;

      window.dispatchEvent(
        new CustomEvent("app-toast", {
          detail: { type, message },
        }),
      );
    },
    [],
  );

  const showSuccess = useCallback((message: string) => {
    emitToast("success", message);
  }, [emitToast]);

  const showError = useCallback((message: string) => {
    emitToast("error", message);
  }, [emitToast]);

  const showConfirm = useCallback((message: string): boolean => {
    return confirm(message);
  }, []);

  return {
    showSuccess,
    showError,
    showConfirm,
  };
}
