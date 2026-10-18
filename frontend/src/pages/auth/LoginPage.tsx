import React, { useState } from "react";
import { Hospital, Lock, Phone, ArrowRight } from "lucide-react";
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
  const requestedPortal = new URLSearchParams(window.location.search).get("portal");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const user = await authService.login(identifier, password);
      const role = user.role.toLowerCase();
      const requestedRole = requestedPortal === "admin"
        ? ["admin", "receptionist"].includes(role)
        : requestedPortal === "patient" || requestedPortal === "doctor"
          ? role === requestedPortal
          : true;
      if (!requestedRole) {
        authService.clearSession();
        error(`This account is assigned to the ${role} portal, not the ${requestedPortal} portal. Sign in with a ${requestedPortal} account.`);
        return;
      }
      success(`Signed in to the ${requestedPortal || role} portal`);
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
        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 lg:hidden mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#1D5BD8] flex items-center justify-center text-white">
                <Hospital className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                ClinicFlow
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {requestedPortal
                ? `Sign in to the ${requestedPortal} portal`
                : "Sign in to ClinicFlow"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {requestedPortal
                ? `Use the account provided for the ${requestedPortal} portal.`
                : "Sign in with your registered email or phone number and password"}
            </p>
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
              required
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
                required
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Footnote */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <div>
              Want to register a new clinic?{" "}
              <button
                onClick={() => onNavigate("/register")}
                className="text-[#1D5BD8] dark:text-[#60A5FA] font-semibold hover:underline cursor-pointer"
              >
                Register Practice
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
