import { getEventBySlug } from "@/repositories/eventRepository";
import { getGuestCountByEvent } from "@/repositories/guestRepository";
import { EventData, Question } from "@/types/event";
import { isRegistrationOpenFromDb } from "@/utils/registration-open";

function mapRowToEvent(row: any): EventData {
  const startDateObj = row.start_date ? new Date(row.start_date) : null;
  const endDateObj = row.end_date ? new Date(row.end_date) : null;

  let questions: Question[] = [];
  if (row.form_questions) {
    if (Array.isArray(row.form_questions)) {
      // Map all question properties, ensuring type field exists
      questions = row.form_questions.map((q: any) => ({
        id: q.id,
        text: q.text,
        required: q.required ?? true,
        type: q.type || "text",
        options: q.options,
        allowedFileTypes: q.allowedFileTypes,
        validationPattern: q.validationPattern,
        validationMessage: q.validationMessage,
      }));
    } else if (typeof row.form_questions === "object") {
      questions = Object.entries(row.form_questions).map(
        ([key, value], index) => ({
          id: index + 1,
          text: String(value),
          required: true,
          type: "text" as const,
        }),
      );
    }
  }

  return {
    slug: row.slug,
    title: row.event_name ?? "Untitled Event",
    status: row.status ?? "active",
    registrationOpen: isRegistrationOpenFromDb({
      registration_open: row.registration_open,
      status: row.status,
    }),
    organizerId: row.organizer_id,
    startDate: startDateObj ? startDateObj.toISOString().slice(0, 10) : "",
    startTime: startDateObj ? startDateObj.toISOString().slice(11, 16) : "",
    endDate: endDateObj ? endDateObj.toISOString().slice(0, 10) : "",
    endTime: endDateObj ? endDateObj.toISOString().slice(11, 16) : "",
    location: row.location ?? "",
    description: row.description ?? "",
    ticketPrice: row.price ?? "",
    capacity:
      row.capacity !== null && row.capacity !== undefined
        ? String(row.capacity)
        : "",
    requireApproval: row.require_approval ?? false,
    coverImage: row.cover_image ?? undefined,
    theme: row.theme ?? "Minimal Dark",
    questions,
    createdAt: row.created_at ?? new Date().toISOString(),
    postEventSurvey: row.post_event_survey,
    certificateConfig: row.certificate_config,
  };
}

export async function getEventDetails(slug: string) {
  if (!slug) {
    throw new Error("Missing slug");
  }

  const row = await getEventBySlug(slug);
  const event = mapRowToEvent(row);

  if (row.registered !== null && row.registered !== undefined) {
    event.registeredCount = row.registered;
  } else {
    const { getRegistrantCountByEventSlug } = await import("@/repositories/registrantRepository");
    event.registeredCount = await getRegistrantCountByEventSlug(slug);
  }

  return event;
}

export async function listAllEvents() {
  const { listEvents } = await import("@/repositories/eventRepository");
  return await listEvents();
}

export async function updateEventDetails(
  slug: string,
  details: {
    title?: string | null;
    description?: string | null;
    startDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;
    capacity?: string | null;
    coverImage?: string | null;
    ticketPrice?: string | null;
    requireApproval?: boolean;
  },
) {
  const { updateEventDetails: repoUpdate } =
    await import("@/repositories/eventRepository");

  // Transform datetime fields
  const startDateTime =
    details.startDate && details.startTime
      ? new Date(`${details.startDate}T${details.startTime}`).toISOString()
      : undefined;

  const endDateTime =
    details.startDate && details.endTime
      ? new Date(`${details.startDate}T${details.endTime}`).toISOString()
      : undefined;

  // Parse capacity
  const parsedCapacity = details.capacity ? Number(details.capacity) : null;

  // Validate capacity if provided
  if (
    parsedCapacity !== null &&
    (isNaN(parsedCapacity) || parsedCapacity <= 0)
  ) {
    throw new Error("Capacity must be a positive number");
  }

  // Map to database schema
  const mappedDetails: Record<string, unknown> = {
    event_name: details.title,
    description: details.description,
    location: details.location,
    price: details.ticketPrice,
    capacity: parsedCapacity,
    require_approval: details.requireApproval,
    modified_at: new Date().toISOString(),
  };

  // Add datetime fields if provided
  if (startDateTime) mappedDetails.start_date = startDateTime;
  if (endDateTime) mappedDetails.end_date = endDateTime;
  if ("coverImage" in details) mappedDetails.cover_image = details.coverImage;

  await repoUpdate(slug, mappedDetails);
}

