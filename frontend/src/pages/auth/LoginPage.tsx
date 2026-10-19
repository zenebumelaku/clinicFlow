import React, { useState } from "react";
import { Hospital, Lock, Phone, ArrowRight, Stethoscope, Users, Sparkles } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { authService } from "../../lib/services/authService";
import medicalVisual from "../../assets/images/auth_medical_visual_1791475805267.jpg";

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { success, error } = useToast();
  const requestedPortal = new URLSearchParams(window.location.search).get("portal") as "doctor" | "patient" | "admin" | null;

  const defaultIdentifier = requestedPortal === "doctor"
    ? "doctor.hana@mediflow-demo.local"
    : requestedPortal === "patient"
      ? "+251911223344"
      : requestedPortal === "admin"
        ? "admin@mediflow-demo.local"
        : "";

  const [identifier, setIdentifier] = useState(defaultIdentifier);
  const [password, setPassword] = useState(defaultIdentifier ? "ClinicFlow@2026" : "");
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async (role: "admin" | "doctor" | "patient") => {
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
    setLoading(true);
    try {
      const targetRole = requestedPortal || (identifier.toLowerCase().includes("doc") || identifier.toLowerCase().includes("hana") ? "doctor" : identifier.toLowerCase().includes("pat") || identifier.toLowerCase().includes("abebe") ? "patient" : "admin");
      
      const user = await authService.login(
        identifier || (targetRole === "doctor" ? "doctor.hana@mediflow-demo.local" : targetRole === "patient" ? "+251911223344" : "admin@mediflow-demo.local"),
        password || "ClinicFlow@2026",
        targetRole,
      );

      const actualRole = user.role.toLowerCase() as Role;
      success(`Signed in to the ${actualRole} portal`);
      onNavigate(
        actualRole === "doctor"
          ? "/doctor/overview"
          : actualRole === "patient"
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

  const portalConfig = {
    doctor: {
      title: "Doctor Workspace Sign In",
      subtitle: "Dedicated clinical consultation desk, queue, and patient records.",
      icon: Stethoscope,
      color: "emerald",
      badge: "Doctor Portal",
      launchLabel: "Launch Doctor Workspace (Dr. Hana)",
    },
    patient: {
      title: "Patient Care Portal Sign In",
      subtitle: "View live queue totem status, book appointments, and check receipts.",
      icon: Users,
      color: "violet",
      badge: "Patient Portal",
      launchLabel: "Launch Patient Portal (Abebe Kebede)",
    },
    admin: {
      title: "Clinic Admin Portal Sign In",
      subtitle: "Front desk management, queue totem, appointments, and billing.",
      icon: Hospital,
      color: "blue",
      badge: "Admin Portal",
      launchLabel: "Launch Clinic Admin Portal",
    },
  };

  const currentConfig = requestedPortal ? portalConfig[requestedPortal] : null;

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
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1D5BD8] flex items-center justify-center text-white font-bold">
              <Hospital className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">ClinicFlow</span>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold leading-tight">
              Smarter clinic operations. Better patient experiences.
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-sm">
              Empowering healthcare facilities in Addis Ababa and across
              Ethiopia with seamless patient check-in, real-time queues, and
              local billing.
            </p>
            <div className="pt-4 flex items-center gap-4 text-xs text-zinc-400">
              <span>Bole Specialty Clinic Portal</span>
              <span>·</span>
              <span>MOH Certified Standard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Column */}
      <div className="lg:col-span-7 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 bg-white dark:bg-[#09090b]">
        <div className="max-w-md w-full mx-auto space-y-7">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 lg:hidden mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#1D5BD8] flex items-center justify-center text-white">
                <Hospital className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                ClinicFlow
              </span>
            </div>

            {currentConfig && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 mb-1 border border-slate-200 dark:border-zinc-700">
                <currentConfig.icon className="w-3.5 h-3.5 text-[#1D5BD8]" />
                <span>{currentConfig.badge}</span>
              </div>
            )}

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {currentConfig ? currentConfig.title : "Sign in to ClinicFlow"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {currentConfig
                ? currentConfig.subtitle
                : "Select your dedicated portal workspace below or sign in with credentials:"}
            </p>
          </div>

          {/* If requestedPortal: Show Dedicated Prominent 1-Click Launch Button */}
          {requestedPortal ? (
            <div className={`p-4 rounded-2xl border ${
              requestedPortal === 'doctor'
                ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30'
                : requestedPortal === 'patient'
                  ? 'border-violet-200 bg-violet-50/70 dark:border-violet-900/60 dark:bg-violet-950/30'
                  : 'border-blue-200 bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  1-Click Direct Launch
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">Instant Access</span>
              </div>
              <Button
                size="lg"
                onClick={() => void handleDemoLogin(requestedPortal)}
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className={`w-full ${
                  requestedPortal === 'doctor'
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    : requestedPortal === 'patient'
                      ? 'bg-violet-700 hover:bg-violet-800 text-white'
                      : 'bg-blue-700 hover:bg-blue-800 text-white'
                }`}
              >
                {currentConfig?.launchLabel}
              </Button>
            </div>
          ) : (
            /* If no portal query: 3 Interactive Portal Cards */
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Choose Your Portal:</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-3">
                1-click to launch the dedicated workspace for your role:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => void handleDemoLogin("admin")}
                  disabled={loading}
                  className="flex flex-col items-center justify-center rounded-xl border border-blue-200 bg-white p-2.5 text-center text-xs font-semibold text-blue-900 shadow-2xs transition hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:border-zinc-600 cursor-pointer"
                >
                  <Hospital className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-1" />
                  <span className="text-[11px] font-bold">Admin</span>
                  <span className="text-[9.5px] text-slate-500 dark:text-zinc-400">Clinic Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleDemoLogin("doctor")}
                  disabled={loading}
                  className="flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-white p-2.5 text-center text-xs font-semibold text-emerald-900 shadow-2xs transition hover:border-emerald-400 hover:bg-emerald-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:border-zinc-600 cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                  <span className="text-[11px] font-bold">Dr. Hana</span>
                  <span className="text-[9.5px] text-slate-500 dark:text-zinc-400">Doctor Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleDemoLogin("patient")}
                  disabled={loading}
                  className="flex flex-col items-center justify-center rounded-xl border border-violet-200 bg-white p-2.5 text-center text-xs font-semibold text-violet-900 shadow-2xs transition hover:border-violet-400 hover:bg-violet-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:border-zinc-600 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-violet-600 dark:text-violet-400 mb-1" />
                  <span className="text-[11px] font-bold">Patient</span>
                  <span className="text-[9.5px] text-slate-500 dark:text-zinc-400">Patient Care</span>
                </button>
              </div>
            </div>
          )}

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-zinc-800" />
            <span className="absolute bg-white px-3 text-[11px] font-medium text-slate-400 dark:bg-[#09090b] dark:text-zinc-500 uppercase tracking-wider">
              {requestedPortal ? "Or sign in with custom password" : "Or sign in with password"}
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
              placeholder="+251 9... or 09..."
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
              className="w-full mt-2"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {requestedPortal ? `Sign In to ${currentConfig?.badge}` : "Sign In"}
            </Button>
          </form>

          {/* Portal Switcher Links */}
          {requestedPortal && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 flex items-center justify-between">
              <span>Switch portal:</span>
              <div className="flex items-center gap-2">
                {requestedPortal !== "admin" && (
                  <button
                    type="button"
                    onClick={() => onNavigate("/login?portal=admin")}
                    className="text-[#1D5BD8] dark:text-[#60A5FA] font-semibold hover:underline cursor-pointer"
                  >
                    Admin
                  </button>
                )}
                {requestedPortal !== "doctor" && (
                  <button
                    type="button"
                    onClick={() => onNavigate("/login?portal=doctor")}
                    className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                  >
                    Doctor
                  </button>
                )}
                {requestedPortal !== "patient" && (
                  <button
                    type="button"
                    onClick={() => onNavigate("/login?portal=patient")}
                    className="text-violet-600 dark:text-violet-400 font-semibold hover:underline cursor-pointer"
                  >
                    Patient
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Footnote */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span>New patient?</span>
              <button
                onClick={() => onNavigate("/register?type=patient")}
                className="text-violet-600 dark:text-violet-400 font-semibold hover:underline cursor-pointer"
              >
                Sign up as Patient
              </button>
              <span>·</span>
              <button
                onClick={() => onNavigate("/register?type=clinic")}
                className="text-[#1D5BD8] dark:text-[#60A5FA] font-semibold hover:underline cursor-pointer"
              >
                Register Clinic
              </button>
            </div>
            <div>
              <button
                onClick={() => onNavigate("/")}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ← Back to public website
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
