import {
  updateEventSurvey,
  getEventIdAndApprovalBySlug,
  getEventBySlug,
} from "@/repositories/eventRepository";
import {
  fetchSurveyResponse,
  insertSurveyResponse,
  updateSurveyResponse,
  getSurveyResponsesByEvent,
} from "@/repositories/surveyRepository";
import { getRegistrantByUserAndEvent, getRegistrantsByEvent } from "@/repositories/registrantRepository";
import { Guest } from "@/types/guest";

export async function saveEventSurveySettings(slug: string, surveyData: any) {
  // Authorization is handled by the server action
  await updateEventSurvey(slug, surveyData);
}

export async function submitSurvey(slug: string, userId: string, answers: Record<string, any>) {
  const event = await getEventIdAndApprovalBySlug(slug);
  if (!event) throw new Error("Event not found");

  const registration = await getRegistrantByUserAndEvent(userId, event.event_id);

  if (!registration) {
    throw new Error("You must be a registered attendee to answer this survey.");
  }

  const existingResponse = await fetchSurveyResponse(event.event_id, userId);

  if (existingResponse) {
    await updateSurveyResponse(existingResponse.survey_responses_id, answers);
  } else {
    await insertSurveyResponse(event.event_id, userId, answers);
  }
}

export interface SurveyDashboardStats {
  totalRegistered: number;
  attended: number;
  surveyAnswered: number;
  registeredWithoutSurvey: number;
}

export async function getSurveyDashboardStats(slug: string): Promise<SurveyDashboardStats> {
  const event = await getEventIdAndApprovalBySlug(slug);
  if (!event) throw new Error("Event not found");

  const [registrants, surveyResponses] = await Promise.all([
    getRegistrantsByEvent(event.event_id),
    getSurveyResponsesByEvent(event.event_id),
  ]);

  const totalRegistered = registrants.filter((r) => r.is_registered).length;
  const surveyAnswered = surveyResponses.length;
  const registeredWithoutSurvey = Math.max(0, totalRegistered - surveyAnswered);

  const attended = registrants.filter((r) => r.is_registered && r.check_in === true).length;

  return {
    totalRegistered,
    attended,
    surveyAnswered,
    registeredWithoutSurvey,
  };
}

function sanitizeCsvHeader(text: string): string {
  return text.replace(/"/g, '""').replace(/\n/g, " ").replace(/\r/g, "");
}

export async function exportSurveyDashboardCsv(slug: string): Promise<{ success: boolean; csvData?: string; error?: string }> {
  const eventRow = await getEventBySlug(slug);
  const event = await getEventIdAndApprovalBySlug(slug);
  if (!event) return { success: false, error: "Event not found" };

  const [registrants, surveyResponses] = await Promise.all([
    getRegistrantsByEvent(event.event_id),
    getSurveyResponsesByEvent(event.event_id),
  ]);

  const surveyConfig = eventRow?.post_event_survey as { questions?: { id: string; text: string }[] } | undefined;
  const questions = surveyConfig?.questions ?? [];
  const questionHeaders = questions.map((q) => sanitizeCsvHeader(q.text || `Q_${q.id}`));

  const baseHeaders = ["email", "first_name", "last_name", "survey_answered", "survey_completed_at"];
  const headers = [...baseHeaders, ...questionHeaders];

  const registeredGuests = registrants.filter((r) => r.is_registered) as Guest[];
  const responseByUserId = new Map(surveyResponses.map((r) => [r.users_id, r]));

  const rows = registeredGuests.map((guest) => {
    const response = responseByUserId.get(guest.users_id);
    const surveyAnswered = response ? "Yes" : "No";
    const completedAt = response?.created_at ? new Date(response.created_at).toISOString() : "";

    const baseRow = [
      guest.users?.email || "",
      guest.users?.first_name || "",
      guest.users?.last_name || "",
      surveyAnswered,
      completedAt,
    ];

    const answerCols = questions.map((q) => {
      const val = response?.answers?.[q.id];
      return val !== undefined && val !== null ? String(val) : "";
    });

    return [...baseRow, ...answerCols];
  });

  const csvData = [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  return { success: true, csvData };
}

export interface SurveyResponderRow {
  users_id: string;
  email: string;
  first_name: string;
  last_name: string;
  survey_answered: boolean;
  survey_completed_at: string | null;
  answers: Record<string, unknown> | null;
}

export async function getSurveyDashboardDetails(slug: string): Promise<SurveyResponderRow[]> {
  const event = await getEventIdAndApprovalBySlug(slug);
  if (!event) throw new Error("Event not found");

  const [registrants, surveyResponses] = await Promise.all([
    getRegistrantsByEvent(event.event_id),
    getSurveyResponsesByEvent(event.event_id),
  ]);

  const registeredGuests = registrants.filter((r) => r.is_registered) as Guest[];
  const responseByUserId = new Map(surveyResponses.map((r) => [r.users_id, r]));

  return registeredGuests.map((guest) => {
    const response = responseByUserId.get(guest.users_id);
    return {
      users_id: guest.users_id,
      email: guest.users?.email || "",
      first_name: guest.users?.first_name || "",
      last_name: guest.users?.last_name || "",
      survey_answered: !!response,
      survey_completed_at: response?.created_at ? new Date(response.created_at).toISOString() : null,
      answers: response?.answers ?? null,
    };
  });
}
