import { LogOut, Calendar, BarChart3, Plus, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { logoutAction } from "@/actions/authActions";
import { useUserStore } from "@/store/useUserStore";
import { LogoutModal } from "./logout-modal";
import { getLastViewedEventSlug } from "@/utils/last-viewed-event";

interface AdminNavbarProps {
  activeTab: string;
}

export function AdminNavbar({ activeTab }: AdminNavbarProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = [
    {
      id: "dashboard" as const,
      label: "Dashboard",
      icon: BarChart3,
      path: "/admin/dashboard",
    },
    {
      id: "events" as const,
      label: "Events",
      icon: Calendar,
      path: "/admin/events",
    },
  ];

  const handleTabChange = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  const handleCreateEvent = () => {
    router.push("/create-event");
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutAction();
      useUserStore.getState().clearUser();
      const lastSlug = getLastViewedEventSlug();
      router.push(lastSlug ? `/event/${lastSlug}` : "/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  return (
    <>
      <nav className="h-16 px-6 md:px-10 lg:px-16 flex items-center justify-between z-40 fixed top-0 left-0 right-0 backdrop-blur-md bg-black/20 border-b border-white/5 shadow-lg shadow-black/20">
        {/* Left Side - Logo (Compact) */}
        <div className="flex items-center gap-8 md:gap-12">
          {/* Burger Menu Button (Mobile) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 -ml-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {/* Logo - Simplified */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/15 to-cyan-500/15 p-1.5 border border-cyan-500/20 flex-shrink-0">
              <Image
                src="/images/logos/adph-logo.png"
                alt="ADPH"
                fill
                sizes="32px"
                className="object-contain"
              />
            </div>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:inline font-urbanist">
              ADPH Admin
            </span>
          </div>

          {/* Navigation Menu (Desktop) - Now more prominent */}
          <div className="hidden lg:flex items-center gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.path)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md transition-all duration-200 font-urbanist ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 shadow-sm shadow-cyan-500/10"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-3">
          {/* Create Event Button - Elegant Premium */}
          <button
            onClick={handleCreateEvent}
            className="hidden md:flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-gradient-to-br from-[#21935B] via-[#1a7549] to-[#145a39] hover:from-[#28a968] hover:via-[#21935B] hover:to-[#1a7549] text-white font-urbanist shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-300 border border-[#21935B]/30 hover:border-[#21935B]/50 group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
            <span className="text-sm font-medium tracking-wide">
              Create Event
            </span>
          </button>

          {/* Logout Button - Muted */}
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 hover:border-white/20 text-gray-400 hover:text-gray-300 hover:bg-white/5 transition-all duration-200 font-urbanist"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile Menu Panel */}
          <div className="fixed top-16 left-0 right-0 z-40 lg:hidden backdrop-blur-md bg-black/40 border-b border-white/5 shadow-xl">
            <div className="px-4 py-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 font-urbanist ${
                      isActive
                        ? "bg-cyan-500/10 text-cyan-400 shadow-sm"
                        : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}

              {/* Create New Event in Mobile Menu */}
              <button
                onClick={handleCreateEvent}
                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl bg-gradient-to-br from-[#21935B] via-[#1a7549] to-[#145a39] hover:from-[#28a968] hover:via-[#21935B] hover:to-[#1a7549] text-white font-urbanist shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 border border-[#21935B]/30 hover:border-[#21935B]/50 mt-3"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium tracking-wide">
                  Create Event
                </span>
              </button>
            </div>
          </div>
        </>
      )}

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        isLoading={isLoggingOut}
      />
    </>
  );
}
