import { useCallback, useTransition } from "react";
import { Guest } from "@/types/guest";
import {
  updateGuestStatusAction,
  deleteGuestAction,
  exportGuestsAction,
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
        let result;
        if (newStatus === "not-going") {
          result = await updateGuestIsGoingAction(
            { guestId, isGoing: false },
            slug,
          );
        } else {
          const isRegistered = newStatus === "registered";
          result = await updateGuestStatusAction(
            { guestId, isRegistered },
            slug,
          );
        }

        if (result.success) {
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

          onGuestStatusUpdated?.(guestId, newStatus, {
            qr_data: updatedGuest?.qr_data,
            is_going: updatedGuest?.is_going,
          });
          showSuccess("Status updated successfully");
        } else {
          showError(result.error || "Failed to update status");
        }
      });
    },
    [slug, showSuccess, showError],
  );

  const handleExport = useCallback(async () => {
    const result = await exportGuestsAction(slug);
    const csvData =
      result.success &&
      result.data &&
      typeof result.data === "object" &&
      "csvData" in result.data &&
      typeof result.data.csvData === "string"
        ? result.data.csvData
        : null;

    if (csvData) {
      downloadCSV(csvData, `event-guests-${slug}.csv`);
      showSuccess("Guest list exported successfully");
    } else {
      showError(result.error || "Failed to export guests");
    }
  }, [slug, showSuccess, showError]);

  const handleBulkApprove = useCallback(
    async (guests: Guest[]) => {
      const pendingGuests = guests.filter((g) => !g.is_registered);
      if (pendingGuests.length === 0) {
        showError("No pending guests selected");
        return;
      }

      startTransition(async () => {
        const results = await Promise.all(
          pendingGuests.map((g) =>
            updateGuestStatusAction(
              { guestId: g.registrant_id, isRegistered: true },
              slug,
            ),
          ),
        );

        const failed = results.filter((r) => !r.success).length;
        if (failed === 0) {
          onRefresh();
          showSuccess(
            `${pendingGuests.length} guest${pendingGuests.length > 1 ? "s" : ""} approved successfully`,
          );
        } else {
          onRefresh();
          showError(`${failed} approval${failed > 1 ? "s" : ""} failed`);
        }
      });
    },
    [slug, onRefresh, showSuccess, showError],
  );

  return {
    isPending,
    handleDeleteGuest,
    handleStatusChange,
    handleExport,
    handleBulkApprove,
  };
}
