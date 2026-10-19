import React, { useEffect, useState } from "react";
import {
  Building2,
  Users2,
  Clock,
  Sliders,
  ShieldCheck,
  CreditCard,
  Save,
  CheckCircle2,
  Sun,
  Moon,
  Monitor,
  Palette,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input, Select } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { useClinicData } from "../../lib/hooks/useClinic";
import { useTheme } from "../../lib/theme";

export const SettingsPage: React.FC<{
  onNavigate: (path: string) => void;
}> = () => {
  const { success, error } = useToast();
  const { clinicProfile, updateClinicProfile } = useClinicData();
  const { theme, setTheme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<
    "profile" | "queue" | "payments" | "security" | "appearance"
  >("profile");

  const [profileData, setProfileData] = useState({
    name: "",
    branch: "",
    tin: "",
    license: "",
    phone: "",
    address: "",
    openingHours: "",
  });

  const [queueConfig, setQueueConfig] = useState({
    prefixAdult: "A",
    prefixPediatric: "P",
    defaultConsultMinutes: "20",
    chimeSoundEnabled: true,
    maxWaitingCap: "30",
  });

  useEffect(() => {
    if (!clinicProfile) return;
    setProfileData((current) => ({
      ...current,
      name: clinicProfile.name,
      branch: clinicProfile.city || "",
      license: clinicProfile.licenseNumber || "",
      phone: clinicProfile.phone,
      address: clinicProfile.address || "",
    }));
  }, [clinicProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab !== "profile") {
      error(
        "The backend does not provide save operations for these settings yet.",
      );
      return;
    }
    try {
      await updateClinicProfile({
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
        licenseNumber: profileData.license || undefined,
        city: profileData.branch || undefined,
      });
      success("Clinic profile updated successfully.");
    } catch (saveError) {
      error(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save clinic profile.",
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-white via-white to-blue-50/40 dark:from-[#121214] dark:to-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Clinic Settings & Configuration
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Operational policies, Chapa payment gateway, queue parameters, and
            facility profile
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={handleSave}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save All Changes
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "profile"
              ? "bg-[#1D5BD8] text-white shadow-xs"
              : "text-slate-600 dark:text-zinc-300 hover:bg-[#F8FAFC] dark:hover:bg-zinc-800"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" /> Clinic Profile
        </button>

        <button
          onClick={() => setActiveTab("queue")}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "queue"
              ? "bg-[#1D5BD8] text-white shadow-xs"
              : "text-slate-600 dark:text-zinc-300 hover:bg-[#F8FAFC] dark:hover:bg-zinc-800"
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Queue & Scheduling
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "payments"
              ? "bg-[#1D5BD8] text-white shadow-xs"
              : "text-slate-600 dark:text-zinc-300 hover:bg-[#F8FAFC] dark:hover:bg-zinc-800"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" /> Chapa & Billing
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "security"
              ? "bg-[#1D5BD8] text-white shadow-xs"
              : "text-slate-600 dark:text-zinc-300 hover:bg-[#F8FAFC] dark:hover:bg-zinc-800"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Security & Access
        </button>

        <button
          onClick={() => setActiveTab("appearance")}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "appearance"
              ? "bg-[#1D5BD8] text-white shadow-xs"
              : "text-slate-600 dark:text-zinc-300 hover:bg-[#F8FAFC] dark:hover:bg-zinc-800"
          }`}
        >
          <Palette className="w-3.5 h-3.5" /> Appearance & Theme
        </button>
      </div>

      {/* Content Form */}
      {activeTab !== "profile" && activeTab !== "appearance" && (
        <p className="text-xs text-amber-700 dark:text-amber-300" role="status">
          These operational settings are not currently backed by the clinic API.
          Changes will not be saved.
        </p>
      )}
      <Card>
        {activeTab === "profile" && (
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Facility Information
            </h3>
            {!clinicProfile && (
              <p className="text-xs text-slate-500" role="status">
                Loading clinic profile…
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Clinic Legal Name"
                value={profileData.name}
                onChange={(e) =>
                  setProfileData({ ...profileData, name: e.target.value })
                }
              />
              <Input
                label="Branch / Facility Code"
                value={profileData.branch}
                onChange={(e) =>
                  setProfileData({ ...profileData, branch: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Tax Identification Number (TIN)"
                value={profileData.tin}
                onChange={(e) =>
                  setProfileData({ ...profileData, tin: e.target.value })
                }
                disabled
                helperText="Not provided by the clinic profile API"
              />
              <Input
                label="Ministry of Health License"
                value={profileData.license}
                onChange={(e) =>
                  setProfileData({ ...profileData, license: e.target.value })
                }
              />
            </div>

            <Input
              label="Physical Address & Sub-City"
              value={profileData.address}
              onChange={(e) =>
                setProfileData({ ...profileData, address: e.target.value })
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Official Contact Phone"
                value={profileData.phone}
                onChange={(e) =>
                  setProfileData({ ...profileData, phone: e.target.value })
                }
              />
              <Input
                label="Standard Operating Hours"
                value={profileData.openingHours}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    openingHours: e.target.value,
                  })
                }
                disabled
                helperText="Not provided by the clinic profile API"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit">Update Clinic Profile</Button>
            </div>
          </form>
        )}

        {activeTab === "queue" && (
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Queue Logic & Ticket Numbering
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Adult Care Ticket Prefix"
                value={queueConfig.prefixAdult}
                onChange={(e) =>
                  setQueueConfig({
                    ...queueConfig,
                    prefixAdult: e.target.value,
                  })
                }
                helperText="e.g. 'A' yields #A101"
              />
              <Input
                label="Pediatrics Ticket Prefix"
                value={queueConfig.prefixPediatric}
                onChange={(e) =>
                  setQueueConfig({
                    ...queueConfig,
                    prefixPediatric: e.target.value,
                  })
                }
                helperText="e.g. 'P' yields #P201"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Default Consultation Slot (Minutes)"
                type="number"
                value={queueConfig.defaultConsultMinutes}
                onChange={(e) =>
                  setQueueConfig({
                    ...queueConfig,
                    defaultConsultMinutes: e.target.value,
                  })
                }
              />
              <Input
                label="Maximum Waiting Lobby Cap"
                type="number"
                value={queueConfig.maxWaitingCap}
                onChange={(e) =>
                  setQueueConfig({
                    ...queueConfig,
                    maxWaitingCap: e.target.value,
                  })
                }
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs flex items-center justify-between">
              <div>
                <strong className="text-slate-900 dark:text-white">
                  Audible Room Calling Chime
                </strong>
                <p className="text-slate-500 dark:text-zinc-400">
                  Play two-tone synthesizer chime when patient is called.
                </p>
              </div>
              <input
                type="checkbox"
                checked={queueConfig.chimeSoundEnabled}
                onChange={(e) =>
                  setQueueConfig({
                    ...queueConfig,
                    chimeSoundEnabled: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit">Save Queue Rules</Button>
            </div>
          </form>
        )}

        {activeTab === "payments" && (
          <div className="space-y-4 text-xs">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                Chapa Payment Gateway & Currency (ETB)
              </h3>
              <p className="mt-1 text-slate-500 dark:text-zinc-400">
                Chapa checkout is configured by the system operator on the backend. Payment
                credentials are never stored in clinic settings or exposed to the browser.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
              <strong className="text-slate-900 dark:text-white">Backend configuration</strong>
              <p className="mt-1 text-slate-500 dark:text-zinc-400">
                Set <code>CHAPA_SECRET_KEY</code> and, if provided by Chapa,{' '}
                <code>CHAPA_WEBHOOK_SECRET</code> in the backend environment. Checkout stays
                unavailable until a valid key is configured. For testing, use a Chapa test secret
                key beginning with <code>CHASECK_TEST-</code>; only use a live key when ready to
                accept real charges.
              </p>
            </div>

            <p className="text-slate-500 dark:text-zinc-400">
              Staff can record cash and bank-transfer payments from the Payments page. Chapa
              payments must use hosted checkout and server verification.
            </p>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-4 text-xs">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Security & Role Access Policy
            </h3>
            <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
              ClinicFlow enforces strict role-based access control (RBAC). Front
              desk receptionists can check in patients and collect payments but
              cannot edit financial logs. Consulting physicians only access
              their room queues.
            </p>

            <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 dark:text-white">
                    Admin PIN / Password
                  </strong>
                  <p className="text-slate-500 dark:text-zinc-400">
                    6-digit PIN for Clinic Owner operations
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Update PIN
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "appearance" && (
          <div className="space-y-6 text-xs">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                Interface Appearance & Theme
              </h3>
              <p className="text-slate-500 dark:text-zinc-400 mt-0.5">
                Customize your display mode for clinical workstations, day
                consultations, or night shifts.
              </p>
            </div>

            {/* Theme Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Light Mode */}
              <div
                onClick={() => setTheme("light")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  theme === "light"
                    ? "border-[#1D5BD8] bg-[#EFF4FF]/50 dark:bg-[#1D5BD8]/10 shadow-xs"
                    : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/50"
                }`}
              >
                <div className="w-full h-24 rounded-lg bg-slate-100 border border-slate-200 p-2 flex flex-col justify-between mb-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-2.5 rounded bg-slate-300" />
                    <div className="w-3 h-3 rounded-full bg-[#1D5BD8]" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-3/4 h-2 rounded bg-slate-300" />
                    <div className="w-1/2 h-2 rounded bg-slate-200" />
                  </div>
                  <div className="w-16 h-4 rounded bg-[#1D5BD8] text-[8px] text-white flex items-center justify-center font-bold">
                    Primary
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      Light Mode
                    </span>
                  </div>
                  {theme === "light" && (
                    <CheckCircle2 className="w-4 h-4 text-[#1D5BD8]" />
                  )}
                </div>
                <p className="text-slate-500 dark:text-zinc-400 text-[11px] mt-1 leading-snug">
                  High-clarity daylight palette for daytime reception and
                  clinical consultations.
                </p>
              </div>

              {/* Dark Mode */}
              <div
                onClick={() => setTheme("dark")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  theme === "dark"
                    ? "border-[#1D5BD8] bg-[#EFF4FF]/50 dark:bg-[#1D5BD8]/10 shadow-xs"
                    : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/50"
                }`}
              >
                <div className="w-full h-24 rounded-lg bg-[#09090b] border border-zinc-800 p-2 flex flex-col justify-between mb-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-2.5 rounded bg-zinc-700" />
                    <div className="w-3 h-3 rounded-full bg-[#1D5BD8]" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-3/4 h-2 rounded bg-zinc-700" />
                    <div className="w-1/2 h-2 rounded bg-zinc-800" />
                  </div>
                  <div className="w-16 h-4 rounded bg-[#1D5BD8] text-[8px] text-white flex items-center justify-center font-bold">
                    Primary
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      Dark Mode
                    </span>
                  </div>
                  {theme === "dark" && (
                    <CheckCircle2 className="w-4 h-4 text-[#1D5BD8]" />
                  )}
                </div>
                <p className="text-slate-500 dark:text-zinc-400 text-[11px] mt-1 leading-snug">
                  High-contrast true dark layout ideal for long computer shifts
                  and emergency triage rooms.
                </p>
              </div>

              {/* System Mode */}
              <div
                onClick={() => setTheme("system")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  theme === "system"
                    ? "border-[#1D5BD8] bg-[#EFF4FF]/50 dark:bg-[#1D5BD8]/10 shadow-xs"
                    : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/50"
                }`}
              >
                <div className="w-full h-24 rounded-lg bg-gradient-to-r from-slate-100 to-[#09090b] border border-slate-300 dark:border-zinc-700 p-2 flex flex-col justify-between mb-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-2.5 rounded bg-slate-400" />
                    <div className="w-3 h-3 rounded-full bg-[#1D5BD8]" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-3/4 h-2 rounded bg-slate-400" />
                    <div className="w-1/2 h-2 rounded bg-zinc-800" />
                  </div>
                  <div className="w-16 h-4 rounded bg-[#1D5BD8] text-[8px] text-white flex items-center justify-center font-bold">
                    System
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-slate-500" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      System Default
                    </span>
                  </div>
                  {theme === "system" && (
                    <CheckCircle2 className="w-4 h-4 text-[#1D5BD8]" />
                  )}
                </div>
                <p className="text-slate-500 dark:text-zinc-400 text-[11px] mt-1 leading-snug">
                  Automatically mirrors your device OS theme preferences and
                  transitions at sunset.
                </p>
              </div>
            </div>

            {/* Brand Accent Color Showcase */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1D5BD8] flex items-center justify-center text-white font-bold shadow-xs">
                  #1D
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-xs">
                    Primary Brand Blue: Royal Healthcare Blue (
                    <code className="font-mono text-[#1D5BD8] font-bold">
                      #1D5BD8
                    </code>
                    )
                  </h4>
                  <p className="text-slate-500 dark:text-zinc-400 text-[11px]">
                    Deep, dignified, visually sharp, and high contrast for
                    verified medical compliance.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center">
                  <div className="w-full h-4 rounded bg-[#1D5BD8] mb-1" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">
                    #1D5BD8 Primary
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center">
                  <div className="w-full h-4 rounded bg-[#1548B0] mb-1" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">
                    #1548B0 Hover
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center">
                  <div className="w-full h-4 rounded bg-[#EFF4FF] border border-[#BFDBFE] mb-1" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">
                    #EFF4FF Tint
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center">
                  <div className="w-full h-4 rounded bg-[#BFDBFE] mb-1" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">
                    #BFDBFE Border
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
