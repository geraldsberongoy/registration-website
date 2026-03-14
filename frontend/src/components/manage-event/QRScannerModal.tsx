"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, CheckCircle, XCircle, Loader2, FlipHorizontal } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { validateQRCodeAction } from "@/actions/qrActions";

interface ScanResult {
  status: "success" | "error" | "validating";
  message: string;
  guestName?: string;
  guestEmail?: string;
}

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventSlug: string;
}

export function QRScannerModal({
  isOpen,
  onClose,
  eventSlug,
}: QRScannerModalProps) {
  const SCAN_DEBOUNCE_MS = 1500;
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const lastScannedValueRef = useRef<string | null>(null);
  const lastScannedAtRef = useRef<number>(0);

  const handleScan = async (decodedText: string) => {
    if (isProcessingRef.current) return;

    const normalized = decodedText.trim();
    if (!normalized) return;

    const now = Date.now();
    const isDuplicateWithinWindow =
      lastScannedValueRef.current === normalized &&
      now - lastScannedAtRef.current < SCAN_DEBOUNCE_MS;
    if (isDuplicateWithinWindow) {
      return;
    }

    lastScannedValueRef.current = normalized;
    lastScannedAtRef.current = now;
    isProcessingRef.current = true;

    try {
      setScanResult({ status: "validating", message: "Validating ticket..." });

      // Validate with server
      const result = await validateQRCodeAction(normalized, eventSlug);

      if (result.success && result.data && result.data.success) {
        setScanResult({
          status: "success",
          message: "Valid ticket!",
          guestName: result.data.guestName,
          guestEmail: result.data.guestEmail,
        });
        // Success stays until user dismisses it — isProcessingRef stays true
        // so the same code won't re-trigger while the card is visible.
      } else {
        setScanResult({
          status: "error",
          message: result.data?.error || result.error || "Invalid ticket",
        });
        setTimeout(() => {
          setScanResult(null);
          isProcessingRef.current = false;
        }, 2000);
      }
    } catch (error) {
      console.error("Error processing QR code:", error);
      setScanResult({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to validate ticket",
      });
      setTimeout(() => {
        setScanResult(null);
        isProcessingRef.current = false;
      }, 2000);
    }
  };

  const startScanner = async (camera: "environment" | "user" = facingMode) => {
    try {
      setIsScanning(true);
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: camera },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleScan,
        () => {},
      );
    } catch (error) {
      console.error("Error starting scanner:", error);
      setIsScanning(false);
      setScanResult({
        status: "error",
        message: "Failed to start camera. Please check permissions.",
      });
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
    setScanResult(null);
    lastScannedValueRef.current = null;
    lastScannedAtRef.current = 0;
    onClose();
  };

  useEffect(() => {
    if (!isOpen || scannerRef.current) return;

    const startTimer = window.setTimeout(() => {
      void startScanner(facingMode);
    }, 0);

    return () => {
      window.clearTimeout(startTimer);
    };
  }, [facingMode, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      void stopScanner();
      setScanResult(null);
      lastScannedValueRef.current = null;
      lastScannedAtRef.current = 0;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-lg bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-urbanist font-bold text-white">
            Scan QR Code
          </h2>
          <div className="flex items-center gap-2">
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
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="p-6">
          <div className="relative bg-black rounded-xl overflow-hidden">
            <div id="qr-reader" className="w-full" />
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Scan Result */}
          {scanResult && (
            <div
              className={`mt-4 rounded-xl border ${
                scanResult.status === "success"
                  ? "bg-green-500/20 border-green-500/30"
                  : scanResult.status === "error"
                    ? "bg-red-500/20 border-red-500/30"
                    : "bg-blue-500/20 border-blue-500/30"
              }`}
            >
              <div className="flex items-start gap-3 p-4">
                {scanResult.status === "validating" && (
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
                )}
                {scanResult.status === "success" && (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                )}
                {scanResult.status === "error" && (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-urbanist font-semibold ${
                      scanResult.status === "success"
                        ? "text-green-400"
                        : scanResult.status === "error"
                          ? "text-red-400"
                          : "text-blue-400"
                    }`}
                  >
                    {scanResult.message}
                  </p>
                  {scanResult.status === "success" && scanResult.guestName && (
                    <div className="mt-2 space-y-1">
                      <p className="text-white text-sm font-semibold truncate">
                        {scanResult.guestName}
                      </p>
                      {scanResult.guestEmail && (
                        <p className="text-white/60 text-xs truncate">
                          {scanResult.guestEmail}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {scanResult.status === "success" && (
                  <button
                    onClick={() => {
                      setScanResult(null);
                      isProcessingRef.current = false;
                    }}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4 text-white/50" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-white/60 text-sm font-urbanist text-center">
              Position the QR code within the frame to scan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
