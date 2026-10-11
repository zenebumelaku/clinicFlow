import React, { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Hospital,
  Clock,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";

export const ContactPage: React.FC<{
  onNavigate: (path: string) => void;
}> = () => {
  const { success } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    clinicName: "",
    contactPerson: "",
    phone: "",
    email: "",
    city: "Addis Ababa",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    success(
      "Inquiry received! A MediFlow ET clinic onboarding specialist will contact you.",
    );
  };

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#09090b] min-h-screen py-16 md:py-24 text-[#172033] dark:text-zinc-100 transition-colors">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EFF4FF] dark:bg-blue-950/40 border border-[#BFDBFE] dark:border-blue-800/40 text-[#1D5BD8] dark:text-[#93C5FD] text-xs font-semibold">
            Get in Touch
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#172033] dark:text-white tracking-tight">
            Contact MediFlow ET
          </h1>
          <p className="text-base text-[#667085] dark:text-zinc-400">
            Have questions or want to deploy MediFlow ET in your private
            practice or hospital? Our Addis Ababa team is ready to assist.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Info Side */}
          <div className="lg:col-span-5 bg-[#F7FAFC] dark:bg-[#121214] rounded-3xl p-8 border border-[#E6EAF0] dark:border-zinc-800 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-[#172033] dark:text-white">
                Clinic Onboarding Office
              </h2>
              <p className="text-sm text-[#667085] dark:text-zinc-400 mt-1 leading-relaxed">
                We work directly with medical directors and clinic
                administrators across Ethiopia to set up consultation rooms,
                queue screens, and front desk tablets.
              </p>
            </div>

            <div className="space-y-5 text-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#EFF4FF] dark:bg-blue-950/40 flex items-center justify-center text-[#1D5BD8] dark:text-[#60A5FA] shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[#172033] dark:text-white">
                    Physical Address
                  </div>
                  <div className="text-xs text-[#667085] dark:text-zinc-400 mt-0.5">
                    Cameroon St., Bole Sub-City, Addis Ababa, Ethiopia
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#EFF4FF] dark:bg-blue-950/40 flex items-center justify-center text-[#1D5BD8] dark:text-[#60A5FA] shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[#172033] dark:text-white">
                    Direct Lines
                  </div>
                  <div className="text-xs text-[#667085] dark:text-zinc-400 mt-0.5">
                    +251 11 662 4890 · +251 911 200 300
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#EFF4FF] dark:bg-blue-950/40 flex items-center justify-center text-[#1D5BD8] dark:text-[#60A5FA] shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[#172033] dark:text-white">
                    Electronic Mail
                  </div>
                  <div className="text-xs text-[#667085] dark:text-zinc-400 mt-0.5">
                    clinics@ClinicFlow.com · support@ClinicFlow.com
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#EFF4FF] dark:bg-blue-950/40 flex items-center justify-center text-[#1D5BD8] dark:text-[#60A5FA] shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[#172033] dark:text-white">
                    Operating Hours
                  </div>
                  <div className="text-xs text-[#667085] dark:text-zinc-400 mt-0.5">
                    Monday – Saturday: 8:00 AM – 7:30 PM EAT
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#18181b] border border-[#E6EAF0] dark:border-zinc-800 text-xs text-[#667085] dark:text-zinc-400 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#22A06B] shrink-0" />
              <span>
                Certified under Ethiopian Ministry of Health clinical IT
                standards.
              </span>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-7 bg-white dark:bg-[#121214] rounded-3xl p-8 sm:p-10 border border-[#E6EAF0] dark:border-zinc-800 shadow-sm">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#22A06B] flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-[#172033] dark:text-white">
                  Thank you for reaching out
                </h3>
                <p className="text-sm text-[#667085] dark:text-zinc-400 max-w-md mx-auto">
                  Our clinic onboarding specialist will contact{" "}
                  {formData.contactPerson || "you"} within one business day.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-[#1D5BD8] text-white text-xs font-semibold hover:bg-[#1548B0] cursor-pointer"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-xl font-bold text-[#172033] dark:text-white">
                  Request Clinic Onboarding or Demo
                </h2>
                <p className="text-xs text-[#667085] dark:text-zinc-400">
                  Fill out the details below and we will prepare a custom
                  overview.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] dark:text-zinc-200 mb-1.5">
                      Practice or Hospital Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.clinicName}
                      onChange={(e) =>
                        setFormData({ ...formData, clinicName: e.target.value })
                      }
                      placeholder="e.g. Bole Specialty Clinic"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#E6EAF0] dark:border-zinc-700 bg-white dark:bg-[#18181b] text-xs text-[#172033] dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#1D5BD8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] dark:text-zinc-200 mb-1.5">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contactPerson}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPerson: e.target.value,
                        })
                      }
                      placeholder="e.g. Dr. Yohannes T."
                      className="w-full h-11 px-3.5 rounded-xl border border-[#E6EAF0] dark:border-zinc-700 bg-white dark:bg-[#18181b] text-xs text-[#172033] dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#1D5BD8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] dark:text-zinc-200 mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+251 911 000 000"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#E6EAF0] dark:border-zinc-700 bg-white dark:bg-[#18181b] text-xs text-[#172033] dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#1D5BD8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] dark:text-zinc-200 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="admin@clinic.com"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#E6EAF0] dark:border-zinc-700 bg-white dark:bg-[#18181b] text-xs text-[#172033] dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#1D5BD8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] dark:text-zinc-200 mb-1.5">
                    Sub-City or Location in Ethiopia
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full h-11 px-3.5 rounded-xl border border-[#E6EAF0] dark:border-zinc-700 bg-white dark:bg-[#18181b] text-xs text-[#172033] dark:text-white focus:outline-none focus:border-[#1D5BD8] cursor-pointer [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-[#18181b] dark:[&>option]:text-zinc-100"
                  >
                    <option value="Addis Ababa - Bole">
                      Addis Ababa - Bole
                    </option>
                    <option value="Addis Ababa - Kazanchis">
                      Addis Ababa - Kazanchis
                    </option>
                    <option value="Addis Ababa - CMC">Addis Ababa - CMC</option>
                    <option value="Addis Ababa - Piassa">
                      Addis Ababa - Piassa
                    </option>
                    <option value="Addis Ababa - Kirkos">
                      Addis Ababa - Kirkos
                    </option>
                    <option value="Hawassa">Hawassa</option>
                    <option value="Adama">Adama</option>
                    <option value="Bahir Dar">Bahir Dar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] dark:text-zinc-200 mb-1.5">
                    How many active consultation rooms do you operate?
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="e.g. 4 consultation rooms, 1 laboratory, expecting 40 patients daily."
                    className="w-full p-3.5 rounded-xl border border-[#E6EAF0] dark:border-zinc-700 bg-white dark:bg-[#18181b] text-xs text-[#172033] dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#1D5BD8]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#1D5BD8] text-white text-sm font-semibold hover:bg-[#1548B0] active:bg-[#1258be] transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Submit Clinic Inquiry</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
