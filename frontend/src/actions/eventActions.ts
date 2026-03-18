"use server";

import { z } from "zod";
import {
  EventSlugSchema,
  UpdateEventDetailsSchema,
  UpdateEventSettingsSchema,
  RegistrationQuestionSchema,
  CreateEventSchema,
} from "@/validators/eventValidators";

import {
  getEventDetails,
  listAllEvents,
  updateEventDetails,
  updateEventSettings,
  addRegistrationQuestion,
  updateRegistrationQuestion,
  removeRegistrationQuestion,
  saveRegistrationQuestions,
  createEvent,
} from "@/services/eventService";
import { getDashboardAnalytics } from "@/services/dashboardService";

import { logger } from "@/utils/logger";
import { canManageEvent } from "@/services/authService";
import { revalidatePath } from "next/cache";
import {
  withActionErrorHandler,
  UnauthorizedError,
} from "@/lib/utils/actionError";

export const getEventAction = withActionErrorHandler(async (slug: string) => {
  const validatedData = EventSlugSchema.parse({ slug });
  const event = await getEventDetails(validatedData.slug);

  logger.info(`Fetched event details for slug: ${slug}`);
  return { event };
});

export const listEventsAction = withActionErrorHandler(async () => {
  const data = await listAllEvents();
  logger.info("Fetched all events list");
  return data;
});

export const getDashboardAnalyticsAction = withActionErrorHandler(async () => {
  const data = await getDashboardAnalytics();
  logger.info("Fetched dashboard analytics");
  return data;
});

export async function updateEventDetailsAction(data: unknown) {
  try {
    // Validate input data
    const validatedData = UpdateEventDetailsSchema.parse(data);
    const { slug, ...details } = validatedData;

    // Check authorization
    if (!(await canManageEvent(slug))) {
      logger.warn("Unauthorized event details update attempt", { slug });
      return {
        success: false,
        error: "You are not authorized to update this event",
      };
    }

    // Call service layer
    await updateEventDetails(slug, details);

    // Revalidate Next.js cache
    revalidatePath(`/admin/events/${slug}/manage`);
    revalidatePath(`/event/${slug}`);

    logger.info("Successfully updated event details", { slug });
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map((e: any) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      logger.error("Event update validation failed", { errors: error.issues });
      return { success: false, error: `Validation error: ${errorMessage}` };
    }

    const errorMessage =
      error instanceof Error ? error.message : "Failed to update event details";
    logger.error("Failed to update event details", error);
    return { success: false, error: errorMessage };
  }
}

