import { useCallback, useTransition } from "react";
import { Guest } from "@/types/guest";
import {
  updateGuestStatusAction,
  deleteGuestAction,
  exportGuestsAction,
} from "@/actions/registrantActions";
import {
  generateSingleQRAction,
  generateBulkQRAction,
} from "@/actions/qrClientActions";
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
    (guestId: string, newStatus: string) => {
      const isRegistered = newStatus === "registered";

      startTransition(async () => {
        const result = await updateGuestStatusAction(
          { guestId, isRegistered },
          slug,
        );

        if (result.success) {
          onRefresh();
          showSuccess("Status updated successfully");
        } else {
          showError(result.error || "Failed to update status");
        }
      });
    },
    [slug, onRefresh, showSuccess, showError],
  );

  const handleExport = useCallback(async () => {
    const result = await exportGuestsAction(slug);

    if (result.success && result.data && (result.data as any).csvData) {
      downloadCSV(
        (result.data as any).csvData as string,
        `event-guests-${slug}.csv`,
      );
      showSuccess("Guest list exported successfully");
    } else {
      showError(result.error || "Failed to export guests");
    }
  }, [slug, showSuccess, showError]);

  const handleGenerateQR = useCallback(
    async (guest: Guest) => {
      const result = await generateSingleQRAction(guest, slug);

      if (result.success) {
        showSuccess("QR code uploaded successfully!");
      } else {
        showError(result.error || "Failed to generate QR code");
      }
    },
    [slug, showSuccess, showError],
  );

  const handleBulkGenerateQR = useCallback(
    async (guests: Guest[]) => {
      if (guests.length === 0) {
        showError("No guests selected");
        return;
      }

      const result = await generateBulkQRAction(guests, slug);

      if (result.success) {
        const count = result.count ?? 0;
        showSuccess(
          `Uploaded ${count} QR code${count > 1 ? "s" : ""} successfully!`,
        );
      } else {
        showError(result.error || "Failed to generate QR codes");
      }
    },
    [slug, showSuccess, showError],
  );

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
            updateGuestStatusAction({ guestId: g.registrant_id, isRegistered: true }, slug),
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
    handleGenerateQR,
    handleBulkGenerateQR,
    handleBulkApprove,
  };
}
