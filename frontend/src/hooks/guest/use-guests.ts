import { useState, useEffect, useCallback, useMemo } from "react";
import { Guest, GuestStats } from "@/types/guest";

interface UseGuestsReturn {
  guests: Guest[];
  stats: GuestStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  updateGuestStatusLocal: (
    guestId: string,
    nextStatus: "registered" | "pending" | "not-going",
    patch?: {
      qr_data?: string | null;
      is_going?: boolean | null;
    },
  ) => void;
}

interface GuestsResult {
  success: boolean;
  guests?: Guest[];
  error?: string;
}

async function getEventGuests(slug: string): Promise<GuestsResult> {
  try {
    const response = await fetch(`/api/registrants/${slug}`);
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to fetch guests" };
    }

    return { success: true, guests: data.guests || [] };
  } catch (error) {
    console.error("Error fetching guests:", error);
    return { success: false, error: "Failed to fetch guests" };
  }
}

function computeGuestStatistics(guests: Guest[]): GuestStats {
  const totalRsvp = guests.length;
  const totalRegistered = guests.filter(
    (g) => g.is_registered && g.is_going !== false,
  ).length;
  const notGoing = guests.filter(
    (g) => g.is_registered && g.is_going === false,
  ).length;
  const checkedIn = guests.filter((g) => g.check_in === true).length;
  const going = guests.filter((g) => g.is_registered && g.is_going !== false).length;
  const notResponded = guests.filter((g) => !g.is_registered).length;

  const goingGuests = guests.filter((g) => g.is_registered && g.is_going !== false);
  const ticketsReady = goingGuests.filter((g) => !!g.qr_data).length;
  const ticketsMissing = goingGuests.filter((g) => !g.qr_data).length;

  return {
    totalRsvp,
    totalRegistered,
    checkedIn,
    going,
    notGoing,
    notResponded,
    ticketsReady,
    ticketsMissing,
  };
}

/**
 * Custom hook to fetch and manage event guests
 * @param slug - The event slug
 * @returns Guests data, statistics, loading state, error state, and refetch function
 */
export function useGuests(slug: string): UseGuestsReturn {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const stats = useMemo(() => {
    return guests.length > 0 ? computeGuestStatistics(guests) : null;
  }, [guests]);

  const loadGuests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const guestsResult = await getEventGuests(slug);

      if (guestsResult.success && guestsResult.guests) {
        setGuests(guestsResult.guests);
      } else {
        setError(guestsResult.error || "Failed to load guests");
      }
    } catch (err) {
      setError("Failed to load guests");
      console.error("Error loading guests:", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      loadGuests();
    }
  }, [slug, loadGuests, refetchTrigger]);

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  const updateGuestStatusLocal = useCallback(
    (
      guestId: string,
      nextStatus: "registered" | "pending" | "not-going",
      patch?: {
        qr_data?: string | null;
        is_going?: boolean | null;
      },
    ) => {
      setGuests((prev) =>
        prev.map((guest) => {
          if (guest.registrant_id !== guestId) return guest;

          if (nextStatus === "not-going") {
            return {
              ...guest,
              is_registered: true,
              is_going: false,
            };
          }

          if (nextStatus === "registered") {
            return {
              ...guest,
              is_registered: true,
              is_going: patch?.is_going ?? guest.is_going,
              qr_data:
                patch?.qr_data !== undefined ? patch.qr_data : guest.qr_data,
            };
          }

          return {
            ...guest,
            is_registered: false,
            is_going: null,
            qr_data: null,
          };
        }),
      );
    },
    [],
  );

  return { guests, stats, loading, error, refetch, updateGuestStatusLocal };
}
