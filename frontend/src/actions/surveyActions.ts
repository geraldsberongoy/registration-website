"use server";

import {
  SaveSurveySchema,
  SubmitSurveyResponseSchema,
} from "@/validators/surveyValidators";

import {
  saveEventSurveySettings,
  submitSurvey,
  getSurveyDashboardStats,
  exportSurveyDashboardCsv,
  getSurveyDashboardDetails,
} from "@/services/surveyService";
import { generateCertificate } from "@/services/certificateService";

import { logger } from "@/utils/logger";
import { canManageEvent } from "@/services/authService";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

import {
  withActionErrorHandler,
  UnauthorizedError,
} from "@/lib/utils/actionError";

export const saveEventSurveyAction = withActionErrorHandler(
  async (slug: string, surveyData: any) => {
    const validatedData = SaveSurveySchema.parse({ slug, surveyData });

    if (!(await canManageEvent(validatedData.slug))) {
      logger.warn(
        `Unauthorized survey update attempt for slug: ${validatedData.slug}`,
      );
      throw new UnauthorizedError(
        "Unauthorized. You must be the event organizer.",
      );
    }

    await saveEventSurveySettings(validatedData.slug, validatedData.surveyData);
    revalidatePath(`/admin/events/${validatedData.slug}/manage`);
    logger.info(
      `Successfully saved survey config for event: ${validatedData.slug}`,
    );
  },
);

export const submitSurveyResponseAction = withActionErrorHandler(
  async (slug: string, answers: Record<string, any>) => {
    const validatedData = SubmitSurveyResponseSchema.parse({ slug, answers });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.warn(
        `Unauthenticated survey submission attempt for slug: ${validatedData.slug}`,
      );
      throw new UnauthorizedError("You must be logged in to submit a survey.");
    }

    await submitSurvey(validatedData.slug, user.id, validatedData.answers);

    // Fetch the correct full name from the users table, instead of just auth metadata
    const { data: userProfile } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("users_id", user.id)
      .single();

    let userName =
      user.user_metadata?.full_name ||
      user.user_metadata?.first_name ||
      "Participant";

    // Prefer database record if available
    if (userProfile?.first_name && userProfile?.last_name) {
      userName = `${userProfile.first_name} ${userProfile.last_name}`;
    } else if (userProfile?.first_name) {
      userName = userProfile.first_name;
    }

    const certificateBase64 = await generateCertificate(
      userName,
      validatedData.slug,
    );

    revalidatePath(`/admin/events/${validatedData.slug}/manage`);
    logger.info(
      `Successfully submitted survey response for event: ${validatedData.slug} by user: ${user.id}`,
    );

    return {
      certificateBase64,
    };
  },
);

export const regenerateCertificateAction = withActionErrorHandler(
  async (slug: string) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError(
        "You must be logged in to regenerate a certificate.",
      );
    }

    // Fetch user profile
    const { data: userProfile } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("users_id", user.id)
      .single();

    let userName =
      user.user_metadata?.full_name ||
      user.user_metadata?.first_name ||
      "Participant";

    // Prefer database record if available
    if (userProfile?.first_name && userProfile?.last_name) {
      userName = `${userProfile.first_name} ${userProfile.last_name}`;
    } else if (userProfile?.first_name) {
      userName = userProfile.first_name;
    }

    const certificateBase64 = await generateCertificate(userName, slug);

    logger.info(
      `Certificate regenerated for event: ${slug} by user: ${user.id}`,
    );

    return {
      certificateBase64,
    };
  },
);

export const getSurveyDashboardStatsAction = withActionErrorHandler(
  async (slug: string) => {
    if (!(await canManageEvent(slug))) {
      logger.warn(`Unauthorized survey dashboard access for slug: ${slug}`);
      throw new UnauthorizedError("Unauthorized");
    }
    return await getSurveyDashboardStats(slug);
  },
);

export const getSurveyDashboardDetailsAction = withActionErrorHandler(
  async (slug: string) => {
    if (!(await canManageEvent(slug))) {
      logger.warn(
        `Unauthorized survey dashboard details access for slug: ${slug}`,
      );
      throw new UnauthorizedError("Unauthorized");
    }
    return await getSurveyDashboardDetails(slug);
  },
);

export const exportSurveyDashboardCsvAction = withActionErrorHandler(
  async (slug: string) => {
    if (!(await canManageEvent(slug))) {
      logger.warn(`Unauthorized survey export attempt for slug: ${slug}`);
      throw new UnauthorizedError("Unauthorized");
    }
    const result = await exportSurveyDashboardCsv(slug);
    if (!result.success) {
      throw new Error(result.error || "Failed to export survey dashboard");
    }
    logger.info(`Successfully exported survey dashboard for event: ${slug}`);
    return result;
  },
);
