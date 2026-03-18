"use client";

import { useState, useEffect } from "react";
import { AdminNavbar } from "@/components/admin/admin-navbar";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { ActiveEvents } from "@/components/admin/active-events";
import BokehBackground from "@/components/create-event/bokeh-background";
import Squares from "@/components/create-event/squares-background";
import { listEventsAction } from "@/actions/eventActions";

type DbEvent = {
  slug?: string;
  event_name?: string;
  title?: string;
  start_date?: string;
  registered?: number;
  capacity?: number;
  status?: string;
  cover_image?: string;
};

export default function EventsPage() {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      const result = await listEventsAction();

      if (result.success && result.data) {
        setEvents(result.data);
      }
      setLoading(false);
    }

    loadEvents();
  }, []);

  // Only show events that have a slug so URLs always use the slug
  const transformedEvents = events
    .filter((event): event is DbEvent & { slug: string } => !!event.slug)
    .map((event) => ({
      id: event.slug,
      // Support both legacy 'title' and new 'event_name'
      title: event.event_name || event.title || "Untitled Event",
      date: event.start_date ?? "",
      registered: event.registered ?? 0,
      capacity: event.capacity ?? 0,
      status: event.status ?? "active",
      coverImage: event.cover_image ?? undefined,
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1f14] via-[#0a1520] to-[#120c08] text-white relative overflow-hidden font-[family-name:var(--font-urbanist)]">
      <BokehBackground />
      <Squares direction="diagonal" speed={0.3} />

      <div className="relative z-10">
        <AdminNavbar activeTab="events" />
        <main className="flex-1 px-4 md:px-8 py-8 pt-28">
          <div className="max-w-7xl mx-auto">
            <AdminBreadcrumbs
              items={[
                { label: "Dashboard", href: "/admin/dashboard" },
                { label: "Events" },
              ]}
            />
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#06b6d4] mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading events...</p>
                </div>
              </div>
            ) : (
              <ActiveEvents events={transformedEvents} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
