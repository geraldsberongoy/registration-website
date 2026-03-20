import { ChevronDown } from "lucide-react";
import { SelectionDropdown } from "./SelectionDropdown";

interface GuestTableHeaderProps {
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  showSelectMenu: boolean;
  onToggleSelectMenu: () => void;
  onSelectByStatus: (status: "all" | "registered" | "pending") => void;
  onDeselectAll: () => void;
}

export function GuestTableHeader({
  allSelected,
  someSelected,
  onSelectAll,
  showSelectMenu,
  onToggleSelectMenu,
  onSelectByStatus,
  onDeselectAll,
}: GuestTableHeaderProps) {
  return (
    <thead>
      <tr className="border-b border-white/10">
        <th className="font-urbanist text-left text-xs md:text-sm font-medium text-white/60 pb-3 px-2 w-10">
          <div className="flex items-center gap-1 relative">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(input) => {
                if (input) {
                  input.indeterminate = someSelected;
                }
              }}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-600 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
            />
            <button
              onClick={onToggleSelectMenu}
              className="p-0.5 hover:bg-white/10 rounded transition-colors"
              title="Selection options"
            >
              <ChevronDown size={14} className="text-white/60" />
            </button>

            {showSelectMenu && (
              <SelectionDropdown
                onSelectAll={() => onSelectByStatus("all")}
                onSelectRegistered={() => onSelectByStatus("registered")}
                onSelectPending={() => onSelectByStatus("pending")}
                onDeselectAll={onDeselectAll}
              />
            )}
          </div>
        </th>
        <th className="font-urbanist text-left text-xs md:text-sm font-medium text-white/60 pb-3 px-2">
          Name
        </th>
        <th className="font-urbanist text-left text-xs md:text-sm font-medium text-white/60 pb-3 px-2 hidden md:table-cell">
          Email
        </th>
        <th className="font-urbanist text-left text-xs md:text-sm font-medium text-white/60 pb-3 px-2 hidden lg:table-cell">
          Terms Accepted
        </th>
        <th className="font-urbanist text-left text-xs md:text-sm font-medium text-white/60 pb-3 px-2">
          Status
        </th>
        <th className="font-urbanist text-left text-xs md:text-sm font-medium text-white/60 pb-3 px-2 hidden md:table-cell">
          Going
        </th>
        <th className="font-urbanist text-left text-xs md:text-sm font-medium text-white/60 pb-3 px-2 hidden md:table-cell">
          Registered At
        </th>
        <th className="font-urbanist text-center text-xs md:text-sm font-medium text-white/60 pb-3 px-2 hidden md:table-cell">
          Ticket
        </th>
        <th className="font-urbanist text-center text-xs md:text-sm font-medium text-white/60 pb-3 px-2">
          View
        </th>
        <th className="font-urbanist text-right text-xs md:text-sm font-medium text-white/60 pb-3 px-2">
          Actions
        </th>
      </tr>
    </thead>
  );
}
