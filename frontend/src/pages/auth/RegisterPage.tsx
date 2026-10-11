import React, { useState } from "react";
import {
  Hospital,
  Phone,
  User,
  Building,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";

interface RegisterPageProps {
  onNavigate: (path: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { success } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    phone: "",
    otp: "",
    fullName: "",
    clinicName: "",
    clinicType: "outpatient_specialty",
    role: "admin",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
      success(
        "OTP code sent to " + formData.phone + " (use test code: 123456)",
      );
      setFormData((prev) => ({ ...prev, otp: "123456" }));
    }, 500);
  };

  const handleCompleteRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      success("Clinic account registered successfully!");
      onNavigate("/dashboard/overview");
    }, 600);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 transition-colors">
      {/* Left visual side */}
      <div className="hidden lg:block lg:col-span-5 relative bg-zinc-950 overflow-hidden">
        <img
          src="/src/assets/images/auth_medical_visual_1791475805267.jpg"
          alt="ClinicFlow registration"
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
              Onboard your clinic in under two minutes.
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Empower your receptionists and physicians with structured patient
              queues, local billing records, and automated scheduling.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Compliant with Ethiopian Outpatient Standards</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form side */}
      <div className="lg:col-span-7 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Register New Practice
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Step {step} of 2:{" "}
              {step === 1 ? "Mobile Verification" : "Practice & Admin Details"}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input
                label="Clinic Mobile Number"
                required
                placeholder="+251 911 234567 or 0911..."
                leftIcon={<Phone className="w-4 h-4" />}
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                helperText="We'll send a 6-digit verification code to confirm your clinic contact."
              />

              <Button
                type="submit"
                size="lg"
                className="w-full mt-4"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send Verification Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCompleteRegister} className="space-y-4">
              <Input
                label="Verification Code (OTP)"
                required
                placeholder="6-digit code"
                value={formData.otp}
                onChange={(e) =>
                  setFormData({ ...formData, otp: e.target.value })
                }
                helperText="Default demo code: 123456"
              />

              <Input
                label="Administrator / Owner Name"
                required
                placeholder="Dr. / Ato / W/ro Full Name"
                leftIcon={<User className="w-4 h-4" />}
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
              />

              <Input
                label="Clinic / Practice Name"
                required
                placeholder="e.g. Bole Specialty Outpatient Clinic"
                leftIcon={<Building className="w-4 h-4" />}
                value={formData.clinicName}
                onChange={(e) =>
                  setFormData({ ...formData, clinicName: e.target.value })
                }
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Clinic Category"
                  value={formData.clinicType}
                  onChange={(e) =>
                    setFormData({ ...formData, clinicType: e.target.value })
                  }
                >
                  <option value="outpatient_specialty">
                    Specialty Outpatient
                  </option>
                  <option value="general_practice">
                    General Practice Clinic
                  </option>
                  <option value="pediatric_care">Pediatric Center</option>
                  <option value="dental_eye">Dental & Eye Practice</option>
                </Select>

                <Select
                  label="Initial Role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="admin">Clinic Owner / Admin</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="doctor">Consulting Doctor</option>
                </Select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-1/3"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  size="md"
                  className="w-2/3"
                  isLoading={isLoading}
                >
                  Launch Clinic
                </Button>
              </div>
            </form>
          )}

          <div className="text-center text-xs text-slate-500 dark:text-zinc-400 pt-4 border-t border-slate-100 dark:border-zinc-800">
            Already registered?{" "}
            <button
              onClick={() => onNavigate("/login")}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
