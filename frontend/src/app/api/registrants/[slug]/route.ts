import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canManageEvent } from "@/services/authService";
import { Guest } from "@/types/guest";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    const canManage = await canManageEvent(slug);
    if (!canManage) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = await createClient();

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("event_id")
      .eq("slug", slug)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { data: guests, error: guestsError } = await supabase
      .from("registrants")
      .select(
        `
        registrant_id,
        created_at,
        event_id,
        users_id,
        terms_approval,
        form_answers,
        is_registered,
        is_going,
        check_in,
        check_in_time,
        qr_data,
        check_in,
        users!users_id (
          first_name,
          last_name,
          email
        )
      `,
      )
      .eq("event_id", event.event_id);

    if (guestsError) {
      return NextResponse.json(
        { error: "Failed to fetch guests" },
        { status: 500 },
      );
    }

    const guestsForEvent = (guests || []).filter(
      (guest) => guest.event_id === event.event_id,
    );

    return NextResponse.json({ guests: guestsForEvent as unknown as Guest[] });
  } catch (error) {
    console.error("Error fetching registrants:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
