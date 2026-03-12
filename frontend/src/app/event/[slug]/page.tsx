"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LogOut, Clock } from "lucide-react";
import BokehBackground from "@/components/create-event/bokeh-background";
import Squares from "@/components/create-event/squares-background";
import { LoadingScreen } from "@/components/ui/loading-screen"; 
import { ErrorState } from "@/components/ui/error-state";
import { EventCoverImage } from "@/components/event/event-cover-image";
import { EventDateTime } from "@/components/event/event-date-time";
import { EventLocation } from "@/components/event/event-location";
import { EventManageCard } from "@/components/event/event-manage-card";
import { EventRegistrationCard } from "@/components/event/event-registration-card";
import { EventShareCard } from "@/components/event/event-share-card";
import { EventAbout } from "@/components/event/event-about";
import { EventHost } from "@/components/event/event-host";
import { LocationMapPreview } from "@/components/event/location-map-preview";
import { useEvent } from "@/hooks/event/use-event";
import { getCurrentUserEmail } from "@/app/event/actions"; 

import { setLastViewedEventSlug } from "@/utils/last-viewed-event";
import { logoutAction } from "@/actions/authActions";
import { getUserInfoAction } from "@/actions/userActions";
import { checkUserRegistrationAction } from "@/actions/registrantActions";
import { useUserStore } from "@/store/useUserStore";

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const { event, loading, error, refetch } = useEvent(slug);
  const { role, userId, loading: roleLoading, initialize } = useUserStore();
  const [hostName, setHostName] = useState<string | undefined>(undefined);
  const [hostEmail, setHostEmail] = useState<string | undefined>(undefined);
  const [loggingOut, setLoggingOut] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<{
    isRegistered: boolean;
    registrationStatus: "approved" | "pending" | null;
    qrUrl?: string | null;
  } | null>(null);

  const isLoggedIn = !roleLoading && userId != null;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutAction();
      useUserStore.getState().clearUser();
      router.replace("/");
    } finally {
      setLoggingOut(false);
    }
  };

  const canManage =
    !roleLoading &&
    event &&
    (role === "admin" || (userId != null && userId === event.organizerId));

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    async function loadHostInfo() {
      if (!event?.organizerId) {
        setHostName(undefined);
        setHostEmail(undefined);
        return;
      }

      try {
        // Fetch organizer's details using the server action
        const result = await getUserInfoAction({ userId: event.organizerId });
        
        if (result.success && result.data) {
          // Set name (full name if available, otherwise fallback)
          const displayName = result.data.fullName || result.data.email || "Event Organizer";
          setHostName(displayName);
          
          // Set email
          setHostEmail(result.data.email || undefined);
        } else {
          // Fallback: check if it's the current logged-in user using your Server Action
          const currentUser = await getCurrentUserEmail();
          
          if (currentUser && currentUser.id === event.organizerId) {
            setHostName(currentUser.email ?? "You");
            setHostEmail(currentUser.email ?? undefined);
          } else {
            setHostName("Event Organizer");
            setHostEmail(undefined);
          }
        }
      } catch (e) {
        console.error("Failed to load organizer info:", e);
        setHostName("Event Organizer");
        setHostEmail(undefined);
      }
    }

    loadHostInfo();
  }, [event?.organizerId]);

  useEffect(() => {
    if (slug) setLastViewedEventSlug(slug);
  }, [slug]);

  useEffect(() => {
    async function checkRegistration() {
      if (!userId || !slug) return;
      
      try {
        const result = await checkUserRegistrationAction(slug);
        if (result.success && result.data) {
          setRegistrationStatus(result.data);
        }
      } catch (err) {
        console.error("Failed to check registration status:", err);
      }
    }

    checkRegistration();
  }, [userId, slug, event]);

  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    if (refreshParam) {
      router.refresh();
      refetch();
      const url = new URL(window.location.href);
      url.searchParams.delete('refresh');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, refetch, router]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        router.refresh();
        refetch();
      }
    };

    const handleFocus = () => {
      router.refresh();
      refetch();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetch, router]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#0a1f14] via-[#0a1520] to-[#120c08] text-white relative overflow-hidden font-montserrat">
        <BokehBackground />
        <Squares direction="diagonal" speed={0.3} />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
        <LoadingScreen message="LOADING EVENT..." colorTheme="orange" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <ErrorState
        title="Event not found"
        message="The event you're looking for doesn't exist or has been removed."
        onAction={() => router.push("/")}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0a1f14] via-[#0a1520] to-[#120c08] text-white relative overflow-x-hidden font-montserrat">
      <BokehBackground />
      <Squares direction="diagonal" speed={0.3} />

      {/* Logout - top right, only when logged in */}
      {isLoggedIn && (
        <div className="fixed top-4 right-4 z-20">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[rgba(93,165,165,0.4)] bg-[rgba(15,30,30,0.6)] text-[#95b5b5] hover:bg-[rgba(35,60,60,0.6)] hover:text-[#9dd5d5] hover:border-[#5da5a5]/60 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        </div>
      )}

      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 pb-16">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr] gap-8 lg:gap-10 xl:gap-12">
          {/* Left Column - Cover Image (Desktop: + About + Hosted By) */}
          <div className="animate-fade-in space-y-6">
            <EventCoverImage src={event.coverImage || ""} alt={event.title} />

            {/* Share event - below picture */}
            <EventShareCard eventSlug={slug} eventTitle={event.title} />

            {/* Manage Event Card - only for admins or event organizer */}
            {canManage && <EventManageCard eventSlug={slug} />}

            {/* Hosted By - Desktop Only */}
            <EventHost
              hostName={hostName}
              hostEmail={hostEmail}
              className="hidden lg:block border-t border-white/10 pt-6"
            />
          </div>

          {/* Right Column - Event Info */}
          <div className="animate-fade-in animate-delay-200">
            {/* Event Title */}
            <h1 className="font-urbanist text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-white">
              {event.title}
            </h1>

            {/* Date & Time */}
            <EventDateTime
              startDate={event.startDate}
              startTime={event.startTime}
              endTime={event.endTime}
            />

            {/* Location */}
            <EventLocation location={event.location} />

            {/* Location Map Preview */}
            <LocationMapPreview
              location={event.location}
              className="mb-6"
            />

            {/* Pending Approval Alert */}
            {registrationStatus?.isRegistered && 
             registrationStatus?.registrationStatus === "pending" && 
             event.requireApproval && (
              <div className="mb-6 bg-yellow-500/10 backdrop-blur-md rounded-xl p-4 border border-yellow-500/30">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-urbanist text-base font-bold text-yellow-400 mb-1">
                      Application Pending
                    </h3>
                    <p className="text-white/70 text-sm">
                      Your registration is awaiting approval from the event host. You'll be notified once it's reviewed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Registration Card */}
            <EventRegistrationCard
              requireApproval={event.requireApproval}
              ticketPrice={event.ticketPrice}
              capacity={event.capacity}
              registeredCount={event.registeredCount}
              isUserRegistered={registrationStatus?.isRegistered || false}
              registrationApprovalStatus={registrationStatus?.registrationStatus || null}
              qrUrl={registrationStatus?.qrUrl ?? null}
              onRsvpClick={() => router.push(`/event/${slug}/register`)}
            />

            {/* About - Below RSVP */}
            <EventAbout
              description={event.description}
              className="mt-6 pt-6 border-t border-white/10"
            />

            {/* Hosted By - Mobile Only (at the end) */}
            <EventHost
              hostName={hostName}
              hostEmail={hostEmail}
              className="lg:hidden border-t border-white/10 pt-6 mt-8"
            />
          </div>
        </div>
      </main>
    </div>
  );
}