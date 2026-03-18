"use client";

import Link from "next/link";
import {
  CheckCircle,
  CheckCircle2,
  Users,
  Ticket,
  Download,
  Loader2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { generateQRCodeDataUrl } from "@/services/qrService";

// Helper function to convert 24-hour time to 12-hour AM/PM format
function format12HourTime(time: string): string {
  if (!time) return time;

  // Handle HH:MM format
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return time;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${hours}:${minutes} ${ampm}`;
}

interface EventRegistrationCardProps {
  registrationOpen?: boolean;
  requireApproval: boolean;
  ticketPrice: string;
  capacity: string;
  registeredCount?: number;
  isUserRegistered?: boolean;
  registrationApprovalStatus?: "approved" | "pending" | null;
  isGoing?: boolean | null;
  qrData?: string | null;
  forgotPasswordHref?: string;
  eventTitle?: string;
  eventDate?: string;
  eventTime?: string;
  eventEndTime?: string;
  eventLocation?: string;
  attendeeName?: string;
  onRsvpClick: () => void;
  onNotGoingClick?: () => void;
  onGoingClick?: () => void;
}

export function EventRegistrationCard({
  registrationOpen = true,
  requireApproval,
  ticketPrice,
  capacity,
  registeredCount = 0,
  isUserRegistered = false,
  registrationApprovalStatus = null,
  isGoing = null,
  qrData = null,
  forgotPasswordHref = "/forgot-password",
  eventTitle = "Event",
  eventDate = "",
  eventTime = "",
  eventEndTime = "",
  eventLocation = "",
  attendeeName = "Guest",
  onRsvpClick,
  onNotGoingClick,
  onGoingClick,
}: EventRegistrationCardProps) {
  const [downloadingTicket, setDownloadingTicket] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [generatingQRCode, setGeneratingQRCode] = useState(false);
  const [qrGenerationError, setQrGenerationError] = useState<string | null>(
    null,
  );
  const qrAttemptedForDataRef = useRef<string | null>(null);
  const qrGenerationInFlightRef = useRef(false);

  const capacityNum = parseInt(capacity) || 0;
  const slotsAvailable = capacityNum - registeredCount;
  const isAlmostFull =
    capacityNum > 0 && slotsAvailable <= Math.max(10, capacityNum * 0.1);
  const isFull = capacityNum > 0 && slotsAvailable <= 0;
  const isApproved = registrationApprovalStatus === "approved";
  const shouldShowTicket =
    isUserRegistered && isApproved && isGoing === true && !!qrCodeUrl;

  const handleDownloadTicket = async () => {
    if (!qrCodeUrl) return;
    setDownloadingTicket(true);
    try {
      const link = document.createElement("a");
      link.href = qrCodeUrl;
      link.download = `${eventTitle}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download QR code:", error);
    } finally {
      setDownloadingTicket(false);
    }
  };

  useEffect(() => {
    setQrCodeUrl(null);
    setQrGenerationError(null);
    setGeneratingQRCode(false);
    qrAttemptedForDataRef.current = null;
    qrGenerationInFlightRef.current = false;
  }, [qrData]);

  useEffect(() => {
    let isCancelled = false;

    async function ensureQrCode() {
      if (!isUserRegistered || !isApproved || isGoing !== true || !qrData) {
        return;
      }

      if (qrCodeUrl || qrGenerationInFlightRef.current) {
        return;
      }

      if (qrAttemptedForDataRef.current === qrData) {
        return;
      }

      qrGenerationInFlightRef.current = true;
      setGeneratingQRCode(true);
      qrAttemptedForDataRef.current = qrData;
      setQrGenerationError(null);
      try {
        const nextQrCodeUrl = await generateQRCodeDataUrl(qrData);
        if (!isCancelled) {
          setQrCodeUrl(nextQrCodeUrl);
          setQrGenerationError(null);
        }
      } catch (error) {
        console.error("Failed to generate QR code:", error);
        if (!isCancelled) {
          setQrGenerationError(
            "We could not generate your QR code right now. Please try again later.",
          );
        }
      } finally {
        qrGenerationInFlightRef.current = false;
        if (!isCancelled) {
          setGeneratingQRCode(false);
        }
      }
    }

    void ensureQrCode();

    return () => {
      isCancelled = true;
    };
  }, [isUserRegistered, isApproved, isGoing, qrData, qrCodeUrl]);

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-xl p-5 md:p-6 border border-white/10 mb-6">
      <h3 className="font-montserrat text-base font-bold mb-3 text-white">
        Registration
      </h3>

      <p className="text-white/70 text-sm mb-5 leading-relaxed">
        {!registrationOpen && !isUserRegistered
          ? "Registration for this event is closed."
          : isUserRegistered
          ? registrationApprovalStatus === "approved"
            ? "You're registered for this event."
            : "Your registration is pending approval."
          : "Welcome! To join the event, please register below."}
      </p>

      {requireApproval && !isUserRegistered && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/10 border border-secondary/20 mb-4">
          <CheckCircle
            size={16}
            className="text-secondary mt-0.5 flex-shrink-0"
          />
          <p className="text-white/80 text-xs">Approval required</p>
        </div>
      )}

      {shouldShowTicket && (
        <div className="mb-6">
          {/* Boarding Pass - White Only */}
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
            <div className="flex flex-col min-h-96">
              {/* Top info */}
              <div className="flex justify-between items-start px-6 pt-4 pb-3 border-b border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">
                    Date & Time
                  </p>
                  <p className="text-sm font-bold text-gray-900 line-clamp-2">
                    {eventDate && (eventTime || eventEndTime) ? (
                      <>
                        {eventDate}
                        {eventTime &&
                          eventEndTime &&
                          ` ${format12HourTime(eventTime)} - ${format12HourTime(eventEndTime)}`}
                        {eventTime &&
                          !eventEndTime &&
                          ` ${format12HourTime(eventTime)}`}
                      </>
                    ) : eventTime && eventEndTime ? (
                      `${format12HourTime(eventTime)} - ${format12HourTime(eventEndTime)}`
                    ) : eventTime ? (
                      format12HourTime(eventTime)
                    ) : (
                      "TBD"
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">
                    Location
                  </p>
                  <p className="text-sm font-bold text-gray-900 line-clamp-2">
                    {eventLocation || "TBD"}
                  </p>
                </div>
              </div>

              {/* Center QR Code */}
              <div className="flex justify-center py-6 flex-1 items-center">
                <div className="bg-white border-4 border-primary rounded-lg p-3">
                  <img
                    src={qrCodeUrl}
                    alt="QR Ticket"
                    width={110}
                    height={110}
                    className="block"
                  />
                </div>
              </div>

              {/* Event title centered */}
              <div className="text-center pb-3 border-b border-gray-200">
                <p className="text-sm font-bold text-primary mb-1">
                  {eventTitle}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-widest">
                  Scan to enter
                </p>
              </div>

              {/* Bottom teal bar - Attendee only */}
              <div className="bg-primary text-white px-6 py-4">
                <div className="text-center">
                  <p className="text-xs opacity-75 uppercase tracking-wider mb-1">
                    Attendee
                  </p>
                  <p className="font-bold text-sm">
                    {attendeeName.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <div className="mt-4">
            <button
              onClick={handleDownloadTicket}
              disabled={downloadingTicket}
              className="w-full inline-flex items-center justify-center gap-2 text-sm font-bold px-4 py-3 rounded-lg bg-blue-600 text-white hover:shadow-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadingTicket ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {downloadingTicket ? "Downloading QR..." : "Download QR Code"}
            </button>
          </div>
        </div>
      )}

      {isUserRegistered && isApproved && !isGoing && (
        <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Registration approved. Click GOING to view your QR code.
        </div>
      )}

      {isUserRegistered && isApproved && (
        <div className="mb-4 flex gap-3">
          <button
            onClick={onGoingClick}
            className={`flex-1 inline-flex items-center justify-center gap-2 text-sm font-bold px-4 py-3 rounded-lg border transition-all ${
              isGoing === true
                ? "bg-emerald-500 text-white border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                : "bg-emerald-500/10 text-emerald-200 border-emerald-500/40 hover:bg-emerald-500/20"
            }`}
          >
            <CheckCircle2 size={16} />
            GOING
          </button>
          <button
            onClick={onNotGoingClick}
            className={`flex-1 inline-flex items-center justify-center gap-2 text-sm font-bold px-4 py-3 rounded-lg border transition-all ${
              isGoing === false
                ? "bg-rose-500 text-white border-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                : "bg-rose-500/10 text-rose-200 border-rose-500/40 hover:bg-rose-500/20"
            }`}
          >
            <XCircle size={16} />
            NOT GOING
          </button>
        </div>
      )}

      {isUserRegistered &&
      isApproved &&
      isGoing === true &&
      generatingQRCode &&
      !qrCodeUrl ? (
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200 inline-flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          Generating your QR code...
        </div>
      ) : isUserRegistered &&
        isApproved &&
        isGoing === true &&
        qrGenerationError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {qrGenerationError}
        </div>
      ) : isUserRegistered && isApproved && isGoing === true && !qrData ? (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
          Ticket unavailable. Please contact the event organizer.
        </div>
      ) : !isUserRegistered || !isApproved ? (
        <Button
          fullWidth
          onClick={isUserRegistered ? undefined : onRsvpClick}
          disabled={isFull || isUserRegistered || !registrationOpen}
          className={`text-sm font-bold tracking-wide ${
            isUserRegistered
              ? isApproved
                ? "bg-green-600/80 hover:bg-green-600/80 cursor-default shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                : "bg-yellow-600/80 hover:bg-yellow-600/80 cursor-default shadow-[0_0_15px_rgba(234,179,8,0.3)]"
              : "shadow-[0_0_30px_rgba(0,128,128,0.4)] hover:shadow-[0_0_40px_rgba(0,128,128,0.6)]"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {!registrationOpen
            ? "REGISTRATION CLOSED"
            : isFull
            ? "EVENT FULL"
            : isUserRegistered
              ? isApproved
                ? "✓ REGISTERED"
                : "⏳ PENDING APPROVAL"
              : "RSVP"}
        </Button>
      ) : null}

      {!isUserRegistered && (
        <div className="mt-3 text-center">
          <Link
            href={forgotPasswordHref}
            className="text-[11px] text-[#80d7d7] hover:text-[#a2e6e6] underline-offset-4 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>
      )}

      {/* Event Details - Price & Capacity Info */}
      <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
        {/* Ticket Price */}
        <div className="flex items-center gap-3">
          <Ticket size={16} className="text-secondary flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-white/50 mb-0.5">Ticket Price</p>
            <p className="text-sm text-white font-semibold">{ticketPrice}</p>
          </div>
        </div>

        {/* Capacity & Available Slots */}
        {capacityNum > 0 && (
          <div className="flex items-center gap-3">
            <Users size={16} className="text-secondary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-white/50 mb-0.5">Capacity</p>
              {slotsAvailable > 0 && (
                <p
                  className={`text-sm font-semibold ${
                    isAlmostFull ? "text-yellow-400" : "text-white"
                  }`}
                >
                  {slotsAvailable} {slotsAvailable === 1 ? "slot" : "slots"}{" "}
                  available
                  {isAlmostFull && " ⚠️"}
                </p>
              )}
              {isFull && (
                <p className="text-sm text-red-400 font-semibold">
                  No slots available
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