export async function updateEventSettings(
  slug: string,
  requireApproval: boolean,
  registrationOpen: boolean,
) {
  const { updateEventSettings: repoUpdateSettings } =
    await import("@/repositories/eventRepository");
  await repoUpdateSettings(slug, requireApproval, registrationOpen);
}

export async function saveRegistrationQuestions(
  slug: string,
  questions: import("@/types/event").Question[],
) {
  const { updateEventQuestions } =
    await import("@/repositories/eventRepository");
  await updateEventQuestions(slug, questions);
}

export async function addRegistrationQuestion(
  slug: string,
  text: string,
  required: boolean,
) {
  const { getEventQuestions, updateEventQuestions } =
    await import("@/repositories/eventRepository");

  const raw = await getEventQuestions(slug);
  const existingQuestions = Array.isArray(raw?.form_questions)
    ? raw.form_questions
    : [];

  const newQuestion = {
    id: Date.now(),
    text,
    required,
    type: "text" as const,
  };

  const updatedQuestions = [...existingQuestions, newQuestion];
  await updateEventQuestions(slug, updatedQuestions);
}

export async function updateRegistrationQuestion(
  slug: string,
  questionId: number,
  text: string,
  required: boolean,
) {
  const { getEventQuestions, updateEventQuestions } =
    await import("@/repositories/eventRepository");

  const raw = await getEventQuestions(slug);
  const existingQuestions = Array.isArray(raw?.form_questions)
    ? raw.form_questions
    : [];

  const updatedQuestions = existingQuestions.map((q: any) =>
    q.id === questionId ? { ...q, text, required } : q,
  );

  await updateEventQuestions(slug, updatedQuestions);
}

export async function removeRegistrationQuestion(
  slug: string,
  questionId: number,
) {
  const { getEventQuestions, updateEventQuestions } =
    await import("@/repositories/eventRepository");

  const raw = await getEventQuestions(slug);
  const existingQuestions = Array.isArray(raw?.form_questions)
    ? raw.form_questions
    : [];

  const updatedQuestions = existingQuestions.filter(
    (q: any) => q.id !== questionId,
  );

  await updateEventQuestions(slug, updatedQuestions);
}

export async function createEvent(
  eventData: import("@/types/event").CreateEventInput,
  userId: string,
): Promise<string> {
  const { insertEvent } = await import("@/repositories/eventRepository");
  const { generateSlug } = await import("@/utils/slug");

  if (!userId) {
    throw new Error("User ID is required to create an event");
  }

  // Generate unique slug for the event
  const slug = generateSlug(eventData.title);

  // Transform capacity: parse as integer or set to null
  const parsedCapacity =
    eventData.capacity &&
    eventData.capacity !== "Unlimited" &&
    eventData.capacity.trim() !== ""
      ? parseInt(eventData.capacity, 10)
      : null;

  // Validate parsed capacity
  if (
    parsedCapacity !== null &&
    (isNaN(parsedCapacity) || parsedCapacity <= 0)
  ) {
    throw new Error("Capacity must be a positive number");
  }

  // Transform questions array for database
  const formQuestions =
    eventData.questions && eventData.questions.length > 0
      ? eventData.questions
      : null;

  // Build start date
  const startDate = new Date(
    `${eventData.startDate}T${eventData.startTime}`,
  ).toISOString();

  // Build end date if provided
  const endDate =
    eventData.endDate && eventData.endTime
      ? new Date(`${eventData.endDate}T${eventData.endTime}`).toISOString()
      : null;

  // Map to database schema
  const insertData: import("@/types/event").EventInsertData = {
    organizer_id: userId,
    event_name: eventData.title,
    slug,
    start_date: startDate,
    end_date: endDate,
    location: eventData.location || "",
    description: eventData.description || null,
    price: eventData.ticketPrice || "Free",
    capacity: parsedCapacity,
    require_approval: eventData.requireApproval || false,
    form_questions: formQuestions,
    status: "active",
    registration_open: true,
    cover_image: eventData.coverImage || null,
  };

  // Persist to database
  await insertEvent(insertData);

  return slug;
}
