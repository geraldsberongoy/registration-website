import { useCallback, useTransition } from "react";
import { Guest } from "@/types/guest";
import {
  updateGuestStatusAction,
  deleteGuestAction,
  updateGuestIsGoingAction,
} from "@/actions/registrantActions";
import { downloadCSV } from "@/utils/fileDownload";
import { useNotification } from "@/hooks/use-notification";

/**
 * Hook for handling guest actions
 * Coordinates between UI, actions, and services
 */
export function useGuestActions(slug: string, onRefresh: () => void) {
  const [isPending, startTransition] = useTransition();
  const { showSuccess, showError, showConfirm } = useNotification();

  const updateGuestStatusDirect = useCallback(
    async (
      guestId: string,
      newStatus: "registered" | "pending" | "not-going",
    ): Promise<{
      success: boolean;
      error?: string;
      patch?: {
        qr_data?: string | null;
        is_going?: boolean | null;
      };
    }> => {
      let result;
      if (newStatus === "not-going") {
        result = await updateGuestIsGoingAction({ guestId, isGoing: false }, slug);
      } else {
        const isRegistered = newStatus === "registered";
        result = await updateGuestStatusAction({ guestId, isRegistered }, slug);
      }

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Failed to update status",
        };
      }

      const updatedGuest =
        result.data &&
        typeof result.data === "object" &&
        "guest" in result.data &&
        result.data.guest &&
        typeof result.data.guest === "object"
          ? (result.data.guest as {
              qr_data?: string | null;
              is_going?: boolean | null;
            })
          : undefined;

      return {
        success: true,
        patch: {
          qr_data: updatedGuest?.qr_data,
          is_going: updatedGuest?.is_going,
        },
      };
    },
    [slug],
  );

  const handleDeleteGuest = useCallback(
    (guestId: string) => {
      if (!showConfirm("Are you sure you want to remove this guest?")) return;

      startTransition(async () => {
        const result = await deleteGuestAction({ guestId }, slug);

        if (result.success) {
          onRefresh();
          showSuccess("Guest removed successfully");
        } else {
          showError(result.error || "Failed to delete guest");
        }
      });
    },
    [slug, onRefresh, showConfirm, showSuccess, showError],
  );

  const handleStatusChange = useCallback(
    (
      guestId: string,
      newStatus: "registered" | "pending" | "not-going",
      onGuestStatusUpdated?: (
        guestId: string,
        status: "registered" | "pending" | "not-going",
        patch?: {
          qr_data?: string | null;
          is_going?: boolean | null;
        },
      ) => void,
    ) => {
      startTransition(async () => {
        const result = await updateGuestStatusDirect(guestId, newStatus);
        if (result.success) {
          onGuestStatusUpdated?.(guestId, newStatus, result.patch);
          showSuccess("Status updated successfully");
        } else {
          showError(result.error || "Failed to update status");
        }
      });
    },
    [updateGuestStatusDirect, showSuccess, showError],
  );

  const handleExport = useCallback(
    (guestsToExport: Guest[]) => {
      if (guestsToExport.length === 0) {
        showError("No guests to export");
        return;
      }

      const allQuestionKeys = Array.from(
        new Set(
          guestsToExport.flatMap((guest) =>
            guest.form_answers ? Object.keys(guest.form_answers) : [],
          ),
        ),
      );

      const getStatusLabel = (guest: Guest) => {
        if (!guest.is_registered) return "Pending";
        if (guest.is_going === false) return "Not Going";
        return "Registered";
      };

      const getGoingLabel = (guest: Guest) => {
        if (!guest.is_registered) return "-";
        if (guest.is_going === true) return "Going";
        if (guest.is_going === false) return "Not Going";
        return "-";
      };

      const headers = [
        "Name",
        "Email",
        "Status",
        "Going",
        "Checked In",
        "Terms Accepted",
        ...allQuestionKeys,
      ];

      const escapeCell = (value: unknown) =>
        `"${String(value ?? "").replace(/"/g, '""')}"`;

      const rows = guestsToExport.map((guest) => {
        const baseRow = [
          `${guest.users?.first_name || ""} ${guest.users?.last_name || ""}`.trim(),
          guest.users?.email || "",
          getStatusLabel(guest),
          getGoingLabel(guest),
          guest.check_in ? "Yes" : "No",
          guest.terms_approval ? "Yes" : "No",
        ];

        const answerCols = allQuestionKeys.map(
          (question) => guest.form_answers?.[question] ?? "",
        );

        return [...baseRow, ...answerCols];
      });

      const csvData = [
        headers.join(","),
        ...rows.map((row) => row.map(escapeCell).join(",")),
      ].join("\n");

      downloadCSV(csvData, `event-guests-${slug}.csv`);
      showSuccess(
        `Exported ${guestsToExport.length} guest${
          guestsToExport.length > 1 ? "s" : ""
        }`,
      );
    },
    [slug, showSuccess, showError],
  );

  const handleBulkStatusChange = useCallback(
    async (
      guests: Guest[],
      newStatus: "registered" | "pending" | "not-going",
    ) => {
      if (guests.length === 0) return;

      startTransition(async () => {
        const results = await Promise.all(
          guests.map((g) => updateGuestStatusDirect(g.registrant_id, newStatus)),
        );

        const failed = results.filter((r) => !r.success).length;
        if (failed === 0) {
          onRefresh();
          showSuccess(
            `${guests.length} guest${
              guests.length > 1 ? "s" : ""
            } updated successfully`,
          );
        } else {
          onRefresh();
          showError(`${failed} update${failed > 1 ? "s" : ""} failed`);
        }
      });
    },
    [updateGuestStatusDirect, onRefresh, showSuccess, showError],
  );

  return {
    isPending,
    handleDeleteGuest,
    handleStatusChange,
    handleExport,
    handleBulkStatusChange,
    updateGuestStatusDirect,
  };
}
