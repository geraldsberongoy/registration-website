"use client";

import { MapPin } from "lucide-react";

interface LocationMapPreviewProps {
  location: string;
  className?: string;
}

export function LocationMapPreview({
  location,
  className = "",
}: LocationMapPreviewProps) {
  if (!location) return null;

  const encodedLocation = encodeURIComponent(location);
  const embedUrl = `https://www.google.com/maps?q=${encodedLocation}&output=embed`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;

  return (
    <div className={className}>
      <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
        <iframe
          title={`Map preview for ${location}`}
          src={embedUrl}
          className="w-full h-64 border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-2 text-sm text-cyan-300/80 hover:text-cyan-200 transition-colors"
      >
        <MapPin className="w-4 h-4" />
        Open in Google Maps
      </a>
      <p className="mt-1 text-xs text-white/45">{location}</p>
    </div>
  );
}
