import React from "react";
import {
  Hospital,
  Sparkles,
  ChevronDown,
  Calendar,
  ShieldCheck,
  Sun,
  Moon,
  Monitor,
  CheckCircle2,
  Stethoscope,
  Users,
} from "lucide-react";
import { useTheme } from "../../lib/theme";

interface PublicNavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  currentPath,
  onNavigate,
}) => {
  const isHome = currentPath === "/";
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showPortalsMenu, setShowPortalsMenu] = React.useState(false);
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = React.useState(false);
  const themeRef = React.useRef<HTMLDivElement>(null);
  const portalsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        themeRef.current &&
        !themeRef.current.contains(event.target as Node)
      ) {
        setShowThemeMenu(false);
      }
      if (
        portalsRef.current &&
        !portalsRef.current.contains(event.target as Node)
      ) {
        setShowPortalsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    setShowPortalsMenu(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-md border-b border-[#E6EAF0] dark:border-zinc-800/80 ${
        isScrolled ? "h-18 shadow-sm" : "h-20"
      }`}
    >
      <div className="max-w-[1280px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand wordmark & emblem */}
        <button
          onClick={() => handleNavClick("/")}
          className="flex items-center gap-3 text-left cursor-pointer focus:outline-none group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-[#1D5BD8] flex items-center justify-center text-white shadow-xs transition-transform duration-300 group-hover:scale-105 shrink-0">
            <Hospital className="w-5 h-5 transition-transform duration-300 group-hover:rotate-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-[#172033] dark:text-white">
                ClinicFlow
                <span className="text-[#1D5BD8] dark:text-[#3B82F6]"></span>
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#667085] dark:text-zinc-400 leading-none hidden sm:block">
              Addis Ababa Private Clinic Care
            </p>
          </div>
        </button>

        {/* Desktop Navigation Links - Responsively spaced so text fits cleanly */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-3 2xl:gap-5 text-xs xl:text-sm font-medium text-[#667085] dark:text-zinc-300 whitespace-nowrap">
          <button
            onClick={() => handleNavClick("/")}
            className={`transition-colors duration-200 cursor-pointer hover:text-[#1D5BD8] dark:hover:text-[#60A5FA] relative py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/60 ${
              isHome ? "text-[#1D5BD8] dark:text-[#60A5FA] font-bold" : ""
            }`}
          >
            Overview
            {isHome && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#1D5BD8] dark:bg-[#60A5FA] rounded-full" />
            )}
          </button>
          <button
            onClick={() => handleNavClick("/#services")}
            className="transition-colors duration-200 cursor-pointer hover:text-[#1D5BD8] dark:hover:text-[#60A5FA] py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/60"
          >
            Services
          </button>
          <button
            onClick={() => handleNavClick("/#specialties")}
            className="transition-colors duration-200 cursor-pointer hover:text-[#1D5BD8] dark:hover:text-[#60A5FA] py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/60"
          >
            Specialties
          </button>
          <button
            onClick={() => handleNavClick("/#how-it-works")}
            className="hidden xl:inline-block transition-colors duration-200 cursor-pointer hover:text-[#1D5BD8] dark:hover:text-[#60A5FA] py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/60"
          >
            How It Works
          </button>
          <button
            onClick={() => handleNavClick("/about")}
            className={`transition-colors duration-200 cursor-pointer hover:text-[#1D5BD8] dark:hover:text-[#60A5FA] py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/60 ${
              currentPath === "/about"
                ? "text-[#1D5BD8] dark:text-[#60A5FA] font-bold"
                : ""
            }`}
          >
            About
          </button>
          <button
            onClick={() => handleNavClick("/contact")}
            className={`transition-colors duration-200 cursor-pointer hover:text-[#1D5BD8] dark:hover:text-[#60A5FA] py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/60 ${
              currentPath === "/contact"
                ? "text-[#1D5BD8] dark:text-[#60A5FA] font-bold"
                : ""
            }`}
          >
            Contact
          </button>
          <div className="relative" ref={portalsRef}>
            <button
              type="button"
              onClick={() => setShowPortalsMenu((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={showPortalsMenu}
              className="inline-flex items-center gap-1 transition-colors duration-200 cursor-pointer hover:text-[#1D5BD8] dark:hover:text-[#60A5FA] py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/60"
            >
              Portals
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showPortalsMenu && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 text-sm text-slate-700 shadow-xl dark:border-zinc-800 dark:bg-[#121214] dark:text-zinc-200"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNavClick("/portals/patient")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left hover:bg-blue-50 hover:text-[#1D5BD8] dark:hover:bg-zinc-800 dark:hover:text-blue-300"
                >
                  <Users className="h-4 w-4" />
                  Patient Portal
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNavClick("/portals/doctor")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left hover:bg-blue-50 hover:text-[#1D5BD8] dark:hover:bg-zinc-800 dark:hover:text-blue-300"
                >
                  <Stethoscope className="h-4 w-4" />
                  Doctor Portal
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNavClick("/portals/admin")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left hover:bg-blue-50 hover:text-[#1D5BD8] dark:hover:bg-zinc-800 dark:hover:text-blue-300"
                >
                  <Hospital className="h-4 w-4" />
                  Admin Portal
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Theme Options & Quick Toggle */}
          <div className="relative" ref={themeRef}>
            <div className="flex items-center">
              <button
                onClick={toggleTheme}
                type="button"
                className="p-1.5 sm:px-2.5 sm:py-2 rounded-l-xl text-slate-600 dark:text-zinc-300 hover:text-[#1D5BD8] dark:hover:text-[#60A5FA] hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5 border border-r-0 border-slate-200 dark:border-zinc-700"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle dark/light theme"
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-300" />
                    <span className="text-xs font-semibold hidden md:inline">
                      Light
                    </span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-700 dark:text-zinc-300 animate-in -spin-in-180 duration-300" />
                    <span className="text-xs font-semibold hidden md:inline">
                      Dark
                    </span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                type="button"
                className="p-1.5 sm:py-2 px-1.5 rounded-r-xl text-slate-500 dark:text-zinc-400 hover:text-[#1D5BD8] dark:hover:text-[#60A5FA] hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer"
                title="Theme Options: Light, Dark, System"
                aria-label="Open theme options menu"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Theme Options Dropdown Menu */}
            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800">
                  Theme Appearance
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTheme("light");
                    setShowThemeMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
                    theme === "light"
                      ? "text-[#1D5BD8] dark:text-[#60A5FA] font-bold bg-[#EFF4FF]/60 dark:bg-blue-950/20"
                      : "text-slate-700 dark:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Light Mode</span>
                  </div>
                  {theme === "light" && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1D5BD8]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTheme("dark");
                    setShowThemeMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
                    theme === "dark"
                      ? "text-[#1D5BD8] dark:text-[#60A5FA] font-bold bg-[#EFF4FF]/60 dark:bg-blue-950/20"
                      : "text-slate-700 dark:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-blue-400" />
                    <span>Dark Mode</span>
                  </div>
                  {theme === "dark" && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1D5BD8]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTheme("system");
                    setShowThemeMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
                    theme === "system"
                      ? "text-[#1D5BD8] dark:text-[#60A5FA] font-bold bg-[#EFF4FF]/60 dark:bg-blue-950/20"
                      : "text-slate-700 dark:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-slate-400" />
                    <span>System Default</span>
                  </div>
                  {theme === "system" && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1D5BD8]" />
                  )}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => handleNavClick("/login")}
            className="text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg text-[#667085] dark:text-zinc-300 hover:text-[#172033] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all duration-200 cursor-pointer whitespace-nowrap"
          >
            Sign In
          </button>
          <button
            onClick={() => handleNavClick("/register")}
            className="text-xs sm:text-[13px] font-semibold px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-[#1D5BD8] text-white hover:bg-[#1548B0] transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Register Clinic</span>
            <span className="hidden md:inline-block w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
          </button>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-[#09090b] border-b border-[#E6EAF0] dark:border-zinc-800 px-4 pt-3 pb-5 space-y-3 shadow-lg animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-2 text-sm font-medium text-[#172033] dark:text-zinc-200">
            <button
              onClick={() => handleNavClick("/")}
              className="text-left px-3 py-2 rounded-lg hover:bg-[#EFF4FF] dark:hover:bg-zinc-800 hover:text-[#1D5BD8]"
            >
              Overview
            </button>
            <button
              onClick={() => handleNavClick("/#services")}
              className="text-left px-3 py-2 rounded-lg hover:bg-[#EFF4FF] dark:hover:bg-zinc-800 hover:text-[#1D5BD8]"
            >
              Services
            </button>
            <button
              onClick={() => handleNavClick("/#specialties")}
              className="text-left px-3 py-2 rounded-lg hover:bg-[#EFF4FF] dark:hover:bg-zinc-800 hover:text-[#1D5BD8] dark:hover:text-[#60A5FA] transition-colors"
            >
              Specialties
            </button>
            <button
              onClick={() => handleNavClick("/#how-it-works")}
              className="text-left px-3 py-2 rounded-lg hover:bg-[#EFF4FF] dark:hover:bg-zinc-800 hover:text-[#1D5BD8] dark:hover:text-[#60A5FA] transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => handleNavClick("/about")}
              className="text-left px-3 py-2 rounded-lg hover:bg-[#EFF4FF] dark:hover:bg-zinc-800 hover:text-[#1D5BD8] dark:hover:text-[#60A5FA] transition-colors"
            >
              About
            </button>
            <button
              onClick={() => handleNavClick("/contact")}
              className="text-left px-3 py-2 rounded-lg hover:bg-[#EFF4FF] dark:hover:bg-zinc-800 hover:text-[#1D5BD8] dark:hover:text-[#60A5FA] transition-colors"
            >
              Contact
            </button>
            <button
              onClick={() => handleNavClick("/portals/patient")}
              className="text-left px-3 py-2 rounded-lg hover:bg-[#EFF4FF] dark:hover:bg-zinc-800 text-[#1D5BD8] dark:text-[#60A5FA] font-semibold transition-colors"
            >
              Patient Portal
            </button>
            <button
              onClick={() => handleNavClick("/portals/doctor")}
              className="text-left px-3 py-2 rounded-lg hover:bg-[#EFF4FF] dark:hover:bg-zinc-800 hover:text-[#1D5BD8] dark:hover:text-[#60A5FA] transition-colors"
            >
              Doctor Portal
            </button>
            <button
              onClick={() => handleNavClick("/portals/admin")}
              className="text-left px-3 py-2 rounded-lg hover:bg-[#EFF4FF] dark:hover:bg-zinc-800 hover:text-[#1D5BD8] dark:hover:text-[#60A5FA] transition-colors"
            >
              Admin Portal
            </button>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                Theme
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-zinc-700 p-0.5 bg-slate-100 dark:bg-zinc-800">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                    theme === "light"
                      ? "bg-white dark:bg-zinc-700 text-[#1D5BD8] dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-zinc-300"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 inline mr-1 text-amber-500" />{" "}
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-white dark:bg-zinc-700 text-[#1D5BD8] dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-zinc-300"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 inline mr-1 text-blue-400" />{" "}
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                    theme === "system"
                      ? "bg-white dark:bg-zinc-700 text-[#1D5BD8] dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-zinc-300"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5 inline mr-1 text-slate-400" />{" "}
                  Auto
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleNavClick("/login")}
                className="w-1/2 text-xs font-semibold py-2 rounded-lg text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-center transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNavClick("/register")}
                className="w-1/2 text-xs font-bold py-2 rounded-lg bg-[#1D5BD8] text-white text-center shadow-xs"
              >
                Register Clinic
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
