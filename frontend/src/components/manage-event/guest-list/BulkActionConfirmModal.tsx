"use client";

import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";

type BulkStatus = "registered" | "pending" | "not-going";

interface BulkActionConfirmModalProps {
  isOpen: boolean;
  count: number;
  status: BulkStatus;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const STATUS_LABELS: Record<BulkStatus, { label: string; color: string }> = {
  registered: { label: "Registered", color: "text-green-400" },
  pending: { label: "Pending", color: "text-yellow-400" },
  "not-going": { label: "Not Going", color: "text-red-400" },
};

export function BulkActionConfirmModal({
  isOpen,
  count,
  status,
  isLoading,
  onConfirm,
  onClose,
}: BulkActionConfirmModalProps) {
  if (!isOpen) return null;

  const { label, color } = STATUS_LABELS[status];

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-[210] w-full max-w-[420px] overflow-hidden rounded-2xl bg-[#0a1520] border border-white/10 shadow-2xl p-6 font-urbanist">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-yellow-500/10 shrink-0">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Confirm Bulk Update</h2>
        </div>

        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          You are about to set{" "}
          <span className="text-white font-semibold">{count}</span> guest
          {count !== 1 ? "s" : ""} to{" "}
          <span className={`font-semibold ${color}`}>{label}</span>. This action
          will override their current status.
        </p>

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl font-bold transition-all duration-200 text-gray-400 hover:text-white hover:bg-white/5 border-2 border-transparent disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl font-bold transition-all duration-200 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border-2 border-cyan-500/20 disabled:opacity-50 flex items-center justify-center min-w-[120px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Updating...
              </span>
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
