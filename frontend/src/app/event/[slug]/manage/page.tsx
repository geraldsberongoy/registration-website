"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { AdminNavbar } from "@/components/admin/admin-navbar";
import BokehBackground from "@/components/create-event/bokeh-background";
import Squares from "@/components/create-event/squares-background";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorState } from "@/components/ui/error-state";
import { useEvent } from "@/hooks/event/use-event";
import { useGuests } from "@/hooks/guest/use-guests";
import { useUserStore } from "@/store/useUserStore";
import {
  GuestStatistics,
  GuestListSection,
  EventPreviewCard,
  WhenWhereSidebar,
  CoverImageChangeModal,
  EventManagementForm,
} from "@/components/manage-event";
import BatchmailWorkspace from "@/components/batchmail/BatchmailWorkspace";
import SurveyBuilder from "@/components/manage-event/survey/SurveyBuilder";
import CertificateBuilder from "@/components/manage-event/certificate/CertificateBuilder";

export default function ManageEventPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { event, loading, error, refetch } = useEvent(slug);
  const { guests, stats, refetch: refetchGuests } = useGuests(slug);
  const { role, userId, loading: roleLoading, initialize } = useUserStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCoverImageModal, setShowCoverImageModal] = useState(false);

  const canManage =
    !roleLoading &&
    event &&
    (role === "admin" || (userId != null && userId === event.organizerId));

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (roleLoading || loading || !event) return;
    if (!canManage) {
      router.replace(`/event/${slug}`);
    }
  }, [canManage, roleLoading, loading, event, slug, router]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#0a1f14] via-[#0a1520] to-[#120c08] text-white relative overflow-hidden font-urbanist">
        <BokehBackground />
        <Squares direction="diagonal" speed={0.3} />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
        <LoadingScreen message="LOADING EVENT MANAGEMENT..." colorTheme="orange" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <ErrorState
        title="Event not found"
        message="The event you're trying to manage doesn't exist or has been removed."
        onAction={() => router.push("/")}
      />
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#0a1f14] via-[#0a1520] to-[#120c08] text-white relative overflow-hidden font-urbanist">
        <BokehBackground />
        <Squares direction="diagonal" speed={0.3} />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
        <LoadingScreen message="REDIRECTING..." colorTheme="orange" />
        </div>
      </div>
    );
  }

  const eventUrl = `${window.location.origin}/event/${slug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(eventUrl);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0a1f14] via-[#0a1520] to-[#120c08] text-white relative overflow-x-hidden font-urbanist">
      <BokehBackground />

      <Squares direction="diagonal" speed={0.3} />

      <AdminNavbar activeTab="events" />

      <main className="relative z-10 w-full max-w-6xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-10 pb-16 mt-16 animate-in fade-in duration-500">
        <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white truncate">
              {event.title}
            </h1>
          </div>
          <button
            onClick={() => router.push(`/event/${slug}`)}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs md:text-sm font-medium transition-colors whitespace-nowrap font-urbanist"
          >
            <span className="hidden sm:inline">Event Page</span>
            <span className="sm:hidden">View</span>
            <ArrowUpRight size={14} className="md:w-4 md:h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 md:gap-6 border-b border-white/10 mb-6 md:mb-8 overflow-x-auto -mx-3 md:mx-0 px-3 md:px-0">
          {["Overview", "Guests", "Batchmail", "Survey", "Certificate"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`pb-2 md:pb-3 px-1 text-xs md:text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.toLowerCase()
                  ? "text-white border-b-2 border-white"
                  : "text-white/60 hover:text-white/80"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Guests Tab Content */}
        {activeTab === "guests" && (
          <>
            <GuestStatistics
              totalRsvp={stats?.totalRsvp || 0}
              totalRegistered={stats?.totalRegistered || 0}
              checkedIn={stats?.checkedIn || 0}
              waitlist={stats?.waitlist || 0}
              notGoing={stats?.notGoing || 0}
            />
            <GuestListSection
              guests={guests}
              slug={slug}
              onRefresh={() => {
                refetchGuests();
                refetch();
              }}
              event={event}
            />
          </>
        )}

        {/* Overview Tab Content */}
        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 mb-8">
              <EventPreviewCard
                event={event}
                eventUrl={eventUrl}
                onCopy={copyToClipboard}
                onEditEvent={() => {}}
                onChangePhoto={() => setShowCoverImageModal(true)}
              />
              <WhenWhereSidebar event={event} />
            </div>
            <EventManagementForm
              event={event}
              slug={slug}
              onCancel={() => {}}
              onSuccess={() => {
                refetch();
              }}
            />
          </>
        )}

        {/* Batchmail Tab Content */}
        <div className={activeTab === "batchmail" ? "" : "hidden"}>
          <BatchmailWorkspace guests={guests} />
        </div>

        {/* Survey Tab Content */}
        <div className={activeTab === "survey" ? "" : "hidden"}>
          <SurveyBuilder slug={slug} initialConfig={event.postEventSurvey} />
        </div>

        {/* Certificate Tab Content */}
        <div className={activeTab === "certificate" ? "" : "hidden"}>
          <CertificateBuilder slug={slug} initialConfig={event.certificateConfig} />
        </div>
      </main>

      {/* Cover Image Change Modal */}
      <CoverImageChangeModal
        isOpen={showCoverImageModal}
        onClose={() => setShowCoverImageModal(false)}
        currentImage={event.coverImage}
        slug={slug}
      />
    </div>
  );
}