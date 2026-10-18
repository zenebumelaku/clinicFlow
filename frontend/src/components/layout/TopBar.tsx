import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  Bell,
  Search,
  User,
  CheckCircle2,
  Building2,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  LogOut,
} from "lucide-react";
import { Role } from "../../types";
import { useClinicData } from "../../lib/hooks/useClinic";
import { useTheme } from "../../lib/theme";

interface TopBarProps {
  onToggleSidebar: () => void;
  role: Role;
  userName: string;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  role,
  userName,
  onLogout,
  onNavigate,
}) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } =
    useClinicData();
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const notifRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const workspaceLabel = role === "patient"
    ? "Your care"
    : role === "doctor"
      ? "Clinical workspace"
      : role === "receptionist"
        ? "Front desk"
        : "Clinic administration";
  const patientSearchPath = role === "doctor"
    ? "/doctor/patients"
    : "/dashboard/patients";
  const notificationsPath = role === "patient"
    ? "/patient/notifications"
    : role === "doctor"
      ? "/doctor/notifications"
      : "/dashboard/notifications";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-[#09090b] border-b border-[#E6EAF0] dark:border-zinc-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile trigger & clinic branch */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-[#667085] dark:text-zinc-400 hover:bg-[#F7FAFC] dark:hover:bg-zinc-800 lg:hidden cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2.5 text-xs text-[#667085] dark:text-zinc-400">
          <div className="w-7 h-7 rounded-lg bg-[#EFF4FF] dark:bg-blue-950/40 text-[#1D5BD8] dark:text-[#93C5FD] flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4 text-[#1D5BD8] dark:text-[#60A5FA]" />
          </div>
          <div>
            <span className="font-bold text-[#172033] dark:text-white">
              ClinicFlow
            </span>
            <span className="text-[#667085] dark:text-zinc-500 mx-1.5">·</span>
            <span className="text-[#667085] dark:text-zinc-400 font-medium">
              {workspaceLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Middle: Search bar */}
      {role !== "patient" && (
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={role === "doctor" ? "Search clinic patients..." : "Search patient MRN, phone or name..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                onNavigate(
                  `${patientSearchPath}?search=${encodeURIComponent(searchQuery)}`,
                );
              }
            }}
            className="w-full pl-9 pr-12 py-1.5 text-xs bg-slate-100/80 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:border-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/15 transition-all font-medium"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 dark:text-zinc-400 bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700 pointer-events-none">
            ↵
          </kbd>
        </div>
      </div>
      )}

      {/* Right actions: Theme Toggle, Notifications, Account */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Options & Quick Toggle */}
        <div className="relative" ref={themeRef}>
          <div className="flex items-center">
            <button
              onClick={toggleTheme}
              type="button"
              className="p-2 rounded-l-xl text-slate-600 dark:text-zinc-300 hover:text-[#1D5BD8] dark:hover:text-[#60A5FA] hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 dark:text-zinc-300 animate-in -spin-in-180 duration-300" />
              )}
            </button>
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              type="button"
              className="py-2 px-1 rounded-r-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
              title="Theme options"
              aria-label="Theme options"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#121214] rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Theme Options
              </div>
              <button
                type="button"
                onClick={() => {
                  setTheme("light");
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                  theme === "light"
                    ? "bg-[#EFF4FF] dark:bg-blue-950/40 text-[#1D5BD8] dark:text-[#93C5FD] font-semibold"
                    : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </div>
                {theme === "light" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1D5BD8] dark:text-[#60A5FA]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme("dark");
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                  theme === "dark"
                    ? "bg-[#EFF4FF] dark:bg-blue-950/40 text-[#1D5BD8] dark:text-[#93C5FD] font-semibold"
                    : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Dark</span>
                </div>
                {theme === "dark" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1D5BD8] dark:text-[#60A5FA]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme("system");
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                  theme === "system"
                    ? "bg-[#EFF4FF] dark:bg-blue-950/40 text-[#1D5BD8] dark:text-[#93C5FD] font-semibold"
                    : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                  <span>System</span>
                </div>
                {theme === "system" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1D5BD8] dark:text-[#60A5FA]" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white relative transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#121214] rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 p-0 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-900/70 rounded-t-xl">
                <div className="text-xs font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <span>{role === "patient" ? "Your Care Updates" : "Notifications"}</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 bg-[#EFF4FF] dark:bg-blue-950/30 text-[#1D5BD8] dark:text-[#93C5FD] border border-[#BFDBFE] dark:border-blue-800/40 rounded font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsAsRead()}
                    className="text-[11px] text-[#1D5BD8] dark:text-[#60A5FA] hover:text-[#1548B0] font-medium cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-zinc-500">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-3 text-xs hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors ${
                        !n.read ? "bg-[#EFF4FF]/60 dark:bg-blue-950/20" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {n.title}
                        </span>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1D5BD8] dark:bg-[#60A5FA] shrink-0" />
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-zinc-400 text-[11px] mt-1 leading-snug">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-100 dark:border-zinc-800 text-center bg-slate-50/50 dark:bg-zinc-900/50 rounded-b-xl">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate(notificationsPath);
                  }}
                  className="text-xs text-[#1D5BD8] dark:text-[#60A5FA] font-medium hover:text-[#1548B0] cursor-pointer"
                >
                  View all alerts
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900">
          <div className="w-7 h-7 rounded-full bg-[#1D5BD8] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {role === "admin" && "A"}
            {role === "receptionist" && "R"}
            {role === "doctor" && "D"}
            {role === "patient" && "P"}
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">
              {userName}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-medium">
              Role: {role}
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Log out"
            aria-label="Log out"
            className="p-2 rounded-lg text-slate-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
