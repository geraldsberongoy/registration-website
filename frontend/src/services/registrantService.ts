import { getEventIdAndApprovalBySlug } from "@/repositories/eventRepository";
import {
  getRegistrantByUserAndEvent,
  createRegistrant,
} from "@/repositories/registrantRepository";
import { getAuthUser } from "@/repositories/authRepository";
import {
  sendRegisteredConfirmationEmail,
  sendRsvpPendingEmail,
} from "@/services/rsvpEmailService";
import {
  createRegistrantQrData,
  createRegistrantQrToken,
  parseRegistrantQrData,
} from "@/services/qrService";
import { logger } from "@/utils/logger";
import { isRegistrationOpenFromDb } from "@/utils/registration-open";

export async function registerForEvent({
  event_id,
  user_id,
  terms_approval,
  form_answers,
}: {
  event_id: string;
  user_id: string;
  terms_approval?: boolean;
  form_answers: Record<string, string>;
}) {
  if (!event_id || !user_id) {
    throw new Error("Missing required fields");
  }

  const authUser = await getAuthUser();
  if (!authUser) {
    throw new Error("You must be logged in to register");
  }

  if (authUser.id !== user_id) {
    throw new Error("Unauthorized registration request");
  }

  const eventData = await getEventIdAndApprovalBySlug(event_id);
  if (!eventData) {
    throw new Error("Event not found");
  }

  const registrationOpen = isRegistrationOpenFromDb({
    registration_open: eventData.registration_open,
    status: eventData.status,
  });

  if (!registrationOpen) {
    throw new Error("Registration for this event is closed");
  }

  const is_registered = !eventData.require_approval;

  const existingRegistrant = await getRegistrantByUserAndEvent(
    authUser.id,
    eventData.event_id,
  );
  if (existingRegistrant) {
    throw new Error("You have already registered for this event");
  }

  const data = await createRegistrant({
    event_id: eventData.event_id,
    users_id: authUser.id,
    terms_approval: terms_approval || true,
    form_answers,
    is_registered,
    is_going: is_registered ? true : null,
  });

  if (is_registered) {
    const { updateRegistrantQrData } =
      await import("@/repositories/registrantRepository");
    const token = createRegistrantQrToken({
      registrantId: data.registrant_id,
      eventId: data.event_id,
      userId: data.users_id,
    });
    const attendeeName =
      [authUser.user_metadata?.first_name, authUser.user_metadata?.last_name]
        .filter(Boolean)
        .join(" ") || null;
    const qrData = createRegistrantQrData({
      token,
      registrantId: data.registrant_id,
      userId: data.users_id,
      attendeeName,
      attendeeEmail: authUser.email ?? null,
      eventId: data.event_id,
      eventSlug: event_id,
      eventName: eventData.event_name ?? null,
    });

    await updateRegistrantQrData(data.registrant_id, qrData);
    data.qr_data = qrData;
  }

  if (authUser.email) {
    try {
      const eventName = eventData.event_name || event_id;
      if (is_registered) {
        await sendRegisteredConfirmationEmail(authUser.email, eventName);
        logger.info(`Registered confirmation email sent to ${authUser.email}`);
      } else {
        await sendRsvpPendingEmail(authUser.email, eventName);
        logger.info(`RSVP pending email sent to ${authUser.email}`);
      }
    } catch (error) {
      logger.error("Failed to send RSVP email", {
        email: authUser.email,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    success: true,
    registrant: data,
    message: is_registered
      ? "Registration successful"
      : "Registration pending approval",
  };
}

export async function updateGuestStatus(
  guestId: string,
  isRegistered: boolean,
  eventSlug: string,
) {
  const {
    getRegistrantStatusEmailAndEvent,
    updateGuestStatus: persistGuestStatus,
  } = await import("@/repositories/registrantRepository");

  const registrant = await getRegistrantStatusEmailAndEvent(guestId);
  if (!registrant) {
    throw new Error("Registrant not found");
  }

  const wasPending = !registrant.is_registered;
  const nowRegistered = isRegistered === true;
  const existingPayload = registrant.qr_data
    ? parseRegistrantQrData(registrant.qr_data)
    : null;
  const token = existingPayload?.token
    ? existingPayload.token
    : registrant.qr_data ||
      createRegistrantQrToken({
        registrantId: registrant.registrant_id,
        eventId: registrant.event_id,
        userId: registrant.users_id,
      });
  const nextQrData = nowRegistered
    ? createRegistrantQrData({
        token,
        registrantId: registrant.registrant_id,
        userId: registrant.users_id,
        attendeeName:
          [registrant.users?.first_name, registrant.users?.last_name]
            .filter(Boolean)
            .join(" ") || null,
        attendeeEmail: registrant.users?.email ?? null,
        eventId: registrant.event_id,
        eventSlug: registrant.event?.slug ?? eventSlug,
        eventName: registrant.event?.event_name ?? null,
      })
    : null;

  const result = await persistGuestStatus(guestId, isRegistered, nextQrData);

  if (wasPending && nowRegistered && registrant.users?.email) {
    try {
      const eventName = registrant.event?.event_name?.trim() || "our event";
      await sendRegisteredConfirmationEmail(registrant.users.email, eventName);
      logger.info(
        `Registered confirmation email sent to ${registrant.users.email}`,
      );
    } catch (error) {
      logger.error("Failed to send registered confirmation email", {
        guestId,
        email: registrant.users.email,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function deleteGuest(guestId: string) {
  const { deleteGuest } = await import("@/repositories/registrantRepository");
  return await deleteGuest(guestId);
}

export async function setIsGoing(guestId: string, isGoing: boolean) {
  const { updateGuestIsGoing } =
    await import("@/repositories/registrantRepository");
  return await updateGuestIsGoing(guestId, isGoing);
}

export async function getEventRegistrants(eventId: string) {
  const { getRegistrantsByEvent } =
    await import("@/repositories/registrantRepository");
  return await getRegistrantsByEvent(eventId);
}
