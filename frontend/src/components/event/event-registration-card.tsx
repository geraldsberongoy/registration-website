import React from "react";
import Link from "next/link";
import { CheckCircle, Users, Ticket, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventRegistrationCardProps {
  requireApproval: boolean;
  ticketPrice: string;
  capacity: string;
  registeredCount?: number;
  isUserRegistered?: boolean;
  registrationApprovalStatus?: "approved" | "pending" | null;
  qrUrl?: string | null;
  forgotPasswordHref?: string;
  onRsvpClick: () => void;
}

export function EventRegistrationCard({
  requireApproval,
  ticketPrice,
  capacity,
  registeredCount = 0,
  isUserRegistered = false,
  registrationApprovalStatus = null,
  qrUrl = null,
  forgotPasswordHref = "/forgot-password",
  onRsvpClick,
}: EventRegistrationCardProps) {
  const capacityNum = parseInt(capacity) || 0;
  const slotsAvailable = capacityNum - registeredCount;
  const isAlmostFull =
    capacityNum > 0 && slotsAvailable <= Math.max(10, capacityNum * 0.1);
  const isFull = capacityNum > 0 && slotsAvailable <= 0;
  const isApproved = registrationApprovalStatus === "approved";
  const isPending = registrationApprovalStatus === "pending";

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

      {isUserRegistered && isApproved && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
          <Check
            size={16}
            className="text-green-400 mt-0.5 flex-shrink-0"
          />
          <p className="text-white/80 text-xs">You're registered for this event</p>
        </div>
      )}

      {isUserRegistered && isApproved && qrUrl && (
        <div className="mb-4 flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs text-white/50 font-urbanist">Your QR Ticket</p>
          <div className="rounded-xl overflow-hidden border border-white/20 bg-white p-2">
            <img
              src={qrUrl}
              alt="QR Ticket"
              width={180}
              height={180}
              className="block"
            />
          </div>
          <a
            href={qrUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Download size={13} />
            Download QR Code
          </a>
        </div>
      )}

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
