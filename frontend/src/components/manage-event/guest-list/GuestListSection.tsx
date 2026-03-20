"use client";

import { useState } from "react";
import { Guest } from "@/types/guest";
import { EventData } from "@/types/event";
import { useGuestSelection } from "@/hooks/guest/use-guest-selection";
import { useGuestFilter } from "@/hooks/guest/use-guest-filter";
import { useGuestActions } from "@/hooks/guest/use-guest-actions";
import { QRScannerModal } from "../QRScannerModal";
import { GuestAnswersModal } from "./GuestAnswersModal";
import { GuestListHeader } from "./GuestListHeader";
import { GuestListSearchFilter } from "./GuestListSearchFilter";
import { GuestTableHeader } from "./GuestTableHeader";
import { GuestTableRow } from "./GuestTableRow";
import { GuestListEmpty } from "./GuestListEmpty";
import { BulkActionConfirmModal } from "./BulkActionConfirmModal";
import { useNotification } from "@/hooks/use-notification";

interface GuestListSectionProps {
  guests: Guest[];
  slug: string;
  onRefresh: () => void;
  event: EventData;
  onGuestStatusUpdated: (
    guestId: string,
    status: "registered" | "pending" | "not-going",
    patch?: {
      qr_data?: string | null;
      is_going?: boolean | null;
    },
  ) => void;
}

