import { createClient } from "@/lib/supabase/server";
import { Guest } from "@/types/guest";

export async function getRegistrantByUserAndEvent(
  userId: string,
  eventId: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrants")
    .select("registrant_id")
    .eq("users_id", userId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch registrant: ${error.message}`);
  }

  return data;
}

export async function createRegistrant(registrantData: {
  event_id: string;
  users_id: string;
  terms_approval: boolean;
  form_answers: Record<string, string>;
  is_registered: boolean;
  is_going: boolean;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrants")
    .insert(registrantData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create registrant: ${error.message}`);
  }

  return data;
}

export async function updateGuestStatus(
  guestId: string,
  isRegistered: boolean,
  qrData: string | null,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrants")
    .update({
      is_registered: isRegistered,
      qr_data: qrData,
    })
    .eq("registrant_id", guestId)
    .select();

  if (error) throw new Error(`Failed to update guest status: ${error.message}`);
  return data;
}

export async function updateGuestIsGoing(guestId: string, isGoing: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("registrants")
    .update({ is_going: isGoing })
    .eq("registrant_id", guestId);

  if (error)
    throw new Error(`Failed to update guest is_going: ${error.message}`);
}

export async function getRegistrantStatusEmailAndEvent(guestId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrants")
    .select(
      `
      registrant_id,
      event_id,
      users_id,
      is_registered,
      qr_data,
      users:users!users_id (
        first_name,
        last_name,
        email
      ),
      event:events!event_id (
        event_name,
        slug
      )
    `,
    )
    .eq("registrant_id", guestId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch registrant details: ${error.message}`);
  }

  return data as {
    registrant_id: string;
    event_id: string;
    users_id: string;
    is_registered: boolean;
    qr_data: string | null;
    users: {
      first_name: string | null;
      last_name: string | null;
      email: string;
    } | null;
    event: { event_name: string | null; slug: string | null } | null;
  } | null;
}

export async function deleteGuest(guestId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("registrants")
    .delete()
    .eq("registrant_id", guestId);

  if (error) throw new Error(`Failed to delete guest: ${error.message}`);
}

export async function getRegistrantsByEvent(eventId: string): Promise<Guest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrants")
    .select(
      `
      registrant_id,
      event_id,
      users_id,
      terms_approval,
      form_answers,
      is_registered,
      is_going,
      qr_data,
      check_in,
      users!users_id (
        first_name,
        last_name,
        email
      )
    `,
    )
    .eq("event_id", eventId);

  if (error) {
    throw new Error(`Failed to fetch registrants: ${error.message}`);
  }

  return (data || []) as unknown as Guest[];
}

export async function getRegistrantById(
  registrantId: string,
): Promise<Guest | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrants")
    .select(
      `
      registrant_id,
      event_id,
      users_id,
      terms_approval,
      form_answers,
      is_registered,
      is_going,
      qr_data,
      users!users_id (
        first_name,
        last_name,
        email
      )
    `,
    )
    .eq("registrant_id", registrantId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch registrant: ${error.message}`);
  }

  return data as unknown as Guest;
}

export async function getRegistrantCountByEventSlug(
  eventSlug: string,
): Promise<number> {
  const supabase = await createClient();
  const { getEventIdAndApprovalBySlug } =
    await import("@/repositories/eventRepository");

  const eventData = await getEventIdAndApprovalBySlug(eventSlug);
  if (!eventData) {
    return 0;
  }

  const { count, error } = await supabase
    .from("registrants")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventData.event_id)
    .eq("is_registered", true);

  if (error) {
    throw new Error(`Failed to fetch registrant count: ${error.message}`);
  }

  return count ?? 0;
}

export type UserRegistrationWithEvent = {
  registrant_id: string;
  is_registered: boolean | null;
  is_going: boolean | null;
  qr_data: string | null;
  created_at: string | null;
  event: {
    event_id: string;
    slug: string | null;
    event_name: string | null;
    start_date: string | null;
    end_date: string | null;
    cover_image: string | null;
    location: string | null;
  } | null;
};

export async function getUserRegistrationsWithEvents(
  userId: string,
): Promise<UserRegistrationWithEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrants")
    .select(
      `
      registrant_id,
      is_registered,
      is_going,
      qr_data,
      created_at,
      event:events!event_id (
        event_id,
        slug,
        event_name,
        start_date,
        end_date,
        cover_image,
        location
      )
    `,
    )
    .eq("users_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch user registrations: ${error.message}`);
  }

  return (data || []) as unknown as UserRegistrationWithEvent[];
}

export async function updateRegistrantQrData(
  registrantId: string,
  qrData: string | null,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("registrants")
    .update({ qr_data: qrData })
    .eq("registrant_id", registrantId);

  if (error) {
    throw new Error(`Failed to update registrant QR data: ${error.message}`);
  }
}

export async function getRegistrantByQrData(
  qrData: string,
): Promise<Guest | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrants")
    .select(
      `
      registrant_id,
      event_id,
      users_id,
      terms_approval,
      form_answers,
      is_registered,
      is_going,
      qr_data,
      users!users_id (
        first_name,
        last_name,
        email
      )
    `,
    )
    .eq("qr_data", qrData)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch registrant by QR data: ${error.message}`);
  }

  return (data as Guest | null) ?? null;
}

export async function checkInRegistrant(registrantId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("registrants")
    .update({ check_in: true, check_in_time: new Date().toISOString() })
    .eq("registrant_id", registrantId);

  if (error) {
    throw new Error(`Failed to check in registrant: ${error.message}`);
  }
}
