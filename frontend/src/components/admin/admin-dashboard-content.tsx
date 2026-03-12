"use client";

import React, { useState, useEffect } from "react";
import { StatCard } from "./stat-card";
import { ActiveEvents } from "./active-events";
import { AnalyticsCharts } from "./analytics-charts";
import { listEventsAction } from "@/actions/eventActions";
import { EventData } from "@/types/event";
import { Users, Calendar, UserPlus, Building2 } from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-screen";

// Mock data - replace with actual API calls
const mockStats = {
  totalRegistrants: 1247,
  totalEvents: 12,
  activeEvents: 5,
  upcomingEvents: 3,
  volunteers: 89,
  partneredOrgs: 15,
  recentRegistrations: 234,
  capacityUtilization: 78,
  completionRate: 92,
  waitlistCount: 47,
  peakAttendance: 203,
};

interface AdminDashboardContentProps {
  activeTab: "dashboard" | "events" | "stats" | "create-event" | "export-data";
  setActiveTab: (
    tab: "dashboard" | "events" | "stats" | "create-event" | "export-data",
  ) => void;
}

export const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({
  activeTab,
  setActiveTab: _setActiveTab,
}) => {
  const [events, setEvents] = useState<EventData[]>([]);
  // 1. Initialize to true so it loads on the very first mount
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      // 2. Force the loading state to true the moment the tab changes
      setIsLoading(true);
      
      try {
        const response = await listEventsAction();
        if (response.success && response.data) {
          setEvents(response.data);
        }
      } catch (e) {
        console.error("Failed to load events", e);
      } finally {
        // 3. Reveal the content once the API finishes loading
        setIsLoading(false);
      }
    }
    
    fetchEvents();
  }, [activeTab]);

  // Transform EventData to match ActiveEvents component expected format
  const transformedEvents = events.map((event) => ({
    id: event.slug,
    title: event.title,
    date: `${event.startDate}T${event.startTime}`,
    registered: 0, // TODO: Add registration tracking
    capacity:
      event.capacity === "Unlimited" ? 999999 : parseInt(event.capacity) || 100,
    status:
      new Date(`${event.startDate}T${event.startTime}`) > new Date()
        ? "active"
        : "completed",
  }));

  // Helper to format the loading message based on the current tab
  const getLoadingMessage = () => {
    const formattedTab = activeTab.replace("-", " ").toUpperCase();
    return `LOADING ${formattedTab}...`;
  };

  return (
    <div className="flex min-h-screen">
      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 py-8 pt-28">
        <div className="max-w-7xl mx-auto">
          
          {/* Master Loading Conditional: Replaces ALL content while loading */}
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[60vh]">
              <LoadingScreen message={getLoadingMessage()} />
            </div>
          ) : (
            /* Wrapped the content in a fade-in div for a smooth transition */
            <div className="mb-8 animate-in fade-in duration-500">
              
              {activeTab === "dashboard" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                      title="Total Registrants"
                      value={mockStats.totalRegistrants}
                      icon={Users}
                      trend="+12% from last month"
                      trendUp={true}
                      color="bg-blue-500/20"
                    />
                    <StatCard
                      title="Active Events"
                      value={mockStats.activeEvents}
                      icon={Calendar}
                      trend={`${mockStats.upcomingEvents} upcoming`}
                      trendUp={true}
                      color="bg-purple-500/20"
                    />
                    <StatCard
                      title="Volunteers"
                      value={mockStats.volunteers}
                      icon={UserPlus}
                      trend="+8% this week"
                      trendUp={true}
                      color="bg-green-500/20"
                    />
                    <StatCard
                      title="Partnered Orgs"
                      value={mockStats.partneredOrgs}
                      icon={Building2}
                      color="bg-orange-500/20"
                    />
                  </div>
                  <AnalyticsCharts />
                </>
              )}

              {activeTab === "events" && (
                <ActiveEvents events={transformedEvents} />
              )}

              {activeTab === "create-event" && (
                <div className="bg-gradient-to-br from-[#0B1F23]/60 via-[#0E1924]/50 to-[#0B1F23]/60 backdrop-blur-sm rounded-xl p-8 border border-[#06b6d4]/30 shadow-lg shadow-[#0891b2]/20 text-center">
                  <Calendar className="w-16 h-16 text-[#06b6d4] mx-auto mb-4" />
                  <h2
                    className="text-2xl font-bold text-white mb-2"
                    style={{ fontFamily: "Urbanist, sans-serif" }}
                  >
                    Create New Event
                  </h2>
                  <p
                    className="text-gray-400 mb-6"
                    style={{ fontFamily: "Urbanist, sans-serif" }}
                  >
                    Redirecting to event creation page...
                  </p>
                </div>
              )}

              {activeTab === "export-data" && (
                <div className="bg-gradient-to-br from-[#092728]/60 via-[#0a2d2e]/50 to-[#092728]/60 backdrop-blur-sm rounded-xl p-8 border border-[#856730]/30 shadow-lg shadow-[#733C0B]/20 text-center">
                  <Building2 className="w-16 h-16 text-[#856730] mx-auto mb-4" />
                  <h2
                    className="text-2xl font-bold text-white mb-2"
                    style={{ fontFamily: "Urbanist, sans-serif" }}
                  >
                    Export All Data
                  </h2>
                  <p
                    className="text-gray-400 mb-6"
                    style={{ fontFamily: "Urbanist, sans-serif" }}
                  >
                    Preparing data export...
                  </p>
                </div>
              )}

            </div>
          )}

        </div>
      </main>
    </div>
  );
};