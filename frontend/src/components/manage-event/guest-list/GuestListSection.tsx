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

interface GuestListSectionProps {
  guests: Guest[];
  slug: string;
  onRefresh: () => void;
  event: EventData;
}

export function GuestListSection({
  guests,
  slug,
  onRefresh,
  event,
}: GuestListSectionProps) {
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showAnswersModal, setShowAnswersModal] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  const { searchQuery, setSearchQuery, statusFilter, setStatusFilter, filteredGuests } = useGuestFilter(guests);
  
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
    handleGenerateQR,
    handleBulkGenerateQR,
    handleBulkApprove,
  } = useGuestActions(slug, onRefresh);

  const selectedGuests = guests.filter(g => selectedGuestIds.has(g.registrant_id));
  const selectedRegisteredGuests = selectedGuests.filter(g => g.is_registered);
  const selectedPendingGuests = selectedGuests.filter(g => !g.is_registered);

  const allSelected = filteredGuests.length > 0 && 
    filteredGuests.every(g => selectedGuestIds.has(g.registrant_id));
  
  const someSelected = selectedGuestIds.size > 0 && !allSelected;

  return (
    <>
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
              {selectedPendingGuests.length > 0 && (
                <button
                  onClick={() => handleBulkApprove(selectedGuests)}
                  disabled={isPending}
                  className="font-urbanist px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Approve {selectedPendingGuests.length} Registration{selectedPendingGuests.length > 1 ? "s" : ""}
                </button>
              )}
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
                  onSelectAll={(checked) => handleSelectAll(filteredGuests, checked)}
                  showSelectMenu={showSelectMenu}
                  onToggleSelectMenu={toggleSelectMenu}
                  onSelectByStatus={(status) => handleSelectByStatus(filteredGuests, status)}
                  onDeselectAll={clearSelection}
                  selectedCount={selectedRegisteredGuests.length}
                  onBulkGenerateQR={() => handleBulkGenerateQR(selectedRegisteredGuests)}
                />
                <tbody>
                  {filteredGuests.map((guest) => (
                    <GuestTableRow
                      key={guest.registrant_id}
                      guest={guest}
                      isSelected={selectedGuestIds.has(guest.registrant_id)}
                      isPending={isPending}
                      onSelectGuest={handleSelectGuest}
                      onStatusChange={handleStatusChange}
                      onViewAnswers={(g) => {
                        setSelectedGuest(g);
                        setShowAnswersModal(true);
                      }}
                      onGenerateQR={handleGenerateQR}
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