export async function updateEventSettingsAction(data: unknown) {
  try {
    // Validate input data
    const validatedData = UpdateEventSettingsSchema.parse(data);

    // Check authorization
    if (!(await canManageEvent(validatedData.slug))) {
      logger.warn("Unauthorized event settings update attempt", {
        slug: validatedData.slug,
      });
      return {
        success: false,
        error: "You are not authorized to update this event",
      };
    }

    // Call service layer
    await updateEventSettings(
      validatedData.slug,
      validatedData.requireApproval,
      validatedData.registrationOpen,
    );

    // Revalidate Next.js cache
    revalidatePath(`/admin/events/${validatedData.slug}/manage`);
    revalidatePath(`/event/${validatedData.slug}`);

    logger.info("Successfully updated event settings", {
      slug: validatedData.slug,
    });
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map((e: any) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      logger.error("Event settings validation failed", {
        errors: error.issues,
      });
      return { success: false, error: `Validation error: ${errorMessage}` };
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update event settings";
    logger.error("Failed to update event settings", error);
    return { success: false, error: errorMessage };
  }
}

export async function addRegistrationQuestionAction(data: unknown) {
  try {
    // Validate input data
    const validatedData = RegistrationQuestionSchema.parse(data);

    // Check authorization
    if (!(await canManageEvent(validatedData.slug))) {
      logger.warn("Unauthorized question addition attempt", {
        slug: validatedData.slug,
      });
      return {
        success: false,
        error: "You are not authorized to update this event",
      };
    }

    if (!validatedData.text) {
      return { success: false, error: "Question text is required" };
    }

    // Call service layer
    await addRegistrationQuestion(
      validatedData.slug,
      validatedData.text,
      !!validatedData.required,
    );

    // Revalidate Next.js cache
    revalidatePath(`/admin/events/${validatedData.slug}/manage`);
    revalidatePath(`/event/${validatedData.slug}/register`);

    logger.info("Successfully added registration question", {
      slug: validatedData.slug,
    });
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map((e: any) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      logger.error("Question validation failed", { errors: error.issues });
      return { success: false, error: `Validation error: ${errorMessage}` };
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to add registration question";
    logger.error("Failed to add registration question", error);
    return { success: false, error: errorMessage };
  }
}

export async function updateRegistrationQuestionAction(data: unknown) {
  try {
    // Validate input data
    const validatedData = RegistrationQuestionSchema.parse(data);

    // Check authorization
    if (!(await canManageEvent(validatedData.slug))) {
      logger.warn("Unauthorized question update attempt", {
        slug: validatedData.slug,
      });
      return {
        success: false,
        error: "You are not authorized to update this event",
      };
    }

    if (!validatedData.questionId || !validatedData.text) {
      return { success: false, error: "Question ID and text are required" };
    }

    // Call service layer
    await updateRegistrationQuestion(
      validatedData.slug,
      validatedData.questionId,
      validatedData.text,
      !!validatedData.required,
    );

    // Revalidate Next.js cache
    revalidatePath(`/admin/events/${validatedData.slug}/manage`);
    revalidatePath(`/event/${validatedData.slug}/register`);

    logger.info("Successfully updated registration question", {
      slug: validatedData.slug,
      questionId: validatedData.questionId,
    });
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map((e: any) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      logger.error("Question validation failed", { errors: error.issues });
      return { success: false, error: `Validation error: ${errorMessage}` };
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update registration question";
    logger.error("Failed to update registration question", error);
    return { success: false, error: errorMessage };
  }
}

export async function removeRegistrationQuestionAction(data: unknown) {
  try {
    // Validate input data
    const validatedData = RegistrationQuestionSchema.parse(data);

    // Check authorization
    if (!(await canManageEvent(validatedData.slug))) {
      logger.warn("Unauthorized question removal attempt", {
        slug: validatedData.slug,
      });
      return {
        success: false,
        error: "You are not authorized to update this event",
      };
    }

    if (!validatedData.questionId) {
      return { success: false, error: "Question ID is required" };
    }

    // Call service layer
    await removeRegistrationQuestion(
      validatedData.slug,
      validatedData.questionId,
    );

    // Revalidate Next.js cache
    revalidatePath(`/admin/events/${validatedData.slug}/manage`);
    revalidatePath(`/event/${validatedData.slug}/register`);

    logger.info("Successfully removed registration question", {
      slug: validatedData.slug,
      questionId: validatedData.questionId,
    });
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map((e: any) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      logger.error("Question validation failed", { errors: error.issues });
      return { success: false, error: `Validation error: ${errorMessage}` };
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to remove registration question";
    logger.error("Failed to remove registration question", error);
    return { success: false, error: errorMessage };
  }
}

export async function saveRegistrationQuestionsAction(
  slug: string,
  questions: import("@/types/event").Question[],
) {
  try {
    if (!(await canManageEvent(slug))) {
      return {
        success: false,
        error: "You are not authorized to update this event",
      };
    }

    await saveRegistrationQuestions(slug, questions);

    revalidatePath(`/admin/events/${slug}/manage`);
    revalidatePath(`/event/${slug}/register`);

    logger.info("Successfully saved registration questions", { slug });
    return { success: true };
  } catch (error: any) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to save registration questions";
    logger.error("Failed to save registration questions", error);
    return { success: false, error: errorMessage };
  }
}

export async function createEventAction(data: unknown) {
  try {
    // Validate input data using Zod schema
    const validatedData = CreateEventSchema.parse(data);

    // Get current user ID
    const { getUserRoleAction } = await import("@/actions/authActions");
    const roleResponse = await getUserRoleAction();

    // Check if user is authenticated
    if (!roleResponse.success || !roleResponse.data?.userId) {
      logger.warn("Unauthorized event creation attempt - no user session", {
        hasResponse: !!roleResponse,
        hasData: !!roleResponse.data,
        userId: roleResponse.data?.userId,
      });
      return {
        success: false,
        error:
          "You must be logged in to create an event. Please log in and try again.",
      };
    }

    const userId = roleResponse.data.userId;

    // Call service layer to create the event
    const newSlug = await createEvent(validatedData, userId);

    // Revalidate Next.js cache for admin dashboard
    revalidatePath("/admin/dashboard");
    revalidatePath("/");

    logger.info("Successfully created new event", { slug: newSlug, userId });
    return { success: true, slug: newSlug };
  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map((e: any) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      logger.error("Event creation validation failed", {
        errors: error.issues,
      });
      return { success: false, error: `Validation error: ${errorMessage}` };
    }

    // Handle other errors
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create event";
    logger.error("Failed to create event", error);
    return { success: false, error: errorMessage };
  }
}

export const uploadEventImageAction = withActionErrorHandler(
  async (formData: FormData) => {
    const file = formData.get("file") as File;

    if (!file) {
      throw new Error("No file provided");
    }

    // Basic validation: must be an image and under 5MB
    if (!file.type.startsWith("image/")) {
      throw new Error("File must be an image");
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
    if (file.size > MAX_SIZE) {
      throw new Error("Image must be less than 5MB");
    }

    // Verify auth session exists to allow upload
    const { getUserRoleAction } = await import("@/actions/authActions");
    const roleResponse = await getUserRoleAction();

    if (!roleResponse.success || !roleResponse.data?.userId) {
      logger.warn("Unauthorized image upload attempt");
      throw new UnauthorizedError("You must be logged in to upload images");
    }

    const { createClient } = await import("@/lib/supabase/server");
    const { uploadEventCoverImage } = await import("@/lib/storage/file-upload");
    const supabase = await createClient();

    // Call the storage utility
    const url = await uploadEventCoverImage(supabase, file);

    logger.info("Successfully uploaded event image", {
      userId: roleResponse.data.userId,
    });
    return { url };
  },
);
