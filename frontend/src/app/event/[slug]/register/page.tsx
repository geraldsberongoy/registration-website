"use client";

import { useParams, useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorState } from "@/components/ui/error-state";
import { RegistrationFlow } from "@/components/registration/RegistrationFlow";
import { useEvent } from "@/hooks/event/use-event";
import BokehBackground from "@/components/create-event/bokeh-background";
import Squares from "@/components/create-event/squares-background";

export default function EventRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { event, loading, error } = useEvent(slug);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#0a1f14] via-[#0a1520] to-[#120c08] text-white relative overflow-hidden font-urbanist">
        <BokehBackground />
        <Squares direction="diagonal" speed={0.3} />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
        <LoadingScreen message="LOADING REGISTRATION..." colorTheme="orange" />
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
    <RegistrationFlow eventSlug={slug} formQuestions={event.questions || []} />
  );
}