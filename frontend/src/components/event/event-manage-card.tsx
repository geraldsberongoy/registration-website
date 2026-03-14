import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface EventManageCardProps {
  eventSlug: string;
}

export function EventManageCard({ eventSlug }: EventManageCardProps) {
  const router = useRouter();

  const handleManageClick = () => {
    router.push(`/event/${eventSlug}/manage`);
  };

  return (
    <div className="bg-orange-900/20 backdrop-blur-lg rounded-xl p-5 border border-orange-500/20 flex items-center justify-between">
      <p className="text-white/90 text-sm">
        You have manage access for this event.
      </p>

      <button
        onClick={handleManageClick}
        className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white text-sm font-medium transition-colors whitespace-nowrap"
      >
        Manage
        <ArrowUpRight size={16} />
      </button>
    </div>
  );
}
