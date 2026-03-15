import { Eye, Trash2, Check, X } from "lucide-react";
import { Guest } from "@/types/guest";

interface GuestTableRowProps {
  guest: Guest;
  isSelected: boolean;
  isPending: boolean;
  onSelectGuest: (guestId: string, checked: boolean) => void;
  onStatusChange: (
    guestId: string,
    newStatus: "registered" | "pending" | "not-going",
  ) => void;
  onViewAnswers: (guest: Guest) => void;
  onDelete: (guestId: string) => void;
}

export function GuestTableRow({
  guest,
  isSelected,
  isPending,
  onSelectGuest,
  onStatusChange,
  onViewAnswers,
  onDelete,
}: GuestTableRowProps) {
  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td className="py-4 px-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectGuest(guest.registrant_id, e.target.checked)}
          className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-600 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
        />
      </td>
      <td className="font-urbanist text-white text-sm py-4 px-2">
        <div>
          <p className="font-medium">
            {guest.users?.first_name || "N/A"} {guest.users?.last_name || ""}
          </p>
          <p className="text-xs text-white/60 md:hidden">
            {guest.users?.email || "No email"}
          </p>
        </div>
      </td>
      <td className="font-urbanist text-white/80 text-sm py-4 px-2 hidden md:table-cell">
        {guest.users?.email || "No email"}
      </td>
      <td className="font-urbanist text-white/80 text-sm py-4 px-2 hidden lg:table-cell">
        {guest.terms_approval ? (
          <span className="text-green-400">Yes</span>
        ) : (
          <span className="text-red-400">No</span>
        )}
      </td>
      <td className="py-4 px-2">
        <select
          value={
            !guest.is_registered
              ? "pending"
              : guest.is_going === false
                ? "not-going"
                : "registered"
          }
          onChange={(e) =>
            onStatusChange(
              guest.registrant_id,
              e.target.value as "registered" | "pending" | "not-going",
            )
          }
          disabled={isPending}
          className={`font-urbanist px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
            !guest.is_registered
              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30"
              : guest.is_going === false
                ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                : "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
          }`}
        >
          <option value="registered" className="bg-[#0a1520] text-green-400">
            Registered
          </option>
          <option value="pending" className="bg-[#0a1520] text-yellow-400">
            Pending
          </option>
          <option value="not-going" className="bg-[#0a1520] text-red-400">
            Not Going
          </option>
        </select>
      </td>
      <td className="py-4 px-2 hidden md:table-cell">
        {guest.is_registered ? (
          guest.is_going === false ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
              <X size={11} />
              Not Going
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
              <Check size={11} />
              Going
            </span>
          )
        ) : (
          <span className="text-xs text-white/30">—</span>
        )}
      </td>
      <td className="py-4 px-2 hidden lg:table-cell">
        <div className="flex justify-center">
          {guest.is_registered && guest.is_going && guest.check_in ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/20 px-2.5 py-1 text-xs font-medium text-cyan-300">
              <Check size={11} />
              Checked In
            </span>
          ) : guest.is_registered && guest.is_going && guest.qr_data ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-300">
              Ready
            </span>
          ) : guest.is_registered && guest.is_going ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/20 px-2.5 py-1 text-xs font-medium text-yellow-300">
              Missing
            </span>
          ) : (
            <span className="text-xs text-white/30">—</span>
          )}
        </div>
      </td>
      <td className="py-4 px-2">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onViewAnswers(guest)}
            disabled={isPending}
            className="p-1.5 hover:bg-cyan-500/20 rounded text-cyan-400 transition-colors disabled:opacity-50"
            title="View Answers"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => onDelete(guest.registrant_id)}
            disabled={isPending}
            className="p-1.5 hover:bg-red-500/20 rounded text-red-400 transition-colors disabled:opacity-50"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
