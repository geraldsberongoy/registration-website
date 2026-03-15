import { Search } from "lucide-react";

interface GuestListSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export function GuestListSearchFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: GuestListSearchFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search guests by name or email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="font-urbanist w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="font-urbanist px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors sm:w-48"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#fff" }}
      >
        <option value="all" style={{ backgroundColor: '#0a1520', color: '#ffffff' }}>All Status</option>
        <option value="registered" style={{ backgroundColor: '#0a1520', color: '#ffffff' }}>Registered</option>
        <option value="pending" style={{ backgroundColor: '#0a1520', color: '#ffffff' }}>Not Responded</option>
        <option value="not-going" style={{ backgroundColor: '#0a1520', color: '#ffffff' }}>Not Going</option>
      </select>
    </div>
  );
}
