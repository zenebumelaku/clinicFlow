import React, { useState, useEffect } from "react";
import {
  Hospital,
  Lock,
  Phone,
  ArrowRight,
  Stethoscope,
  Users,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { authService } from "../../lib/services/authService";
import medicalVisual from "../../assets/images/auth_medical_visual_1791475805267.jpg";

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

type PortalKind = "patient" | "doctor" | "admin";

const DEMO_CREDENTIALS: Record<
  PortalKind,
  { identifier: string; pass: string }
> = {
  patient: { identifier: "+251911223344", pass: "ClinicFlow@2026" },
  doctor: {
    identifier: "doctor.hana@ClinicFlow-demo.local",
    pass: "ClinicFlow@2026",
  },
  admin: { identifier: "admin@ClinicFlow-demo.local", pass: "ClinicFlow@2026" },
};

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { success, error } = useToast();
  const searchPortal = new URLSearchParams(window.location.search).get(
    "portal",
  ) as PortalKind | null;
  const initialPortal: PortalKind =
    searchPortal && ["doctor", "patient", "admin"].includes(searchPortal)
      ? searchPortal
      : "patient";

  const [activePortal, setActivePortal] = useState<PortalKind>(initialPortal);
  const [identifier, setIdentifier] = useState(
    DEMO_CREDENTIALS[initialPortal].identifier,
  );
  const [password, setPassword] = useState(
    DEMO_CREDENTIALS[initialPortal].pass,
  );
  const [loading, setLoading] = useState(false);

  // Sync with URL query parameter when route loads or changes
  useEffect(() => {
    const portalFromUrl = new URLSearchParams(window.location.search).get(
      "portal",
    ) as PortalKind | null;
    if (
      portalFromUrl &&
      ["doctor", "patient", "admin"].includes(portalFromUrl) &&
      portalFromUrl !== activePortal
    ) {
      setActivePortal(portalFromUrl);
      setIdentifier(DEMO_CREDENTIALS[portalFromUrl].identifier);
      setPassword(DEMO_CREDENTIALS[portalFromUrl].pass);
    }
  }, [activePortal]);

  const handleSelectPortal = (portal: PortalKind) => {
    setActivePortal(portal);
    setIdentifier(DEMO_CREDENTIALS[portal].identifier);
    setPassword(DEMO_CREDENTIALS[portal].pass);
    const url = new URL(window.location.href);
    url.searchParams.set("portal", portal);
    window.history.replaceState({}, "", url.toString());
  };

  const handleDemoLogin = async (role: PortalKind) => {
    setLoading(true);
    try {
      const user = await authService.demoLogin(role);
      success(`Signed in to the ${role} portal as ${user.firstName}`);
      onNavigate(
        role === "doctor"
          ? "/doctor/overview"
          : role === "patient"
            ? "/patient/dashboard"
            : "/dashboard/overview",
      );
    } catch (loginError) {
      error(
        loginError instanceof Error ? loginError.message : "Unable to sign in.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!identifier.trim()) {
      error("Please enter your phone number or email address.");
      return;
    }
    if (!password) {
      error("Please enter your password.");
      return;
    }
    setLoading(true);
    try {
      const user = await authService.login(identifier, password);
      const actualRole = user.role.toLowerCase();
      success(`Signed in as ${user.firstName} (${actualRole})`);
      onNavigate(
        actualRole === "doctor"
          ? "/doctor/overview"
          : actualRole === "patient"
            ? "/patient/dashboard"
            : "/dashboard/overview",
      );
    } catch (loginError) {
      error(
        loginError instanceof Error
          ? loginError.message
          : "Invalid identifier or password.",
      );
    } finally {
      setLoading(false);
    }
  };

  const portalConfig: Record<
    PortalKind,
    {
      title: string;
      subtitle: string;
      icon: typeof Users;
      badge: string;
      badgeClass: string;
      buttonClass: string;
      boxClass: string;
      launchLabel: string;
      targetRoute: string;
      registerLabel: string;
      registerPath: string;
    }
  > = {
    patient: {
      title: "Patient Care Portal Sign In",
      subtitle:
        "Access your live clinic queue ticket, doctor appointments, and medical receipts.",
      icon: Users,
      badge: "Patient Portal",
      badgeClass:
        "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800",
      buttonClass: "bg-violet-700 hover:bg-violet-800 text-white",
      boxClass:
        "border-violet-200 bg-violet-50/70 dark:border-violet-900/60 dark:bg-violet-950/30",
      launchLabel: "1-Click Launch Patient Portal (Abebe Kebede)",
      targetRoute: "/patient/dashboard",
      registerLabel: "Sign up as Patient",
      registerPath: "/register?type=patient",
    },
    doctor: {
      title: "Doctor Workspace Sign In",
      subtitle:
        "Sign in to access your assigned queue, consultation desk, and patient charts.",
      icon: Stethoscope,
      badge: "Doctor Portal",
      badgeClass:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
      buttonClass: "bg-emerald-700 hover:bg-emerald-800 text-white",
      boxClass:
        "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30",
      launchLabel: "1-Click Launch Doctor Workspace (Dr. Hana)",
      targetRoute: "/doctor/overview",
      registerLabel: "Register as Doctor",
      registerPath: "/register?type=doctor",
    },
    admin: {
      title: "Clinic Admin Portal Sign In",
      subtitle:
        "Sign in to front desk management, queue totem, staff oversight, and payments.",
      icon: Hospital,
      badge: "Clinic Admin Portal",
      badgeClass:
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
      buttonClass: "bg-blue-700 hover:bg-blue-800 text-white",
      boxClass:
        "border-blue-200 bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/30",
      launchLabel: "1-Click Launch Clinic Admin Portal",
      targetRoute: "/dashboard/overview",
      registerLabel: "Register a Clinic",
      registerPath: "/register?type=clinic",
    },
  };

  const current = portalConfig[activePortal];
  const CurrentIcon = current.icon;

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 transition-colors">
      {/* Left Visual Column */}
      <div className="hidden lg:block lg:col-span-5 relative bg-zinc-950 overflow-hidden">
        <img
          src={medicalVisual}
          alt="ClinicFlow Healthcare Architecture"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/40 to-zinc-900/20" />

        <div className="absolute inset-0 p-12 flex flex-col justify-between text-white z-10">
          <button
            type="button"
            onClick={() => onNavigate("/")}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#1D5BD8] flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform">
              <Hospital className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">ClinicFlow</span>
          </button>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur border border-white/20 text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Multi-Tenant Healthcare Security</span>
            </div>
            <h2 className="text-2xl font-bold leading-tight">
              Smarter clinic operations. Better patient experiences.
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-sm">
              Empowering healthcare facilities in Addis Ababa and across
              Ethiopia with seamless patient check-in, real-time queues, and
              role-separated portals.
            </p>
            <div className="pt-4 flex items-center gap-4 text-xs text-zinc-400">
              <span>Bole Specialty Clinic</span>
              <span>·</span>
              <span>Kazanchis Medical Hub</span>
              <span>·</span>
              <span>MOH Certified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Column */}
      <div className="lg:col-span-7 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 bg-white dark:bg-[#09090b]">
        <div className="max-w-md w-full mx-auto space-y-6">
          {/* Mobile Brand Link */}
          <button
            type="button"
            onClick={() => onNavigate("/")}
            className="flex items-center gap-2 lg:hidden mb-2 text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#1D5BD8] flex items-center justify-center text-white">
              <Hospital className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              ClinicFlow
            </span>
          </button>

          {/* Interactive 3-Portal Tab Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              Select Portal Sign In
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => handleSelectPortal("patient")}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activePortal === "patient"
                    ? "bg-white dark:bg-zinc-900 text-violet-700 dark:text-violet-300 shadow-xs border border-violet-200/80 dark:border-violet-900/60"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-zinc-700/50"
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Patient</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPortal("doctor")}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activePortal === "doctor"
                    ? "bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-300 shadow-xs border border-emerald-200/80 dark:border-emerald-900/60"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-zinc-700/50"
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                <span>Doctor</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPortal("admin")}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activePortal === "admin"
                    ? "bg-white dark:bg-zinc-900 text-blue-700 dark:text-blue-300 shadow-xs border border-blue-200/80 dark:border-blue-900/60"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-zinc-700/50"
                }`}
              >
                <Hospital className="w-3.5 h-3.5 shrink-0" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Header */}
          <div className="space-y-1.5">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${current.badgeClass}`}
            >
              <CurrentIcon className="w-3.5 h-3.5" />
              <span>{current.badge}</span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {current.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {current.subtitle}
            </p>
          </div>

          {/* Option A: Quick 1-Click Launch Button */}
          <div className={`p-4 rounded-2xl border ${current.boxClass}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Option 1: Quick 1-Click Test Access
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                Verified Profile
              </span>
            </div>
            <Button
              size="lg"
              onClick={() => void handleDemoLogin(activePortal)}
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className={`w-full ${current.buttonClass}`}
            >
              {current.launchLabel}
            </Button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-zinc-800" />
            <span className="absolute bg-white px-3 text-[11px] font-semibold text-slate-400 dark:bg-[#09090b] dark:text-zinc-500 uppercase tracking-wider">
              Option 2: Sign in with Password
            </span>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleLogin();
            }}
            className="space-y-4"
          >
            <Input
              label="Phone Number or Email"
              placeholder="+251 9... or 09... or email@example.com"
              leftIcon={<Phone className="w-4 h-4" />}
              name="username"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate("/forgot-password")}
                  className="text-xs text-[#1D5BD8] dark:text-[#60A5FA] hover:underline font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                type="password"
                placeholder="Enter your password"
                leftIcon={<Lock className="w-4 h-4" />}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className={`w-full mt-2 ${current.buttonClass}`}
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to {current.badge}
            </Button>
          </form>

          {/* Option C: Role-Tailored Registration */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 flex items-center justify-between">
            <span>Don't have an account?</span>
            <button
              type="button"
              onClick={() => onNavigate(current.registerPath)}
              className="font-bold text-[#1D5BD8] dark:text-[#60A5FA] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>{current.registerLabel}</span>
              <span className="text-xs">→</span>
            </button>
          </div>

          {/* Back to landing */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
            <button
              onClick={() => onNavigate("/")}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-medium"
            >
              ← Back to public website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
