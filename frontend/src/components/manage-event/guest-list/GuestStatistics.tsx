interface GuestStatisticsProps {
  totalRsvp: number;
  totalRegistered: number;
  checkedIn: number;
  waitlist: number;
  notGoing: number;
}

export function GuestStatistics({
  totalRsvp = 0,
  totalRegistered = 0,
  checkedIn = 0,
  waitlist = 0,
  notGoing = 0,
}: GuestStatisticsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-8">
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/10">
        <p className="font-urbanist text-white/60 text-xs md:text-sm mb-2">
          Total RSVP
        </p>
        <p className="font-urbanist text-2xl md:text-4xl font-bold text-white">
          {totalRsvp}
        </p>
      </div>
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/10">
        <p className="font-urbanist text-white/60 text-xs md:text-sm mb-2">
          Registered
        </p>
        <p className="font-urbanist text-2xl md:text-4xl font-bold text-white">
          {totalRegistered}
        </p>
      </div>
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/10">
        <p className="font-urbanist text-white/60 text-xs md:text-sm mb-2">
          Checked In
        </p>
        <p className="font-urbanist text-2xl md:text-4xl font-bold text-white">
          {checkedIn}
        </p>
      </div>
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/10">
        <p className="font-urbanist text-white/60 text-xs md:text-sm mb-2">
          Waitlist
        </p>
        <p className="font-urbanist text-2xl md:text-4xl font-bold text-white">
          {waitlist}
        </p>
      </div>
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/10">
        <p className="font-urbanist text-white/60 text-xs md:text-sm mb-2">
          Not Going
        </p>
        <p className="font-urbanist text-2xl md:text-4xl font-bold text-white">
          {notGoing}
        </p>
      </div>
    </div>
  );
}
