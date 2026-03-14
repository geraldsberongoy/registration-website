"use client";

import Link from "next/link";
import {
  CheckCircle,
  Users,
  Ticket,
  Download,
  QrCode,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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
  requireApproval: boolean;
  ticketPrice: string;
  capacity: string;
  registeredCount?: number;
  isUserRegistered?: boolean;
  registrationApprovalStatus?: "approved" | "pending" | null;
  isGoing?: boolean;
  qrUrl?: string | null;
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
  onGenerateQR?: () => void;
}

export function EventRegistrationCard({
  requireApproval,
  ticketPrice,
  capacity,
  registeredCount = 0,
  isUserRegistered = false,
  registrationApprovalStatus = null,
  isGoing = true,
  qrUrl = null,
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
  onGenerateQR,
}: EventRegistrationCardProps) {
  const [downloadingTicket, setDownloadingTicket] = useState(false);

  const capacityNum = parseInt(capacity) || 0;
  const slotsAvailable = capacityNum - registeredCount;
  const isAlmostFull =
    capacityNum > 0 && slotsAvailable <= Math.max(10, capacityNum * 0.1);
  const isFull = capacityNum > 0 && slotsAvailable <= 0;
  const isApproved = registrationApprovalStatus === "approved";
  const isPending = registrationApprovalStatus === "pending";

  const handleDownloadTicket = async () => {
    if (!qrUrl) return;
    setDownloadingTicket(true);
    try {
      // Create white boarding pass ticket
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 500;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 600, 500);

      // Top info
      ctx.fillStyle = "#666666";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "left";
      ctx.fillText("DATE & TIME", 30, 35);
      ctx.fillStyle = "#000000";
      ctx.font = "bold 14px Arial";
      let dateTimeText = "TBD";
      if (eventDate) {
        dateTimeText = eventDate;
        if (eventTime && eventEndTime) {
          dateTimeText += ` ${format12HourTime(eventTime)} - ${format12HourTime(eventEndTime)}`;
        } else if (eventTime) {
          dateTimeText += ` ${format12HourTime(eventTime)}`;
        }
      } else if (eventTime && eventEndTime) {
        dateTimeText = `${format12HourTime(eventTime)} - ${format12HourTime(eventEndTime)}`;
      } else if (eventTime) {
        dateTimeText = format12HourTime(eventTime);
      }
      ctx.fillText(dateTimeText, 30, 58);

      ctx.fillStyle = "#666666";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "right";
      ctx.fillText("LOCATION", 570, 35);
      ctx.fillStyle = "#000000";
      ctx.font = "bold 12px Arial";
      const locationText = eventLocation || "TBD";
      const locationWords = locationText.split(" ");
      if (locationWords.length > 1) {
        ctx.fillText(locationWords.slice(0, 2).join(" "), 570, 50);
        if (locationWords.length > 2) {
          ctx.fillText(locationWords.slice(2).join(" "), 570, 63);
        }
      } else {
        ctx.fillText(locationText, 570, 58);
      }

      // Divider line
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, 75);
      ctx.lineTo(570, 75);
      ctx.stroke();

      // Centered QR
      const qrSize = 120;
      const qrX = (600 - qrSize) / 2;
      const qrY = 120;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);
      ctx.strokeStyle = "#008080";
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);

      const qrImage = new Image();
      qrImage.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        qrImage.onload = () => {
          ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
          resolve();
        };
        qrImage.onerror = () => resolve();
        qrImage.src = qrUrl;
      });

      // Event title centered
      ctx.fillStyle = "#008080";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(eventTitle, 300, 280);

      // Details below QR
      ctx.fillStyle = "#666666";
      ctx.font = "bold 9px Arial";
      ctx.textAlign = "center";
      ctx.fillText("SCAN TO ENTER", 300, 305);

      // Divider line before footer
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, 330);
      ctx.lineTo(570, 330);
      ctx.stroke();

      // Bottom blue bar with attendee only
      ctx.fillStyle = "#008080";
      ctx.fillRect(0, 350, 600, 150);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("ATTENDEE", 300, 385);
      ctx.font = "bold 16px Arial";
      ctx.fillText(attendeeName.toUpperCase(), 300, 410);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${eventTitle}-ticket.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download ticket:", error);
    } finally {
      setDownloadingTicket(false);
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-xl p-5 md:p-6 border border-white/10 mb-6">
      <h3 className="font-montserrat text-base font-bold mb-3 text-white">
        Registration
      </h3>

      <p className="text-white/70 text-sm mb-5 leading-relaxed">
        Welcome! To join the event, please register below.
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

      {isUserRegistered && isApproved && isGoing && qrUrl && (
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
              <div className="flex justify-center py-6 flex-1 flex items-center">
                <div className="bg-white border-4 border-primary rounded-lg p-3">
                  <img
                    src={qrUrl}
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
              className="w-full inline-flex items-center justify-center gap-2 text-sm font-bold px-4 py-3 rounded-lg bg-blue-600 text-white hover:shadow-lg hover:shadow-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadingTicket ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {downloadingTicket
                ? "Generating Ticket..."
                : "Download Event Ticket"}
            </button>
          </div>
        </div>
      )}

      {isUserRegistered && isApproved && (
        <div className="mb-4 flex gap-3">
          <button
            onClick={onGoingClick}
            className={`flex-1 text-sm font-bold px-4 py-3 rounded-lg transition-all ${
              isGoing
                ? "bg-accent text-white shadow-lg hover:shadow-xl"
                : "bg-accent/30 text-accent border border-accent/50 hover:bg-accent/40"
            }`}
          >
            GOING
          </button>
          <button
            onClick={onNotGoingClick}
            className={`flex-1 text-sm font-bold px-4 py-3 rounded-lg transition-all ${
              !isGoing
                ? "bg-red-600 text-white shadow-lg hover:shadow-xl"
                : "bg-red-600/30 text-white hover:bg-red-600/40"
            }`}
          >
            NOT GOING
          </button>
        </div>
      )}

      {isUserRegistered && isApproved && isGoing && !qrUrl && onGenerateQR ? (
        <Button
          fullWidth
          onClick={onGenerateQR}
          className="text-sm font-bold tracking-wide bg-green-600 hover:bg-green-700 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all transform hover:scale-[1.02] border-none text-white"
        >
          <QrCode size={16} className="mr-2 inline-block" />
          GENERATE TICKET
        </Button>
      ) : !isUserRegistered || !isApproved ? (
        <Button
          fullWidth
          onClick={isUserRegistered ? undefined : onRsvpClick}
          disabled={isFull || isUserRegistered}
          className={`text-sm font-bold tracking-wide ${
            isUserRegistered
              ? isApproved
                ? "bg-green-600/80 hover:bg-green-600/80 cursor-default shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                : "bg-yellow-600/80 hover:bg-yellow-600/80 cursor-default shadow-[0_0_15px_rgba(234,179,8,0.3)]"
              : "shadow-[0_0_30px_rgba(0,128,128,0.4)] hover:shadow-[0_0_40px_rgba(0,128,128,0.6)]"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isFull
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
