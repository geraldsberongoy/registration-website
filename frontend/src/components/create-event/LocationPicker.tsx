"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Search } from "lucide-react";

interface LocationPickerProps {
  value: string;
  onChange: (location: string, lat?: number, lng?: number) => void;
}

interface LocationSuggestion {
  name: string;
  display: string;
  lat: number;
  lng: number;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const LeafletRef = useRef<any>(null);

  // Popular locations in Philippines
  const popularLocations: LocationSuggestion[] = [
    { name: "Makati Central Business District", display: "Makati Central Business District", lat: 14.5547, lng: 121.0244 },
    { name: "Bonifacio Global City, Taguig", display: "Bonifacio Global City, Taguig", lat: 14.5507, lng: 121.0494 },
    { name: "Quezon City Hall Complex", display: "Quezon City Hall Complex", lat: 14.6760, lng: 121.0437 },
    { name: "Cebu IT Park", display: "Cebu IT Park", lat: 10.3181, lng: 123.8949 },
    { name: "Davao City Hall", display: "Davao City Hall", lat: 7.0644, lng: 125.6081 },
  ];

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Check if the container already has a Leaflet map (happens in strict mode)
    const container = mapRef.current;
    if ((container as any)._leaflet_id) {
      return;
    }

    // Dynamically import Leaflet and CSS only on client side
    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([L]) => {
      // Double-check container still exists and isn't already initialized
      if (!container || (container as any)._leaflet_id) {
        return;
      }

      LeafletRef.current = L.default;
      const Leaflet = L.default;

      // Fix Leaflet default marker icon issue
      delete (Leaflet.Icon.Default.prototype as any)._getIconUrl;
      Leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      // Initialize map
      const map = Leaflet.map(container).setView([14.5995, 120.9842], 12);

      // Add light theme tile layer
      Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: "abc",
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      setIsMapReady(true);

      // Add click listener
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        placeMarker(lat, lng);
        reverseGeocode(lat, lng);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      // Clear Leaflet's internal state from the DOM element
      if (container) {
        delete (container as any)._leaflet_id;
      }
    };
  }, []);

  const placeMarker = (lat: number, lng: number) => {
    if (!mapInstanceRef.current || !LeafletRef.current) return;

    const L = LeafletRef.current;

    // Remove existing marker
    if (markerRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
    }

    // Create custom icon
    const customIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="background: #10b981; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4);"><div style="width: 8px; height: 8px; background: white; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(45deg);"></div></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    // Create new marker
    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstanceRef.current);
    markerRef.current = marker;
    mapInstanceRef.current.panTo([lat, lng]);

    onChange(searchQuery, lat, lng);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Using Nominatim for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      if (data.display_name) {
        setSearchQuery(data.display_name);
        onChange(data.display_name, lat, lng);
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      setSearchQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      onChange(`${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    onChange(query);

    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Filter popular locations
    const filtered = popularLocations.filter((loc) =>
      loc.display.toLowerCase().includes(query.toLowerCase())
    );

    // Also search using Nominatim
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ph&limit=5`
      );
      const data = await response.json();
      const nominatimResults: LocationSuggestion[] = data.map((item: any) => ({
        name: item.place_id,
        display: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));

      setSuggestions([...filtered, ...nominatimResults]);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Search failed:", error);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    }
  };

  const handleSelectLocation = (location: LocationSuggestion) => {
    setSearchQuery(location.display);
    setShowSuggestions(false);
    onChange(location.display, location.lat, location.lng);

    if (mapInstanceRef.current) {
      placeMarker(location.lat, location.lng);
      mapInstanceRef.current.setView([location.lat, location.lng], 15);
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden hover:border-primary/30 transition-all">
      <div className="p-2.5">
        <div className="flex items-start gap-2.5 mb-2">
          <div className="p-2 bg-white-50/5 rounded-lg mt-0.5">
            <MapPin className="w-4 h-4 text-white/50" />
          </div>
          <div className="flex-1">
            <label className="text-[9px] text-white/40 uppercase tracking-widest font-bold block mb-1">
              Location
            </label>
            <div className="relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search for a location or click on map..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full bg-transparent text-white/90 text-sm pl-6 pr-2 py-1 focus:outline-none placeholder:text-white/30"
              />
            </div>
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="mb-2 max-h-40 overflow-y-auto bg-black/60 rounded-lg border border-white/10">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onMouseDown={() => handleSelectLocation(suggestion)}
                className="w-full flex items-center gap-2 p-2 hover:bg-white/5 transition-colors text-left text-xs text-white/80 border-b border-white/5 last:border-b-0"
              >
                <MapPin className="w-3 h-3 text-white/40 flex-shrink-0" />
                <span className="line-clamp-1">{suggestion.display}</span>
              </button>
            ))}
          </div>
        )}

        {/* Map */}
        <div className="relative rounded-lg overflow-hidden border border-white/10">
          <div ref={mapRef} className="w-full h-64" />
          {searchQuery && (
            <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md rounded-lg p-2 border border-white/10">
              <p className="text-[8px] text-white/40 uppercase tracking-wide mb-0.5">Selected:</p>
              <p className="text-xs text-white/90 line-clamp-1">{searchQuery}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
