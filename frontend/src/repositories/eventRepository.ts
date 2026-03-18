import { createClient } from "@/lib/supabase/server";

export async function getEventBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    throw new Error(`Failed to fetch event: ${error.message}`);
  }

  return data;
}

export async function getEventFormQuestions(slug: string): Promise<{ text: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("form_questions")
    .eq("slug", slug)
    .single();

  if (error || !data) return [];
  return (data.form_questions as { text: string }[]) || [];
}

export async function getEventIdAndApprovalBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("event_id, event_name, require_approval, status, registration_open")
    .eq("slug", slug)
    .single();

  if (error) {
    throw new Error(`Failed to fetch event: ${error.message}`);
  }

  if (!data) {
    throw new Error('Event not found');
  }

  return data;
}

export async function getOrganizerIdBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("organizer_id")
    .eq("slug", slug)
    .single();

  if (error) {
    throw new Error(`Failed to fetch event organizer: ${error.message}`);
  }

  return data;
}

export async function listEvents() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select("*");
  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  const events = data ?? [];
  if (events.length === 0) {
    return events;
  }

  const eventIds = events
    .map((event) => event.event_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  if (eventIds.length === 0) {
    return events;
  }

  const { data: registrants, error: registrantsError } = await supabase
    .from("registrants")
    .select("event_id")
    .in("event_id", eventIds)
    .eq("is_registered", true);

  if (registrantsError) {
    throw new Error(
      `Failed to fetch event registrant counts: ${registrantsError.message}`,
    );
  }

  const registeredCountByEventId = new Map<string, number>();
  for (const row of registrants ?? []) {
    if (!row.event_id) continue;
    registeredCountByEventId.set(
      row.event_id,
      (registeredCountByEventId.get(row.event_id) ?? 0) + 1,
    );
  }

  return events.map((event) => ({
    ...event,
    registered: registeredCountByEventId.get(event.event_id) ?? 0,
  }));
}

export async function updateEventDetails(slug: string, details: any) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update(details)
    .eq("slug", slug);
  if (error) throw new Error(`Failed to update event details: ${error.message}`);
}

export async function updateEventSettings(
  slug: string,
  requireApproval: boolean,
  registrationOpen: boolean,
) {
  const supabase = await createClient();

  const { data: updatedEvent, error } = await supabase
    .from("events")
    .update({
      require_approval: requireApproval,
      registration_open: registrationOpen,
      modified_at: new Date().toISOString(),
    })
    .eq("slug", slug)
    .select("event_id, slug, status, registration_open, require_approval")
    .maybeSingle();

  if (error) {
    if (error.message.includes("registration_open")) {
      throw new Error(
        "Database is missing `events.registration_open`. Run the latest Supabase migration, then try again.",
      );
    }
    throw new Error(`Failed to update event settings: ${error.message}`);
  }
  if (!updatedEvent) {
    throw new Error(
      "Failed to update event settings: no rows were updated. Check permissions and event ownership.",
    );
  }
}

export async function getEventQuestions(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("form_questions")
    .eq("slug", slug)
    .single();
  if (error) throw new Error(`Failed to load event questions: ${error.message}`);
  return data;
}

export async function updateEventQuestions(slug: string, questions: any[]) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      form_questions: questions,
      modified_at: new Date().toISOString(),
    })
    .eq("slug", slug);
  if (error) throw new Error(`Failed to update questions: ${error.message}`);
}

export async function updateEventSurvey(slug: string, surveyData: any) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ post_event_survey: surveyData })
    .eq("slug", slug);

  if (error) throw new Error(`Failed to update event survey: ${error.message}`);
}

export async function insertEvent(eventData: import("@/types/event").EventInsertData): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .insert(eventData);

  if (error) {
    throw new Error(`Failed to insert event into database: ${error.message}`);
  }
}
