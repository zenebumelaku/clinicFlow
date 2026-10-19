import React from "react";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  UserCheck,
  Users,
  Stethoscope,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  Hospital,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Role } from "../../types";

interface AppSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onClose: () => void;
  role: Role;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentPath,
  onNavigate,
  isOpen,
  onClose,
  role,
}) => {
  const getNavItems = () => {
    if (role === "doctor") {
      return [
        {
          label: "My Consultations",
          path: "/doctor/overview",
          icon: LayoutDashboard,
        },
        { label: "Patient Queue", path: "/doctor/queue", icon: Clock },
        { label: "Schedule", path: "/doctor/appointments", icon: Calendar },
        { label: "Patients", path: "/doctor/patients", icon: Users },
        { label: "Notifications", path: "/doctor/notifications", icon: Bell },
      ];
    }

    if (role === "patient") {
      return [
        {
          label: "Patient Portal",
          path: "/patient/dashboard",
          icon: LayoutDashboard,
        },
        { label: "Live Ticket Status", path: "/patient/queue", icon: Clock },
        {
          label: "Appointments",
          path: "/patient/appointments",
          icon: Calendar,
        },
        {
          label: "Billing & Receipts",
          path: "/patient/payments",
          icon: CreditCard,
        },
        { label: "Notifications", path: "/patient/notifications", icon: Bell },
      ];
    }

    // Admin & Receptionist nav items
    const mainNav = [
      {
        label: "Clinic Overview",
        path: "/dashboard/overview",
        icon: LayoutDashboard,
      },
      {
        label: "Appointments",
        path: "/dashboard/appointments",
        icon: Calendar,
      },
      { label: "Live Queue & Totem", path: "/dashboard/queue", icon: Clock },
      {
        label: "Patient Check-In",
        path: "/dashboard/check-in",
        icon: UserCheck,
      },
      { label: "Patients Directory", path: "/dashboard/patients", icon: Users },
      {
        label: "Doctors & Suites",
        path: "/dashboard/doctors",
        icon: Stethoscope,
      },
      {
        label: "Chapa & Payments",
        path: "/dashboard/payments",
        icon: CreditCard,
      },
      {
        label: "Reports & Analytics",
        path: "/dashboard/reports",
        icon: BarChart3,
      },
    ];

    return mainNav;
  };

  const navItems = getNavItems();

  const bottomNavItems =
    role === "admin"
      ? [
          {
            label: "Notifications",
            path: "/dashboard/notifications",
            icon: Bell,
          },
          {
            label: "Clinic Settings",
            path: "/dashboard/settings",
            icon: Settings,
          },
        ]
      : role === "receptionist"
        ? [
            {
              label: "Notifications",
              path: "/dashboard/notifications",
              icon: Bell,
            },
          ]
        : [];
  const roleLabel =
    role === "admin"
      ? "Clinic Admin"
      : role === "receptionist"
        ? "Reception"
        : role === "doctor"
          ? "Doctor Workspace"
          : "Patient Care";
  const roleAccent =
    role === "patient"
      ? "bg-violet-700 border-violet-800"
      : role === "doctor"
        ? "bg-emerald-800 border-emerald-900"
        : "bg-[#1E40AF] border-[#1E3A8A]";

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container: Whole Blue with White Text (Light mode) / Pure Neutral Dark (Dark mode) */}
      <aside
        className={cn(
          `fixed inset-y-0 left-0 z-40 w-72 sm:w-[280px] ${roleAccent} text-white flex flex-col transition-all duration-200 ease-in-out border-r dark:bg-[#09090b] dark:text-zinc-100 dark:border-zinc-800 lg:static lg:translate-x-0 shrink-0 shadow-xl lg:shadow-none`,
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4.5 border-b border-blue-700/60 dark:border-zinc-800 justify-between">
          <button
            onClick={() => onNavigate("/")}
            className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none min-w-0"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 dark:bg-zinc-800 border border-white/30 dark:border-zinc-700 flex items-center justify-center text-white dark:text-blue-400 font-bold shadow-2xs group-hover:bg-white group-hover:text-[#1E40AF] dark:group-hover:bg-blue-600 dark:group-hover:text-white transition-all shrink-0">
              <Hospital className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold text-white tracking-tight flex items-center gap-2">
                <span className="whitespace-nowrap">
                  ClinicFlow
                  <span className="text-blue-200 dark:text-blue-400"></span>
                </span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-zinc-800 text-white dark:text-zinc-300 border border-white/30 dark:border-zinc-700 shrink-0">
                  {roleLabel}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10.5px] font-bold text-blue-200/90 dark:text-zinc-500 uppercase tracking-wider">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path);
                  onClose();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer text-left group",
                  isActive
                    ? "bg-white text-[#1E40AF] shadow-md shadow-blue-950/20 dark:bg-zinc-800 dark:text-white dark:border dark:border-zinc-700"
                    : "text-white/90 hover:text-white hover:bg-white/15 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900/80 font-medium",
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive
                      ? "text-[#1E40AF] dark:text-blue-400"
                      : "text-blue-200 dark:text-zinc-400 group-hover:text-white",
                  )}
                />
                <span className="flex-1 whitespace-nowrap tracking-tight">
                  {item.label}
                </span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-[#1E40AF] dark:text-white shrink-0 ml-1" />
                )}
              </button>
            );
          })}

          {(role === "admin" || role === "receptionist") && (
            <div className="pt-4 mt-2 border-t border-blue-700/40 dark:border-zinc-800/80">
              <div className="px-3 pb-2 text-[10.5px] font-bold text-blue-200/90 dark:text-zinc-500 uppercase tracking-wider">
                System
              </div>
              {bottomNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      onNavigate(item.path);
                      onClose();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer text-left group",
                      isActive
                        ? "bg-white text-[#1E40AF] shadow-md shadow-blue-950/20 dark:bg-zinc-800 dark:text-white dark:border dark:border-zinc-700"
                        : "text-white/90 hover:text-white hover:bg-white/15 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900/80 font-medium",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive
                          ? "text-[#1E40AF] dark:text-blue-400"
                          : "text-blue-200 dark:text-zinc-400 group-hover:text-white",
                      )}
                    />
                    <span className="flex-1 whitespace-nowrap tracking-tight">
                      {item.label}
                    </span>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-[#1E40AF] dark:text-white shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {role !== "patient" && (
          <div className="p-3 mx-3 mb-3 rounded-2xl bg-blue-900/60 dark:bg-zinc-900/80 border border-blue-400/30 dark:border-zinc-800 text-xs text-white">
            <div className="flex items-center gap-2 text-white font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="whitespace-nowrap">
                {role === "doctor"
                  ? "Queue updates live"
                  : "Clinic Operational"}
              </span>
            </div>
            <div className="mt-1 text-blue-100 dark:text-zinc-400 text-[11px] font-normal leading-relaxed">
              {role === "doctor"
                ? "Your assigned queue refreshes automatically."
                : "Clinic operations are ready for the day."}
            </div>
          </div>
        )}

        {/* Footer profile & exit to marketing */}
        <div className="p-3 border-t border-blue-700/60 dark:border-zinc-800">
          <button
            onClick={() => onNavigate("/")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-100 hover:text-white hover:bg-white/15 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900/80 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-blue-200 dark:text-zinc-400 shrink-0" />
            <span className="whitespace-nowrap">Back to Public Site</span>
          </button>
        </div>
      </aside>
    </>
  );
};
