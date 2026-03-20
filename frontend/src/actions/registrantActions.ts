"use server";

import { revalidatePath } from "next/cache";
import {
  CreateRegistrantSchema,
  CreateRegistrantInput,
  UpdateGuestStatusSchema,
  DeleteGuestSchema,
} from "@/validators/registrantValidators";
import {
  registerForEvent,
  updateGuestStatus,
  deleteGuest,
  setIsGoing,
} from "@/services/registrantService";
import { canManageEvent } from "@/services/authService";
import { logger } from "@/utils/logger";
import type { Guest } from "@/types/guest";
import {
  withActionErrorHandler,
  UnauthorizedError,
} from "@/lib/utils/actionError";

export const createRegistrantAction = withActionErrorHandler(
  async (data: CreateRegistrantInput) => {
    const validatedData = CreateRegistrantSchema.parse(data);
    const result = await registerForEvent(validatedData);

    revalidatePath(`/event/${validatedData.event_id}`);
    revalidatePath(`/admin/events/${validatedData.event_id}/manage`);

    return { result };
  },
);

export const updateGuestStatusAction = withActionErrorHandler(
  async (data: any, slug: string) => {
    const validatedData = UpdateGuestStatusSchema.parse(data);

    if (!(await canManageEvent(slug))) {
      logger.warn(
        `Unauthorized guest update attempt by user for guest ${validatedData.guestId}`,
      );
      throw new UnauthorizedError("Unauthorized");
    }

    const updatedRows = await updateGuestStatus(
      validatedData.guestId,
      validatedData.isRegistered,
      slug,
    );
    revalidatePath(`/admin/events/${slug}/manage`);
    revalidatePath(`/event/${slug}`);
    logger.info(`Successfully updated guest ${validatedData.guestId} status`);

    return {
      guest: Array.isArray(updatedRows) ? (updatedRows[0] ?? null) : null,
    };
  },
);

export const deleteGuestAction = withActionErrorHandler(
  async (data: any, slug: string) => {
    const validatedData = DeleteGuestSchema.parse(data);

    if (!(await canManageEvent(slug))) {
      logger.warn(
        `Unauthorized guest deletion attempt by user for guest ${validatedData.guestId}`,
      );
      throw new UnauthorizedError("Unauthorized");
    }

    await deleteGuest(validatedData.guestId);
    revalidatePath(`/admin/events/${slug}/manage`);
    logger.info(`Successfully deleted guest ${validatedData.guestId}`);
  },
);

export const updateGuestIsGoingAction = withActionErrorHandler(
  async (data: { guestId: string; isGoing: boolean }, slug: string) => {
    if (!(await canManageEvent(slug))) {
      throw new UnauthorizedError("Unauthorized");
    }
    await setIsGoing(data.guestId, data.isGoing);
    revalidatePath(`/admin/events/${slug}/manage`);
    revalidatePath(`/event/${slug}`);
  },
);

export const updateGuestCheckInAction = withActionErrorHandler(
  async (data: { guestId: string; checkedIn: boolean }, slug: string) => {
    if (!(await canManageEvent(slug))) {
      throw new UnauthorizedError("Unauthorized");
    }
    const { updateGuestCheckInStatus } =
      await import("@/services/registrantService");
    await updateGuestCheckInStatus(data.guestId, data.checkedIn);
    revalidatePath(`/admin/events/${slug}/manage`);
  },
);

export const setIsGoingAction = withActionErrorHandler(
  async (eventSlug: string, isGoing: boolean) => {
    const { createClient } = await import("@/lib/supabase/server");
    const { getEventIdAndApprovalBySlug } =
      await import("@/repositories/eventRepository");
    const { getRegistrantByUserAndEvent } =
      await import("@/repositories/registrantRepository");
    const { setIsGoing } = await import("@/services/registrantService");

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new UnauthorizedError("Not authenticated");
    }

    const eventData = await getEventIdAndApprovalBySlug(eventSlug);
    if (!eventData) {
      throw new Error("Event not found");
    }

    const registrant = await getRegistrantByUserAndEvent(
      user.id,
      eventData.event_id,
    );
    if (!registrant) {
      throw new Error("Registration not found");
    }

    await setIsGoing(registrant.registrant_id, isGoing);
    revalidatePath(`/event/${eventSlug}`);
    return { success: true };
  },
);

export const exportGuestsAction = withActionErrorHandler(
  async (slug: string) => {
    if (!(await canManageEvent(slug))) {
      logger.warn(`Unauthorized guest export attempt for event ${slug}`);
      throw new UnauthorizedError("Unauthorized");
    }

    const { exportGuestsToCSV } = await import("@/services/guestService");
    const result = await exportGuestsToCSV(slug);

    if (result.success) {
      logger.info(`Successfully exported guests for event ${slug}`);
    } else {
      throw new Error(result.error || "Failed to export guests");
    }

    return result;
  },
);

export const checkUserRegistrationAction = withActionErrorHandler(
  async (eventSlug: string) => {
    const { getRegistrantByUserAndEvent } =
      await import("@/repositories/registrantRepository");
    const { getEventIdAndApprovalBySlug } =
      await import("@/repositories/eventRepository");
    const { createClient } = await import("@/lib/supabase/server");

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        isRegistered: false,
        registrationStatus: null as "approved" | "pending" | null,
      };
    }

    const eventData = await getEventIdAndApprovalBySlug(eventSlug);
    if (!eventData) {
      throw new Error("Event not found");
    }

    const registrant = await getRegistrantByUserAndEvent(
      user.id,
      eventData.event_id,
    );

    if (!registrant) {
      return {
        isRegistered: false,
        registrationStatus: null as "approved" | "pending" | null,
      };
    }

    return {
      isRegistered: true,
      registrationStatus: (registrant.is_registered
        ? "approved"
        : "pending") as "approved" | "pending",
      isGoing: registrant.is_going ?? null,
      qrData: (registrant.qr_data as string | null) ?? null,
      guest: registrant as unknown as Guest,
    };
  },
);

export const getMyEventsAction = withActionErrorHandler(async () => {
  const { createClient } = await import("@/lib/supabase/server");
  const { getUserRegistrationsWithEvents } =
    await import("@/repositories/registrantRepository");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new UnauthorizedError("Not authenticated");
  }

  return await getUserRegistrationsWithEvents(user.id);
});
