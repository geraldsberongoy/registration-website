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
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showAnswersModal, setShowAnswersModal] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<
    "registered" | "pending" | "not-going"
  >("registered");
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

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
    handleBulkStatusChange,
  } = useGuestActions(slug, onRefresh);

  const selectedGuests = guests.filter((g) =>
    selectedGuestIds.has(g.registrant_id),
  );

  const allSelected =
    filteredGuests.length > 0 &&
    filteredGuests.every((g) => selectedGuestIds.has(g.registrant_id));

  const someSelected = selectedGuestIds.size > 0 && !allSelected;

  return (
    <>
      <BulkActionConfirmModal
        isOpen={showBulkConfirm}
        count={selectedGuests.length}
        status={bulkStatus}
        isLoading={isPending}
        onConfirm={() => {
          setShowBulkConfirm(false);
          handleBulkStatusChange(selectedGuests, bulkStatus);
          clearSelection();
        }}
        onClose={() => setShowBulkConfirm(false)}
      />
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        eventSlug={slug}
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
        <div className="p-4 md:p-6 border-b border-white/10">
          <GuestListHeader
            guestCount={guests.length}
            onExport={handleExport}
            onCheckIn={() => setIsScannerOpen(true)}
          />

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
                disabled={isPending}
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
                disabled={isPending}
                className="font-urbanist px-4 py-1.5 bg-cyan-600/80 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors"
              >
                Apply
              </button>
              <button
                onClick={clearSelection}
                disabled={isPending}
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
              <table className="w-full">
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
                  {filteredGuests.map((guest) => (
                    <GuestTableRow
                      key={guest.registrant_id}
                      guest={guest}
                      isSelected={selectedGuestIds.has(guest.registrant_id)}
                      isPending={isPending}
                      onSelectGuest={handleSelectGuest}
                      onStatusChange={(guestId, status) =>
                        handleStatusChange(
                          guestId,
                          status,
                          onGuestStatusUpdated,
                        )
                      }
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
