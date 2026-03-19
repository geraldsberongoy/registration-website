import { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import { Guest } from "@/types/guest";

export function useGuestFilter(guests: Guest[]) {
  const SEARCH_DEBOUNCE_MS = 350;
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  const filteredGuests = useMemo(() => {
    const statusFilteredGuests = guests.filter((guest) => {
      if (!guest.users) return false;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "registered"
          ? guest.is_registered && guest.is_going !== false
          : statusFilter === "pending"
            ? !guest.is_registered
            : statusFilter === "not-going"
              ? guest.is_registered && guest.is_going === false
              : statusFilter === "not-going-or-dash"
                ? guest.is_going !== true
                : statusFilter === "dash-only"
                  ? !guest.is_registered || guest.is_going === null
                : true);

      return matchesStatus;
    });

    if (!debouncedSearchQuery.trim()) {
      return statusFilteredGuests;
    }

    const searchableGuests = statusFilteredGuests.map((guest) => {
      const firstName = guest.users?.first_name?.trim() ?? "";
      const lastName = guest.users?.last_name?.trim() ?? "";
      const fullName = `${firstName} ${lastName}`.trim();

      return {
        guest,
        firstName,
        lastName,
        fullName,
        email: guest.users?.email ?? "",
      };
    });

    const fuse = new Fuse(searchableGuests, {
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: [
        { name: "fullName", weight: 0.5 },
        { name: "firstName", weight: 0.2 },
        { name: "lastName", weight: 0.2 },
        { name: "email", weight: 0.1 },
      ],
    });

    return fuse
      .search(debouncedSearchQuery)
      .map((result) => result.item.guest);
  }, [guests, debouncedSearchQuery, statusFilter]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredGuests,
  };
}