export function GuestListSection({
  guests,
  slug,
  onRefresh,
  event,
  onGuestStatusUpdated,
}: GuestListSectionProps) {
  type StatusQueueItem = {
    guestId: string;
    name: string;
    status: "queued" | "updating" | "updated" | "error";
    error?: string;
  };

  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showAnswersModal, setShowAnswersModal] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<
    "registered" | "pending" | "not-going"
  >("registered");
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [showStatusQueueModal, setShowStatusQueueModal] = useState(false);
  const [statusQueueItems, setStatusQueueItems] = useState<StatusQueueItem[]>(
    [],
  );
  const [statusQueueError, setStatusQueueError] = useState<string | null>(null);
  const [isQueueUpdating, setIsQueueUpdating] = useState(false);

  const { showSuccess, showError } = useNotification();

  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredGuests,
  } = useGuestFilter(guests);

  const {
    selectedGuestIds,
    showSelectMenu,
    handleSelectAll,
    handleSelectByStatus,
    handleSelectGuest,
    clearSelection,
    toggleSelectMenu,
  } = useGuestSelection();

  const {
    isPending,
    handleDeleteGuest,
    handleStatusChange,
    handleExport,
    updateGuestStatusDirect,
    handleCheckIn,
    handleGoingChange,
  } = useGuestActions(slug, onRefresh);

  const selectedGuests = guests.filter((g) =>
    selectedGuestIds.has(g.registrant_id),
  );

  const allSelected =
    filteredGuests.length > 0 &&
    filteredGuests.every((g: Guest) => selectedGuestIds.has(g.registrant_id));

  const someSelected = selectedGuestIds.size > 0 && !allSelected;
  const isBusy = isPending || isQueueUpdating;

  const getGuestDisplayName = (guest: Guest) => {
    const fullName =
      `${guest.users?.first_name || ""} ${guest.users?.last_name || ""}`.trim();
    if (fullName) return fullName;
    return guest.users?.email || guest.registrant_id;
  };

  const runQueuedStatusUpdate = async (
    targetGuests: Guest[],
    status: "registered" | "pending" | "not-going",
  ) => {
    if (targetGuests.length === 0) return;

    setShowStatusQueueModal(true);
    setStatusQueueError(null);
    setIsQueueUpdating(true);
    setStatusQueueItems(
      targetGuests.map((guest) => ({
        guestId: guest.registrant_id,
        name: getGuestDisplayName(guest),
        status: "queued",
      })),
    );

    targetGuests.forEach((guest) => {
      onGuestStatusUpdated(
        guest.registrant_id,
        status,
        status === "not-going" ? { is_going: false } : undefined,
      );
    });

    let failed = 0;
    try {
      for (const guest of targetGuests) {
        setStatusQueueItems((prev) =>
          prev.map((item) =>
            item.guestId === guest.registrant_id
              ? { ...item, status: "updating", error: undefined }
              : item,
          ),
        );

        const result = await updateGuestStatusDirect(
          guest.registrant_id,
          status,
        );
        if (result.success) {
          onGuestStatusUpdated(guest.registrant_id, status, result.patch);
          setStatusQueueItems((prev) =>
            prev.map((item) =>
              item.guestId === guest.registrant_id
                ? { ...item, status: "updated", error: undefined }
                : item,
            ),
          );
        } else {
          failed += 1;
          setStatusQueueItems((prev) =>
            prev.map((item) =>
              item.guestId === guest.registrant_id
                ? {
                    ...item,
                    status: "error",
                    error: result.error || "Failed to update status",
                  }
                : item,
            ),
          );
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unexpected status update error";
      setStatusQueueError(message);
      showError(message);
    } finally {
      setIsQueueUpdating(false);
      onRefresh();
    }

    if (failed === 0) {
      showSuccess(
        `${targetGuests.length} guest${
          targetGuests.length > 1 ? "s" : ""
        } updated successfully`,
      );
    } else {
      const message = `${failed} update${failed > 1 ? "s" : ""} failed`;
      setStatusQueueError(message);
      showError(message);
    }
  };

  const handleRowStatusChange = (
    guestId: string,
    status: "registered" | "pending" | "not-going",
  ) => {
    const shouldApplyToAllSelected =
      selectedGuestIds.size > 1 && selectedGuestIds.has(guestId);

    if (!shouldApplyToAllSelected) {
      handleStatusChange(guestId, status, onGuestStatusUpdated);
      return;
    }

    void runQueuedStatusUpdate(selectedGuests, status);
    clearSelection();
  };

  return (
    <>
      <BulkActionConfirmModal
        isOpen={showBulkConfirm}
        count={selectedGuests.length}
        status={bulkStatus}
        isLoading={isBusy}
        onConfirm={() => {
          setShowBulkConfirm(false);
          void runQueuedStatusUpdate(selectedGuests, bulkStatus);
          clearSelection();
        }}
        onClose={() => !isBusy && setShowBulkConfirm(false)}
      />
      {showStatusQueueModal && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (!isQueueUpdating) setShowStatusQueueModal(false);
            }}
          />
          <div className="relative z-[230] w-full max-w-2xl overflow-hidden rounded-2xl bg-[#0a1520] border border-white/10 shadow-2xl p-5 font-urbanist">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-white text-lg font-semibold">
                {isQueueUpdating
                  ? "Updating Guests..."
                  : "Status Update Summary"}
              </h2>
              <button
                type="button"
                onClick={() => setShowStatusQueueModal(false)}
                disabled={isQueueUpdating}
                className="px-3 py-1.5 rounded-lg text-xs border border-white/15 text-white/80 hover:text-white hover:bg-white/5 disabled:opacity-50"
              >
                Close
              </button>
            </div>

            {statusQueueError && (
              <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs px-3 py-2">
                {statusQueueError}
              </div>
            )}

            <div className="text-xs text-white/70 mb-3">
              Updated:{" "}
              <span className="text-emerald-300">
                {
                  statusQueueItems.filter((item) => item.status === "updated")
                    .length
                }
              </span>
              {" | "}
              Failed:{" "}
              <span className="text-rose-300">
                {
                  statusQueueItems.filter((item) => item.status === "error")
                    .length
                }
              </span>
              {" | "}
              Remaining:{" "}
              <span className="text-cyan-300">
                {
                  statusQueueItems.filter(
                    (item) =>
                      item.status === "queued" || item.status === "updating",
                  ).length
                }
              </span>
            </div>

            <div className="max-h-72 overflow-auto border border-white/10 rounded-xl">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[#12222f] text-white/70">
                  <tr>
                    <th className="text-left px-3 py-2">Guest</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {statusQueueItems.map((item) => (
                    <tr key={item.guestId} className="border-t border-white/5">
                      <td className="px-3 py-2 text-white/85">{item.name}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded border ${
                            item.status === "updated"
                              ? "border-emerald-400/40 text-emerald-300"
                              : item.status === "error"
                                ? "border-rose-400/40 text-rose-300"
                                : item.status === "updating"
                                  ? "border-cyan-400/40 text-cyan-300"
                                  : "border-white/20 text-white/70"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-rose-300/90">
                        {item.error || ""}
                      </td>
                    </tr>
                  ))}
                  {isQueueUpdating && statusQueueItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-6 text-center text-white/50"
                      >
                        Preparing queue...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        eventSlug={slug}
        onCheckInSuccess={onRefresh}
      />

      {/* Answers Modal */}
      {showAnswersModal && selectedGuest && (
        <GuestAnswersModal
          guest={selectedGuest}
          event={event}
          onClose={() => {
            setShowAnswersModal(false);
            setSelectedGuest(null);
          }}
        />
      )}

      <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="font-semibold text-white">Attendee Guest List</h4>
              <p className="text-sm text-white/50 mt-0.5">
                Manage registrations, check-in status, and export
              </p>
            </div>
            <GuestListHeader
              guestCount={filteredGuests.length}
              onExport={() => handleExport(filteredGuests)}
              onCheckIn={() => setIsScannerOpen(true)}
            />
          </div>

          {/* Search and Filter Bar */}
          <GuestListSearchFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>

        {/* Guest List Content */}
        <div className="p-4 md:p-6">
          {/* Bulk Action Bar */}
          {selectedGuestIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-white/5 border border-white/10 rounded-xl">
              <span className="font-urbanist text-sm text-white/70">
                {selectedGuestIds.size} selected
              </span>
              <select
                value={bulkStatus}
                onChange={(e) =>
                  setBulkStatus(
                    e.target.value as "registered" | "pending" | "not-going",
                  )
                }
                disabled={isBusy}
                className="font-urbanist px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 cursor-pointer"
              >
                <option
                  value="registered"
                  className="bg-[#0a1520] text-green-400"
                >
                  Set as Registered
                </option>
                <option
                  value="pending"
                  className="bg-[#0a1520] text-yellow-400"
                >
                  Set as Pending
                </option>
                <option value="not-going" className="bg-[#0a1520] text-red-400">
                  Set as Not Going
                </option>
              </select>
              <button
                onClick={() => setShowBulkConfirm(true)}
                disabled={isBusy}
                className="font-urbanist px-4 py-1.5 bg-cyan-600/80 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors"
              >
                Apply
              </button>
              <button
                onClick={clearSelection}
                disabled={isBusy}
                className="font-urbanist px-3 py-1.5 text-white/40 hover:text-white/70 text-sm transition-colors disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          )}
          {filteredGuests.length === 0 ? (
            <GuestListEmpty hasGuests={guests.length > 0} />
          ) : (
            /* Guest Table */
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <GuestTableHeader
                  allSelected={allSelected}
                  someSelected={someSelected}
                  onSelectAll={(checked) =>
                    handleSelectAll(filteredGuests, checked)
                  }
                  showSelectMenu={showSelectMenu}
                  onToggleSelectMenu={toggleSelectMenu}
                  onSelectByStatus={(status) =>
                    handleSelectByStatus(filteredGuests, status)
                  }
                  onDeselectAll={clearSelection}
                />
                <tbody>
                  {filteredGuests.map((guest: Guest) => (
                    <GuestTableRow
                      key={guest.registrant_id}
                      guest={guest}
                      isSelected={selectedGuestIds.has(guest.registrant_id)}
                      isPending={isBusy}
                      onSelectGuest={handleSelectGuest}
                      onStatusChange={handleRowStatusChange}
                      onCheckInChange={handleCheckIn}
                      onGoingChange={handleGoingChange}
                      onViewAnswers={(g) => {
                        setSelectedGuest(g);
                        setShowAnswersModal(true);
                      }}
                      onDelete={handleDeleteGuest}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
