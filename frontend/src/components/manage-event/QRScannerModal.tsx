"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  X,
  CheckCircle,
  XCircle,
  Loader2,
  FlipHorizontal,
  QrCode,
  Search,
  Check,
  Undo2,
  Users,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import Fuse from "fuse.js";
import {
  getManualCheckInGuestsAction,
  manualCheckInAction,
  undoCheckInAction,
  validateQRCodeAction,
} from "@/actions/qrActions";
import { generateQRCodeDataUrl } from "@/services/qrService";
import { Guest } from "@/types/guest";

interface ToastItem {
  id: number;
  status: "success" | "error";
  message: string;
  sub?: string;
}

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventSlug: string;
}

type ModalTab = "scanner" | "manual";

export function QRScannerModal({
  isOpen,
  onClose,
  eventSlug,
}: QRScannerModalProps) {
  const SCAN_DEBOUNCE_MS = 1500;
  const [activeTab, setActiveTab] = useState<ModalTab>("scanner");
  const [isScanning, setIsScanning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [manualGuests, setManualGuests] = useState<Guest[]>([]);
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSearch, setManualSearch] = useState("");
  const [manualCheckingInId, setManualCheckingInId] = useState<string | null>(
    null,
  );
  const [manualUndoingId, setManualUndoingId] = useState<string | null>(null);
  const [previewQrCodeUrl, setPreviewQrCodeUrl] = useState<string | null>(null);
  const [previewGuestName, setPreviewGuestName] = useState<string>("");
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const lastScannedValueRef = useRef<string | null>(null);
  const lastScannedAtRef = useRef<number>(0);
  const toastCounterRef = useRef(0);

  const addToast = useCallback(
    (status: "success" | "error", message: string, sub?: string) => {
      const id = ++toastCounterRef.current;
      setToasts((prev) => [...prev, { id, status, message, sub }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    [],
  );

  const fetchManualGuests = async () => {
    setIsManualLoading(true);
    setManualError(null);
    try {
      const result = await getManualCheckInGuestsAction(eventSlug);
      if (!result.success || !result.data?.success) {
        setManualError(
          result.data?.error || result.error || "Failed to fetch registrants",
        );
        return;
      }

      setManualGuests(result.data.guests || []);
    } catch (error) {
      console.error("Failed to fetch registrants for manual check-in:", error);
      setManualError("Failed to fetch registrants");
    } finally {
      setIsManualLoading(false);
    }
  };

  const filteredManualGuests = useMemo(() => {
    if (!manualSearch.trim()) return manualGuests;

    const searchable = manualGuests.map((guest) => {
      const firstName = guest.users?.first_name?.trim() || "";
      const lastName = guest.users?.last_name?.trim() || "";
      const fullName = `${firstName} ${lastName}`.trim();
      return { guest, fullName, email: guest.users?.email || "" };
    });

    const fuse = new Fuse(searchable, {
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: [
        { name: "fullName", weight: 0.7 },
        { name: "email", weight: 0.3 },
      ],
    });

    return fuse.search(manualSearch).map((item) => item.item.guest);
  }, [manualGuests, manualSearch]);

  const handleManualCheckIn = async (guest: Guest) => {
    setManualCheckingInId(guest.registrant_id);
    try {
      const result = await manualCheckInAction(guest.registrant_id, eventSlug);
      if (result.success && result.data && result.data.success) {
        setManualGuests((prev) =>
          prev.map((g) =>
            g.registrant_id === guest.registrant_id
              ? {
                  ...g,
                  is_going: true,
                  check_in: true,
                  check_in_time:
                    result.data?.checkInTime ?? new Date().toISOString(),
                }
              : g,
          ),
        );
        const name =
          result.data.guestName ||
          `${guest.users?.first_name || ""} ${guest.users?.last_name || ""}`.trim() ||
          "Guest";
        addToast("success", "Checked in successfully!", name);
      } else {
        addToast(
          "error",
          result.data?.error || result.error || "Manual check-in failed",
        );
      }
    } finally {
      setManualCheckingInId(null);
    }
  };

  const handleUndoCheckIn = async (guest: Guest) => {
    setManualUndoingId(guest.registrant_id);
    try {
      const result = await undoCheckInAction(guest.registrant_id, eventSlug);
      if (result.success && result.data && result.data.success) {
        setManualGuests((prev) =>
          prev.map((g) =>
            g.registrant_id === guest.registrant_id
              ? { ...g, check_in: false, check_in_time: null }
              : g,
          ),
        );
        const name =
          `${guest.users?.first_name || ""} ${guest.users?.last_name || ""}`.trim() ||
          "Guest";
        addToast("success", "Check-in undone", name);
      } else {
        addToast(
          "error",
          result.data?.error || result.error || "Failed to undo check-in",
        );
      }
    } finally {
      setManualUndoingId(null);
    }
  };

  const handlePreviewQr = async (guest: Guest) => {
    if (!guest.qr_data || isGeneratingPreview) return;
    setIsGeneratingPreview(true);
    try {
      const dataUrl = await generateQRCodeDataUrl(guest.qr_data);
      const guestName =
        `${guest.users?.first_name || ""} ${guest.users?.last_name || ""}`.trim() ||
        "Guest";
      setPreviewGuestName(guestName);
      setPreviewQrCodeUrl(dataUrl);
    } catch (error) {
      console.error("Failed to preview guest QR code:", error);
      addToast("error", "Failed to generate guest QR");
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleScan = async (decodedText: string) => {
    if (isProcessingRef.current) return;

    const normalized = decodedText.trim();
    if (!normalized) return;

    const now = Date.now();
    const isDuplicateWithinWindow =
      lastScannedValueRef.current === normalized &&
      now - lastScannedAtRef.current < SCAN_DEBOUNCE_MS;
    if (isDuplicateWithinWindow) return;

    lastScannedValueRef.current = normalized;
    lastScannedAtRef.current = now;
    isProcessingRef.current = true;

    try {
      setIsValidating(true);
      const result = await validateQRCodeAction(normalized, eventSlug);

      if (result.success && result.data && result.data.success) {
        addToast("success", "Valid ticket!", result.data.guestName);
        setTimeout(() => {
          isProcessingRef.current = false;
        }, SCAN_DEBOUNCE_MS);
      } else {
        addToast(
          "error",
          result.data?.error || result.error || "Invalid ticket",
        );
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 2000);
      }
    } catch (error) {
      console.error("Error processing QR code:", error);
      addToast(
        "error",
        error instanceof Error ? error.message : "Failed to validate ticket",
      );
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 2000);
    } finally {
      setIsValidating(false);
    }
  };

  const startScanner = async (camera: "environment" | "user" = facingMode) => {
    try {
      setIsScanning(true);
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: camera },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScan,
        () => {},
      );
    } catch (error) {
      console.error("Error starting scanner:", error);
      setIsScanning(false);
      addToast("error", "Failed to start camera. Please check permissions.");
    }
  };

  const flipCamera = async () => {
    await stopScanner();
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    await startScanner(next);
  };

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        await scanner.stop();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (
          !message.includes("Cannot stop, scanner is not running or paused")
        ) {
          console.error("Error stopping scanner:", error);
        }
      } finally {
        try {
          scanner.clear();
        } catch {
          // no-op: scanner may already be disposed
        }
        if (scannerRef.current === scanner) {
          scannerRef.current = null;
        }
      }
    }
    setIsScanning(false);
  };

  const handleClose = async () => {
    await stopScanner();
    setActiveTab("scanner");
    setToasts([]);
    setManualSearch("");
    setPreviewQrCodeUrl(null);
    setPreviewGuestName("");
    lastScannedValueRef.current = null;
    lastScannedAtRef.current = 0;
    onClose();
  };

  useEffect(() => {
    if (!isOpen || activeTab !== "scanner" || scannerRef.current) return;
    const startTimer = window.setTimeout(() => {
      void startScanner(facingMode);
    }, 0);
    return () => {
      window.clearTimeout(startTimer);
    };
  }, [activeTab, facingMode, isOpen]);

  useEffect(() => {
    if (activeTab !== "scanner") {
      void stopScanner();
    }
  }, [activeTab]);

  useEffect(() => {
    if (isOpen && activeTab === "manual") {
      void fetchManualGuests();
    }
  }, [isOpen, activeTab, eventSlug]);

  useEffect(() => {
    if (!isOpen) {
      void stopScanner();
      setToasts([]);
      lastScannedValueRef.current = null;
      lastScannedAtRef.current = 0;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80">
      {/* Toast stack - bottom-right, outside modal */}
      <div className="fixed bottom-6 right-6 z-[220] flex flex-col-reverse gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl pointer-events-auto max-w-xs transition-all duration-200 ${
              toast.status === "success"
                ? "bg-green-950/95 border-green-500/40 text-green-300"
                : "bg-red-950/95 border-red-500/40 text-red-300"
            }`}
          >
            {toast.status === "success" ? (
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">
                {toast.message}
              </p>
              {toast.sub && (
                <p className="text-xs opacity-70 mt-0.5 truncate">
                  {toast.sub}
                </p>
              )}
            </div>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
              className="p-0.5 hover:opacity-70 transition-opacity flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div
        className={`relative w-full bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 ease-in-out ${
          activeTab === "manual" ? "max-w-2xl" : "max-w-lg"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-urbanist font-bold text-white">
            Check In
          </h2>
          <div className="flex items-center gap-2">
            {activeTab === "scanner" && (
              <button
                onClick={flipCamera}
                disabled={!isScanning}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Flip camera"
                title={
                  facingMode === "environment"
                    ? "Switch to front camera"
                    : "Switch to back camera"
                }
              >
                <FlipHorizontal className="w-5 h-5 text-white/60" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        <div className="px-6 pt-4">
          <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setActiveTab("scanner")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === "scanner"
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Scanner
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === "manual"
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Manual Check-in
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === "scanner" ? (
            <div className="relative bg-black rounded-xl overflow-hidden">
              <div id="qr-reader" className="w-full" />
              {(!isScanning || isValidating) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                  {isValidating && (
                    <p className="text-white/70 text-sm">
                      Validating ticketâ€¦
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {isManualLoading ? (
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="text-left p-3 text-white/60 font-medium">
                          Name
                        </th>
                        <th className="text-left p-3 text-white/60 font-medium">
                          Status
                        </th>
                        <th className="text-center p-3 text-white/60 font-medium">
                          QR
                        </th>
                        <th className="text-right p-3 text-white/60 font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} className="border-t border-white/5">
                          <td className="p-3">
                            <div className="h-3.5 bg-white/10 rounded-full animate-pulse w-28" />
                          </td>
                          <td className="p-3">
                            <div className="h-5 bg-white/10 rounded-full animate-pulse w-16" />
                          </td>
                          <td className="p-3 flex justify-center">
                            <div className="h-7 w-7 bg-white/10 rounded-lg animate-pulse" />
                          </td>
                          <td className="p-3 text-right">
                            <div className="h-7 bg-white/10 rounded-lg animate-pulse w-20 ml-auto" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : manualError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200 text-sm">
                  {manualError}
                </div>
              ) : manualGuests.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 py-12 flex flex-col items-center gap-3 text-center">
                  <div className="p-4 rounded-full bg-white/5 border border-white/10">
                    <Users className="w-8 h-8 text-white/25" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm font-medium">
                      No registered guests yet
                    </p>
                    <p className="text-white/30 text-xs mt-1">
                      Guests will appear here once they&apos;ve been approved
                    </p>
                  </div>
                </div>
              ) : (
                <div className="max-h-80 overflow-auto rounded-xl border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 sticky top-0">
                      <tr>
                        <th className="text-left p-3 text-white/60 font-medium">
                          Name
                        </th>
                        <th className="text-left p-3 text-white/60 font-medium">
                          Status
                        </th>
                        <th className="text-center p-3 text-white/60 font-medium">
                          QR
                        </th>
                        <th className="text-right p-3 text-white/60 font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredManualGuests.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-10">
                            <div className="flex flex-col items-center gap-2 text-center">
                              <Search className="w-6 h-6 text-white/20" />
                              <p className="text-white/40 text-sm">
                                No guests match &ldquo;{manualSearch}&rdquo;
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredManualGuests.map((guest) => {
                          const fullName =
                            `${guest.users?.first_name || ""} ${guest.users?.last_name || ""}`.trim() ||
                            "Guest";
                          const isCheckedIn = guest.check_in === true;
                          const statusLabel = isCheckedIn
                            ? "Checked In"
                            : guest.is_going === false
                              ? "Not Going"
                              : "Ready";

                          return (
                            <tr
                              key={guest.registrant_id}
                              className="border-t border-white/5"
                            >
                              <td className="p-3 text-white">{fullName}</td>
                              <td className="p-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    isCheckedIn
                                      ? "bg-emerald-500/20 text-emerald-300"
                                      : guest.is_going === false
                                        ? "bg-red-500/20 text-red-300"
                                        : "bg-white/10 text-white/60"
                                  }`}
                                >
                                  {statusLabel}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                {guest.qr_data ? (
                                  <button
                                    onClick={() => void handlePreviewQr(guest)}
                                    className="p-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                                    title="Preview QR"
                                  >
                                    <QrCode className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <span className="text-white/30">-</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                {isCheckedIn ? (
                                  <button
                                    onClick={() =>
                                      void handleUndoCheckIn(guest)
                                    }
                                    disabled={
                                      manualUndoingId === guest.registrant_id
                                    }
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {manualUndoingId === guest.registrant_id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Undo2 className="w-3.5 h-3.5" />
                                    )}
                                    Undo
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      void handleManualCheckIn(guest)
                                    }
                                    disabled={
                                      manualCheckingInId === guest.registrant_id
                                    }
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {manualCheckingInId ===
                                    guest.registrant_id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5" />
                                    )}
                                    Check In
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Instructions */}
          <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-white/60 text-sm font-urbanist text-center">
              {activeTab === "scanner"
                ? "Position the QR code within the frame to scan"
                : "Search guests and check them in manually"}
            </p>
          </div>

          {previewQrCodeUrl && (
            <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/80">
              <div className="relative w-full max-w-sm bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/10 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                  <h3 className="text-white font-urbanist font-bold">
                    Guest QR
                  </h3>
                  <button
                    onClick={() => setPreviewQrCodeUrl(null)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>
                <div className="p-5">
                  <p className="text-white/70 text-sm text-center mb-3">
                    {previewGuestName}
                  </p>
                  <div className="mx-auto w-fit rounded-xl border-4 border-primary bg-white p-3">
                    <img
                      src={previewQrCodeUrl}
                      alt={`QR for ${previewGuestName}`}
                      width={220}
                      height={220}
                      className="block"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
