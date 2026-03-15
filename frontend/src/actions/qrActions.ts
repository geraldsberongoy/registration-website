"use server";

import { canManageEvent } from "@/services/authService";
import { logger } from "@/utils/logger";
import {
  withActionErrorHandler,
  UnauthorizedError,
} from "@/lib/utils/actionError";
import {
  checkInRegistrant,
  getRegistrantsByEvent,
  getRegistrantById,
  getRegistrantByQrData,
  undoCheckInRegistrant,
} from "@/repositories/registrantRepository";
import { getEventIdAndApprovalBySlug } from "@/repositories/eventRepository";
import { parseRegistrantQrData } from "@/services/qrService";
import { Guest } from "@/types/guest";

export interface QRValidationResult {
  success: boolean;
  guestName?: string;
  guestEmail?: string;
  error?: string;
}

export interface ManualCheckInResult {
  success: boolean;
  guestName?: string;
  guestEmail?: string;
  checkInTime?: string;
  error?: string;
}

export interface ManualGuestsResult {
  success: boolean;
  guests?: Guest[];
  error?: string;
}

export const getManualCheckInGuestsAction = withActionErrorHandler(
  async (eventSlug: string): Promise<ManualGuestsResult> => {
    const canManage = await canManageEvent(eventSlug);
    if (!canManage) {
      throw new UnauthorizedError("Unauthorized to view registrants");
    }

    const eventData = await getEventIdAndApprovalBySlug(eventSlug);
    const guests = await getRegistrantsByEvent(eventData.event_id);

    return {
      success: true,
      guests: guests.filter((guest) => guest.is_registered),
    };
  },
);

export const validateQRCodeAction = withActionErrorHandler(
  async (qrData: string, eventSlug: string): Promise<QRValidationResult> => {
    const canManage = await canManageEvent(eventSlug);
    if (!canManage) {
      logger.warn("Unauthorized QR validation attempt", { eventSlug });
      throw new UnauthorizedError("Unauthorized to validate tickets");
    }

    const normalizedQrData = qrData.trim();
    if (!normalizedQrData) {
      return {
        success: false,
        error: "Invalid ticket - missing QR data.",
      };
    }

    const parsedPayload = parseRegistrantQrData(normalizedQrData);
    if (parsedPayload?.event.slug && parsedPayload.event.slug !== eventSlug) {
      return {
        success: false,
        error: "Invalid ticket - event mismatch",
      };
    }

    const [eventData, registrant] = await Promise.all([
      getEventIdAndApprovalBySlug(eventSlug),
      getRegistrantByQrData(normalizedQrData),
    ]);

    if (!registrant) {
      return {
        success: false,
        error: "Invalid ticket - registrant not found",
      };
    }

    if (registrant.event_id !== eventData.event_id) {
      return {
        success: false,
        error: "Invalid ticket - event mismatch",
      };
    }

    if (!registrant.is_registered) {
      return {
        success: false,
        error: "Invalid ticket - registrant is not cleared for entry",
      };
    }

    const guestName = [
      registrant.users?.first_name,
      registrant.users?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    await checkInRegistrant(registrant.registrant_id);

    return {
      success: true,
      guestName: guestName || "Guest",
      guestEmail: registrant.users?.email ?? undefined,
    };
  },
);

export const manualCheckInAction = withActionErrorHandler(
  async (
    registrantId: string,
    eventSlug: string,
  ): Promise<ManualCheckInResult> => {
    const canManage = await canManageEvent(eventSlug);
    if (!canManage) {
      logger.warn("Unauthorized manual check-in attempt", {
        eventSlug,
        registrantId,
      });
      throw new UnauthorizedError("Unauthorized to check in guests");
    }

    const [eventData, registrant] = await Promise.all([
      getEventIdAndApprovalBySlug(eventSlug),
      getRegistrantById(registrantId),
    ]);

    if (!registrant) {
      return {
        success: false,
        error: "Registrant not found",
      };
    }

    if (registrant.event_id !== eventData.event_id) {
      return {
        success: false,
        error: "Invalid registrant for this event",
      };
    }

    if (!registrant.is_registered) {
      return {
        success: false,
        error: "Registrant is not approved yet",
      };
    }

    const checkedInAt = new Date().toISOString();
    await checkInRegistrant(registrant.registrant_id, checkedInAt);

    const guestName = [
      registrant.users?.first_name,
      registrant.users?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      success: true,
      guestName: guestName || "Guest",
      guestEmail: registrant.users?.email ?? undefined,
      checkInTime: checkedInAt,
    };
  },
);

export interface UndoCheckInResult {
  success: boolean;
  error?: string;
}

export const undoCheckInAction = withActionErrorHandler(
  async (
    registrantId: string,
    eventSlug: string,
  ): Promise<UndoCheckInResult> => {
    const canManage = await canManageEvent(eventSlug);
    if (!canManage) {
      throw new UnauthorizedError("Unauthorized to undo check-in");
    }

    const [eventData, registrant] = await Promise.all([
      getEventIdAndApprovalBySlug(eventSlug),
      getRegistrantById(registrantId),
    ]);

    if (!registrant) {
      return { success: false, error: "Registrant not found" };
    }

    if (registrant.event_id !== eventData.event_id) {
      return { success: false, error: "Invalid registrant for this event" };
    }

    await undoCheckInRegistrant(registrantId);

    return { success: true };
  },
);
