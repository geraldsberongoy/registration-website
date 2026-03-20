"use client";

import { useEffect, useState } from "react";
import { Eye, Trash2, Check, X, QrCode, Loader2 } from "lucide-react";
import { createPortal } from "react-dom";
import { Guest } from "@/types/guest";
import { generateQRCodeDataUrl } from "@/services/qrService";

interface GuestTableRowProps {
  guest: Guest;
  isSelected: boolean;
  isPending: boolean;
  onSelectGuest: (guestId: string, checked: boolean) => void;
  onStatusChange: (
    guestId: string,
    newStatus: "registered" | "pending" | "not-going",
  ) => void;
  onViewAnswers: (guest: Guest) => void;
  onDelete: (guestId: string) => void;
}

export function GuestTableRow({
  guest,
  isSelected,
  isPending,
  onSelectGuest,
  onStatusChange,
  onViewAnswers,
  onDelete,
}: GuestTableRowProps) {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleOpenQrModal = async () => {
    if (!guest.qr_data || isGeneratingQr) return;

    if (!qrCodeUrl) {
      setIsGeneratingQr(true);
      try {
        const nextQrCodeUrl = await generateQRCodeDataUrl(guest.qr_data);
        setQrCodeUrl(nextQrCodeUrl);
      } catch (error) {
        console.error("Failed to generate guest QR code:", error);
        return;
      } finally {
        setIsGeneratingQr(false);
      }
    }

    setIsQrModalOpen(true);
  };

  const attendeeName =
    `${guest.users?.first_name || ""} ${guest.users?.last_name || ""}`.trim() ||
    "Guest";

  const getRegisteredAtLabel = (value?: string | null) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString();
    }
    return value;
  };

  const registeredAtLabel = getRegisteredAtLabel(guest.created_at);

  return (
    <>
      <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
        <td className="py-4 px-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) =>
              onSelectGuest(guest.registrant_id, e.target.checked)
            }
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-600 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
          />
        </td>
        <td className="font-urbanist text-white text-sm py-4 px-2">
          <div>
            <p className="font-medium">
              {guest.users?.first_name || "N/A"} {guest.users?.last_name || ""}
            </p>
            <p className="text-xs text-white/60 md:hidden">
              {guest.users?.email || "No email"}
            </p>
          </div>
        </td>
        <td className="font-urbanist text-white/80 text-sm py-4 px-2 hidden md:table-cell">
          {guest.users?.email || "No email"}
        </td>
        <td className="font-urbanist text-white/80 text-sm py-4 px-2 hidden lg:table-cell">
          {guest.terms_approval ? (
            <span className="text-green-400">Yes</span>
          ) : (
            <span className="text-red-400">No</span>
          )}
        </td>
        <td className="py-4 px-2">
          <select
            value={
              !guest.is_registered
                ? "pending"
                : guest.is_going === false
                  ? "not-going"
                  : "registered"
            }
            onChange={(e) =>
              onStatusChange(
                guest.registrant_id,
                e.target.value as "registered" | "pending" | "not-going",
              )
            }
            disabled={isPending}
            className={`font-urbanist px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
              !guest.is_registered
                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30"
                : guest.is_going === false
                  ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                  : "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
            }`}
          >
            <option value="registered" className="bg-[#0a1520] text-green-400">
              Registered
            </option>
            <option value="pending" className="bg-[#0a1520] text-yellow-400">
              Pending
            </option>
            <option value="not-going" className="bg-[#0a1520] text-red-400">
              Not Going
            </option>
          </select>
        </td>
        <td className="py-4 px-2 hidden md:table-cell">
          {guest.is_registered ? (
            guest.is_going === false ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                <X size={11} />
                Not Going
              </span>
            ) : guest.is_going === true ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                <Check size={11} />
                Going
              </span>
            ) : (
              <span className="text-xs text-white/30">—</span>
            )
          ) : (
            <span className="text-xs text-white/30">—</span>
          )}
        </td>
        <td className="font-urbanist text-white/80 text-xs py-4 px-2 hidden md:table-cell whitespace-nowrap">
          {registeredAtLabel}
        </td>
        <td className="py-4 px-2 hidden md:table-cell">
          <div className="flex justify-center">
            {guest.is_registered && guest.is_going === true ? (
              <div className="inline-flex items-center gap-2">
                {guest.check_in ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/20 px-2.5 py-1 text-xs font-medium text-cyan-300">
                    <Check size={11} />
                    Checked In
                  </span>
                ) : guest.qr_data ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-300">
                    Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/20 px-2.5 py-1 text-xs font-medium text-yellow-300">
                    Missing
                  </span>
                )}

                {guest.qr_data && (
                  <button
                    onClick={handleOpenQrModal}
                    disabled={isGeneratingQr}
                    className="p-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                    title="View Ticket QR"
                  >
                    {isGeneratingQr ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <QrCode size={15} />
                    )}
                  </button>
                )}
              </div>
            ) : (
              <span className="text-xs text-white/30">—</span>
            )}
          </div>
        </td>
        <td className="py-4 px-2">
          <div className="flex justify-center">
            <button
              onClick={() => onViewAnswers(guest)}
              disabled={isPending}
              className="p-1.5 hover:bg-cyan-500/20 rounded text-cyan-400 transition-colors disabled:opacity-50"
              title="View Answers"
            >
              <Eye size={16} />
            </button>
          </div>
        </td>
        <td className="py-4 px-2">
          <div className="flex justify-end gap-2">
            <button
              onClick={() => onDelete(guest.registrant_id)}
              disabled={isPending}
              className="p-1.5 hover:bg-red-500/20 rounded text-red-400 transition-colors disabled:opacity-50"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>

      {isMounted &&
        isQrModalOpen &&
        qrCodeUrl &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div
              className="absolute inset-0"
              onClick={() => setIsQrModalOpen(false)}
            />

            <div className="relative w-full max-w-lg bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-urbanist font-bold text-white">
                  Ticket QR Code
                </h2>
                <button
                  onClick={() => setIsQrModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close QR modal"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <div className="p-6">
                <p className="font-urbanist text-sm text-white/70 text-center mb-1">
                  {attendeeName}
                </p>
                {guest.users?.email && (
                  <p className="font-urbanist text-xs text-white/50 text-center mb-5 break-all">
                    {guest.users.email}
                  </p>
                )}

                <div className="mx-auto w-fit rounded-xl border-4 border-primary bg-white p-3">
                  <img
                    src={qrCodeUrl}
                    alt={`QR ticket for ${attendeeName}`}
                    width={240}
                    height={240}
                    className="block"
                  />
                </div>

                <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-white/60 text-sm font-urbanist text-center">
                    Present this QR code at check-in
                  </p>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
