"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Calendar, Clock, SlidersHorizontal } from "lucide-react";
import { StatusBadge } from "./status-badge";

interface Event {
  id: string;
  title: string;
  date: string;
  registered: number;
  capacity: number;
  status: string;
  coverImage?: string;
}

interface ActiveEventsProps {
  events: Event[];
}

export const ActiveEvents: React.FC<ActiveEventsProps> = ({ events }) => {
  const router = useRouter();
  const [filterCapacity, setFilterCapacity] = useState<string>("all");
  // Show all statuses by default so newly created events appear
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  const getCapacityMetrics = (event: Event) => {
    const registered = Math.max(event.registered, 0);
    const safeCapacity = Number.isFinite(event.capacity) && event.capacity > 0
      ? event.capacity
      : null;
    const rawPercentage = safeCapacity
      ? Math.round((registered / safeCapacity) * 100)
      : null;
    const fillPercentage = rawPercentage === null
      ? 0
      : Math.min(Math.max(rawPercentage, 0), 100);

    return { registered, safeCapacity, rawPercentage, fillPercentage };
  };

  const filteredEvents = events
    .filter((event) => {
      // Status filter
      if (filterStatus === "active" && event.status !== "active")
        return false;
      if (filterStatus === "completed" && event.status !== "completed")
        return false;

      // Capacity filter
      const { rawPercentage } = getCapacityMetrics(event);
      if (filterCapacity !== "all" && rawPercentage === null) return false;
      if (filterCapacity === "low" && (rawPercentage ?? 0) >= 70) return false;
      if (
        filterCapacity === "medium" &&
        ((rawPercentage ?? 0) < 70 || (rawPercentage ?? 0) >= 90)
      )
        return false;
      if (filterCapacity === "high" && (rawPercentage ?? 0) < 90) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date")
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === "capacity") {
        const aPct = getCapacityMetrics(a).rawPercentage ?? -1;
        const bPct = getCapacityMetrics(b).rawPercentage ?? -1;
        return bPct - aPct;
      }
      return 0;
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2
          className="text-2xl font-semibold flex items-center gap-2 !text-white"
          style={{ color: "#ffffff", fontFamily: "Urbanist, sans-serif" }}
        >
          <Calendar className="w-6 h-6 text-[#06b6d4]" />
          Events
        </h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#06b6d4] flex-shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-gradient-to-r from-[#0B1F23]/80 to-[#0E1924]/80 border border-[#06b6d4]/30 rounded-lg !text-white text-sm focus:outline-none focus:border-[#06b6d4]/60 transition-all cursor-pointer [&>option]:bg-[#0B1F23] [&>option]:text-white [&>option]:py-2"
              style={{ color: "#ffffff", fontFamily: "Urbanist, sans-serif" }}
            >
              <option
                value="all"
                style={{ backgroundColor: "#0B1F23", color: "#ffffff" }}
              >
                All Events
              </option>
              <option
                value="active"
                style={{ backgroundColor: "#0B1F23", color: "#ffffff" }}
              >
                Active Events
              </option>
              <option
                value="completed"
                style={{ backgroundColor: "#0B1F23", color: "#ffffff" }}
              >
                Finished Events
              </option>
            </select>
          </div>
          <select
            value={filterCapacity}
            onChange={(e) => setFilterCapacity(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-gradient-to-r from-[#0B1F23]/80 to-[#0E1924]/80 border border-[#06b6d4]/30 rounded-lg !text-white text-sm focus:outline-none focus:border-[#06b6d4]/60 transition-all cursor-pointer [&>option]:bg-[#0B1F23] [&>option]:text-white [&>option]:py-2"
            style={{ color: "#ffffff", fontFamily: "Urbanist, sans-serif" }}
          >
            <option
              value="all"
              style={{ backgroundColor: "#0B1F23", color: "#ffffff" }}
            >
              All Capacity
            </option>
            <option
              value="low"
              style={{ backgroundColor: "#0B1F23", color: "#ffffff" }}
            >
              Low (&lt;70%)
            </option>
            <option
              value="medium"
              style={{ backgroundColor: "#0B1F23", color: "#ffffff" }}
            >
              Medium (70-89%)
            </option>
            <option
              value="high"
              style={{ backgroundColor: "#0B1F23", color: "#ffffff" }}
            >
              High (≥90%)
            </option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-gradient-to-r from-[#0B1F23]/80 to-[#0E1924]/80 border border-[#06b6d4]/30 rounded-lg !text-white text-sm focus:outline-none focus:border-[#06b6d4]/60 transition-all cursor-pointer [&>option]:bg-[#0B1F23] [&>option]:text-white [&>option]:py-2"
            style={{ color: "#ffffff", fontFamily: "Urbanist, sans-serif" }}
          >
            <option
              value="date"
              style={{ backgroundColor: "#0B1F23", color: "#ffffff" }}
            >
              Sort by Date
            </option>
            <option
              value="capacity"
              style={{ backgroundColor: "#0B1F23", color: "#ffffff" }}
            >
              Sort by Capacity
            </option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => {
          const { registered, safeCapacity, rawPercentage, fillPercentage } =
            getCapacityMetrics(event);
          const spotsLeft = safeCapacity
            ? Math.max(safeCapacity - registered, 0)
            : "Unlimited";
          return (
            <div
              key={event.id}
              onClick={() => router.push(`/event/${event.id}`)}
              className="group bg-gradient-to-br from-[#0B1F23]/80 via-[#0E1924]/70 to-[#0B1F23]/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-800/50 hover:border-[#22d3ee]/60 shadow-xl shadow-black/20 hover:shadow-[#22d3ee]/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              {/* Cover Image */}
              <div className="relative w-full h-48 bg-gradient-to-br from-[#38311E]/60 via-[#373531]/50 to-[#35351C]/40 overflow-hidden">
                {event.coverImage ? (
                  <>
                    <Image
                      src={event.coverImage}
                      alt={event.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F23]/60 to-transparent" />
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F23]/60 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-4 bg-[#0B1F23]/40 backdrop-blur-sm rounded-2xl border border-[#06b6d4]/30 group-hover:scale-110 transition-transform duration-300">
                        <Calendar className="w-14 h-14 text-[#06b6d4]" />
                      </div>
                    </div>
                  </>
                )}
                {/* Status badge in corner */}
                <div className="absolute top-4 right-4 z-10">
                  <StatusBadge status={event.status} />
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3
                    className="font-bold text-xl !text-white flex-1 group-hover:text-[#06b6d4] transition-colors"
                    style={{
                      color: "#ffffff",
                      fontFamily: "Urbanist, sans-serif",
                    }}
                  >
                    {event.title}
                  </h3>
                </div>
                <p
                  className="text-sm !text-white mb-4 flex items-center gap-2 bg-[#0B1F23]/40 px-3 py-2 rounded-lg w-fit"
                  style={{
                    color: "#ffffff",
                    fontFamily: "Urbanist, sans-serif",
                  }}
                >
                  <Clock className="w-4 h-4 text-[#06b6d4]" />
                  {new Date(event.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span
                      className="!text-gray-300 font-medium"
                      style={{
                        color: "#d1d5db",
                        fontFamily: "Urbanist, sans-serif",
                      }}
                    >
                      Registration Progress
                    </span>
                    <span
                      className="font-bold !text-white"
                      style={{
                        color: "#ffffff",
                        fontFamily: "Urbanist, sans-serif",
                      }}
                    >
                      {registered} / {safeCapacity ?? "Unlimited"}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gradient-to-r from-[#0E1924] to-[#0B1F23] rounded-full h-3 overflow-hidden border border-[#06b6d4]/20">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          (rawPercentage ?? 0) >= 90
                            ? "bg-gradient-to-r from-red-500 via-orange-500 to-red-600"
                            : (rawPercentage ?? 0) >= 70
                            ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600"
                            : "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"
                        } shadow-lg`}
                        style={{ width: `${fillPercentage}%` }}
                      >
                        <div className="h-full w-full bg-gradient-to-r from-white/20 to-transparent" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-bold ${
                        (rawPercentage ?? 0) >= 90
                          ? "text-red-400"
                          : (rawPercentage ?? 0) >= 70
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                      style={{ fontFamily: "Urbanist, sans-serif" }}
                    >
                      {rawPercentage === null ? "N/A" : `${rawPercentage}% filled`}
                    </span>
                    <span
                      className="text-xs text-gray-400"
                      style={{ fontFamily: "Urbanist, sans-serif" }}
                    >
                      {spotsLeft} spots left
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
