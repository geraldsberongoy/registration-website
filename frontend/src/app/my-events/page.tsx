"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  Ticket,
} from "lucide-react";
import BokehBackground from "@/components/create-event/bokeh-background";
import Squares from "@/components/create-event/squares-background";
import { logoutAction } from "@/actions/authActions";
import { getMyEventsAction } from "@/actions/registrantActions";
import { useUserStore } from "@/store/useUserStore";
import { getLastViewedEventSlug } from "@/utils/last-viewed-event";

type MyEvent = {
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

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return "Date TBD";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function EventCardSkeleton() {
  return (
    <div className="animate-pulse bg-white/5 rounded-xl overflow-hidden border border-white/10">
      <div className="h-40 bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
        <div className="h-3 bg-white/5 rounded w-2/3" />
        <div className="pt-1">
          <div className="h-6 bg-white/5 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}

export default function MyEventsPage() {
  const router = useRouter();
  const { userId, loading: roleLoading, initialize } = useUserStore();
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (roleLoading) return;
    if (!userId) {
      router.replace("/");
      return;
    }

    async function load() {
      setLoading(true);
      const result = await getMyEventsAction();
      if (result.success && result.data) {
        setEvents(result.data as MyEvent[]);
      }
      setLoading(false);
    }

    load();
  }, [userId, roleLoading, router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutAction();
      useUserStore.getState().clearUser();
      const lastSlug = getLastViewedEventSlug();
      router.replace(lastSlug ? `/event/${lastSlug}` : "/");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0a1f14] via-[#0a1520] to-[#120c08] text-white relative overflow-x-hidden font-urbanist">
      <BokehBackground />
      <Squares direction="diagonal" speed={0.3} />

      <div className="relative z-10">
        <header className="flex items-center justify-between px-4 md:px-8 py-5 border-b border-white/10">
          <div>
            <h1 className="text-2xl font-bold text-white">My Events</h1>
            <p className="text-white/50 text-sm mt-0.5">
              Events you&apos;ve registered for
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[rgba(93,165,165,0.4)] bg-[rgba(15,30,30,0.6)] text-[#95b5b5] hover:bg-[rgba(35,60,60,0.6)] hover:text-[#9dd5d5] hover:border-[#5da5a5]/60 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </header>

        <main className="px-4 md:px-8 py-8 max-w-6xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Ticket className="w-8 h-8 text-white/20" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                No events yet
              </h2>
              <p className="text-white/50 text-sm mb-6 max-w-xs">
                You haven&apos;t registered for any events. Browse available
                events to get started.
              </p>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-5 py-2.5 bg-[#5da5a5]/20 hover:bg-[#5da5a5]/30 border border-[#5da5a5]/40 rounded-xl text-[#9dd5d5] text-sm font-medium transition-colors"
              >
                Go to Home
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((reg) => {
                const ev = reg.event;
                if (!ev?.slug) return null;
                const isApproved = reg.is_registered === true;

                return (
                  <button
                    key={reg.registrant_id}
                    type="button"
                    onClick={() => router.push(`/event/${ev.slug}`)}
                    className="group text-left bg-black/40 backdrop-blur-md rounded-xl overflow-hidden border border-white/10 hover:border-white/25 transition-all duration-200 hover:bg-black/50"
                  >
                    <div className="relative h-40 bg-gradient-to-br from-[#0a1f14] to-[#0a1520] overflow-hidden">
                      {ev.cover_image ? (
                        <Image
                          src={ev.cover_image}
                          alt={ev.event_name || "Event"}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Calendar className="w-12 h-12 text-white/10" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        {isApproved ? (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-300 text-xs font-medium backdrop-blur-sm">
                            <CheckCircle className="w-3 h-3" /> Approved
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-xs font-medium backdrop-blur-sm">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 group-hover:text-white/90">
                        {ev.event_name || "Untitled Event"}
                      </h3>
                      <div className="flex items-center gap-1.5 text-white/50 text-xs">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{formatEventDate(ev.start_date)}</span>
                      </div>
                      {ev.location && (
                        <div className="flex items-center gap-1.5 text-white/50 text-xs">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                      )}
                      {isApproved && reg.qr_data && (
                        <div className="flex items-center gap-1.5 text-emerald-400/70 text-xs pt-1">
                          <Ticket className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Ticket ready</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
