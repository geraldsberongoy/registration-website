import {
  Users,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Ticket,
  AlertCircle,
} from "lucide-react";

interface GuestStatisticsProps {
  totalRsvp: number;
  totalRegistered: number;
  checkedIn: number;
  going: number;
  notGoing: number;
  notResponded: number;
  ticketsReady: number;
  ticketsMissing: number;
}

export function GuestStatistics({
  totalRsvp = 0,
  checkedIn = 0,
  going = 0,
  notGoing = 0,
  notResponded = 0,
  ticketsReady = 0,
  ticketsMissing = 0,
}: GuestStatisticsProps) {
  return (
    <div className="space-y-6 mb-8">
      {/* Attendance Stats */}
      <div>
        <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
          Attendance
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-5 border border-white/10 min-h-[100px] flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-white/10 shrink-0">
                <Users className="w-4 h-4 text-white/70" />
              </span>
              <p className="font-urbanist text-white/60 text-xs truncate">
                Total RSVP
              </p>
            </div>
            <p className="font-urbanist text-xl md:text-3xl font-bold text-white">
              {totalRsvp}
            </p>
            <p className="text-xs text-white/40 mt-1">All RSVPs</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-5 border border-white/10 min-h-[100px] flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 shrink-0">
            <Clock className="w-4 h-4 text-amber-400" />
              </span>
              <p className="font-urbanist text-white/60 text-xs truncate">
                Not Responded
              </p>
            </div>
            <p className="font-urbanist text-xl md:text-3xl font-bold text-amber-400">
              {notResponded}
            </p>
            <p className="text-xs text-white/40 mt-1">Pending approval</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-5 border border-white/10 min-h-[100px] flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 shrink-0">
            <UserCheck className="w-4 h-4 text-emerald-400" />
              </span>
              <p className="font-urbanist text-white/60 text-xs truncate">
                Going
              </p>
            </div>
            <p className="font-urbanist text-xl md:text-3xl font-bold text-emerald-400">
              {going}
            </p>
            <p className="text-xs text-white/40 mt-1">Approved & attending</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-5 border border-white/10 min-h-[100px] flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-blue-500/20 shrink-0">
            <CheckCircle className="w-4 h-4 text-blue-400" />
              </span>
              <p className="font-urbanist text-white/60 text-xs truncate">
                Checked In
              </p>
            </div>
            <p className="font-urbanist text-xl md:text-3xl font-bold text-blue-400">
              {checkedIn}
            </p>
            <p className="text-xs text-white/40 mt-1">At event</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-5 border border-white/10 min-h-[100px] flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-red-500/20 shrink-0">
            <XCircle className="w-4 h-4 text-red-400" />
              </span>
              <p className="font-urbanist text-white/60 text-xs truncate">
                Not Going
              </p>
            </div>
            <p className="font-urbanist text-xl md:text-3xl font-bold text-red-400">
              {notGoing}
            </p>
            <p className="text-xs text-white/40 mt-1">Declined</p>
          </div>
        </div>
      </div>

      {/* Ticket Stats */}
      <div>
        <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
          Tickets
        </p>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-5 border border-white/10 min-h-[100px] flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 shrink-0">
                <Ticket className="w-4 h-4 text-cyan-400" />
              </span>
              <p className="font-urbanist text-white/60 text-xs truncate">
                Tickets Ready
              </p>
            </div>
            <p className="font-urbanist text-xl md:text-3xl font-bold text-cyan-400">
              {ticketsReady}
            </p>
            <p className="text-xs text-white/40 mt-1">QR code generated</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-5 border border-white/10 min-h-[100px] flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 shrink-0">
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </span>
              <p className="font-urbanist text-white/60 text-xs truncate">
                Tickets Missing
              </p>
            </div>
            <p className="font-urbanist text-xl md:text-3xl font-bold text-amber-400">
              {ticketsMissing}
            </p>
            <p className="text-xs text-white/40 mt-1">Need QR generation</p>
          </div>
        </div>
      </div>
    </div>
  );
}
