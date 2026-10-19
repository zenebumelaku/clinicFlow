import React, { useState, useEffect } from "react";
import {
  Clock,
  Users,
  CalendarCheck,
  CreditCard,
  CheckCircle,
  Building,
  Stethoscope,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Phone,
  Sparkles,
  MapPin,
  Heart,
  CheckCircle2,
  Calendar,
  Activity,
  Check,
  Star,
  Baby,
  UserCheck,
  FlaskConical,
  Microscope,
  Award,
  X,
} from "lucide-react";
import { ScrollReveal } from "../../components/ui/ScrollReveal";
import { AnimatedCounter } from "../../components/ui/AnimatedCounter";
import doctorDawitAvatar from "../../assets/images/doctor_dawit_avatar_1791475828562.jpg";
import doctorHanaAvatar from "../../assets/images/doctor_hana_avatar_1791475818100.jpg";
import doctorRahelAvatar from "../../assets/images/doctor_rahel_avatar_1791477130880.jpg";
import doctorSamuelAvatar from "../../assets/images/doctor_samuel_avatar_1791477120159.jpg";
import heroDoctorPortrait from "../../assets/images/hero_doctor_lead_portrait_1791478205198.jpg";
import procedureCareImage from "../../assets/images/clinic_procedure_care_1791478215526.jpg";
import internalSuiteImage from "../../assets/images/room_internal_suite_1791479207782.jpg";
import pediatricSuiteImage from "../../assets/images/room_pediatric_suite_1791479224760.jpg";
import physiciansTeamImage from "../../assets/images/physicians_team_tablet_1791477807468.jpg";
import womensSuiteImage from "../../assets/images/room_womens_suite_1791479241424.jpg";
import hanaProfileImage from "../../assets/images/z.jpg";
import { authService } from "../../lib/services/authService";

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeDeptTab, setActiveDeptTab] = useState<
    "all" | "internal" | "pediatrics" | "womens" | "procedure"
  >("all");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<
    string | null
  >(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Booking form states
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [selectedDate, setSelectedDate] = useState("2026-10-10");
  const [selectedTime, setSelectedTime] = useState("10:30 AM");
  const [selectedDoctor, setSelectedDoctor] = useState("Dr. Hana Tesfaye");

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const handleOpenBooking = (doctorName?: string) => {
    if (doctorName) {
      setSelectedDoctor(doctorName);
    }
    setIsBookingModalOpen(true);
    setBookingSuccess(false);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;
    setBookingSuccess(true);
    setTimeout(() => {
      // Keep open to show confirmation
    }, 500);
  };

  // Curated list of departments & accredited physicians in Addis Ababa
  const doctorsList = [
    {
      id: "doc-1",
      name: "Dr. Hana Tesfaye, MD",
      specialty: "Internal Medicine & Chronic Care",
      dept: "internal",
      room: "Suite 102 · East Wing",
      experience: "14 Years Exp.",
      rating: "4.95",
      reviews: "340 reviews",
      avatar: doctorHanaAvatar,
      image: internalSuiteImage,
      hours: "Mon - Fri · 08:30 - 17:00 EAT",
      fee: "800 ETB",
      status: "Available Today",
      description:
        "Specializes in adult health evaluations, cardiovascular risk screening, hypertension, and long-term diabetes management.",
    },
    {
      id: "doc-2",
      name: "Dr. Dawit Alemu, MD",
      specialty: "Pediatrics & Adolescent Medicine",
      dept: "pediatrics",
      room: "Suite 104 · North Wing",
      experience: "11 Years Exp.",
      rating: "4.92",
      reviews: "280 reviews",
      avatar: doctorDawitAvatar,
      image: pediatricSuiteImage,
      hours: "Mon - Sat · 09:00 - 17:30 EAT",
      fee: "950 ETB",
      status: "Available Today",
      description:
        "Dedicated to compassionate pediatric care, childhood immunizations, nutritional guidance, and pediatric developmental health.",
    },
    {
      id: "doc-3",
      name: "Dr. Rahel Tadesse, MD",
      specialty: "Obstetrics & Women’s Health",
      dept: "womens",
      room: "Suite 105 · West Wing",
      experience: "12 Years Exp.",
      rating: "4.98",
      reviews: "410 reviews",
      avatar: doctorRahelAvatar,
      image: womensSuiteImage,
      hours: "Mon - Fri · 10:00 - 18:00 EAT",
      fee: "1,100 ETB",
      status: "Available Today",
      description:
        "Comprehensive gynecological exams, prenatal and postpartum checkups, ultrasound scans, and preventive wellness for women.",
    },
    {
      id: "doc-4",
      name: "Dr. Samuel Kebede, MD",
      specialty: "Minor Procedures & Diagnostics",
      dept: "procedure",
      room: "Suite 106 · Central Suite",
      experience: "16 Years Exp.",
      rating: "4.91",
      reviews: "215 reviews",
      avatar: doctorSamuelAvatar,
      image: procedureCareImage,
      hours: "Mon - Fri · 08:00 - 16:30 EAT",
      fee: "1,250 ETB",
      status: "Available Today",
      description:
        "Expert in outpatient surgical dressings, minor dermatologic excisions, wound care, and fast sterile clinic procedures.",
    },
  ];

  const filteredDoctors = doctorsList.filter((d) => {
    if (activeDeptTab === "all") return true;
    return d.dept === activeDeptTab;
  });

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#09090b] min-h-screen text-[#172033] dark:text-zinc-100 font-sans selection:bg-[#EFF4FF] dark:selection:bg-blue-600/30 selection:text-[#1D5BD8] dark:selection:text-[#60A5FA] transition-colors">
      {/* =========================================================================
          SECTION 1: HERO SECTION (HELTRO CLEAN MEDICAL STYLE)
          - Primarily white/light medical palette with full dark mode support
          - Two-column layout: Left = Clear Headline + Paragraph + CTAs
          - Right = Large professional healthcare visual with soft floating badges
         ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#F7FAFC] to-[#FFFFFF] dark:from-[#09090b] dark:via-[#121214] dark:to-[#09090b] pt-12 pb-20 md:pt-16 md:pb-28 border-b border-[#E6EAF0] dark:border-zinc-800">
        {/* Soft background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#EFF4FF]/60 dark:bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Heading, Value Proposition & Actions */}
            <div className="lg:col-span-7 space-y-6">
              {/* Trust Badge */}

              {/* Main Headline */}
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#172033] dark:text-white leading-[1.12]">
                  Find the right care, <br className="hidden sm:inline" />
                  <span className="text-[#1D5BD8] dark:text-[#3B82F6]">
                    when you need it.
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-[#667085] dark:text-zinc-300 leading-relaxed max-w-xl font-normal pt-1">
                  Connect with licensed Ethiopian medical specialists in Bole &
                  Kazanchis. Experience punctual consultations, verified digital
                  appointments, zero waiting room chaos, and seamless Telebirr
                  payments.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate("/register")}
                  className="px-6 sm:px-7 py-3.5 rounded-xl bg-[#1D5BD8] text-white font-semibold text-sm hover:bg-[#1548B0] hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer shadow-sm flex items-center gap-2 group"
                >
                  <span>Create Clinic Account</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => onNavigate("/login?portal=doctor")}
                  className="px-5 sm:px-6 py-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-semibold text-sm border border-emerald-200 dark:border-emerald-800 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer shadow-xs flex items-center gap-2"
                >
                  <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Doctor Portal</span>
                </button>
                <button
                  onClick={() => onNavigate("/login")}
                  className="px-5 py-3.5 rounded-xl bg-white dark:bg-zinc-900 text-[#172033] dark:text-zinc-200 font-semibold text-sm hover:bg-[#F7FAFC] dark:hover:bg-zinc-800 hover:border-[#1D5BD8]/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 border border-[#E6EAF0] dark:border-zinc-700 cursor-pointer shadow-xs flex items-center gap-2"
                >
                  <span>Sign In Options</span>
                </button>

                {/* Portal Sign-In Options Pills */}
                <div className="w-full flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="font-semibold text-slate-500 dark:text-zinc-400">Sign In to Portal:</span>
                  <button
                    type="button"
                    onClick={() => onNavigate("/login?portal=patient")}
                    className="px-2.5 py-1 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-950/40 dark:border-violet-900/60 dark:text-violet-300 font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>Patient Portal</span>
                    <span className="text-[10px] text-violet-500 font-bold">→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate("/login?portal=doctor")}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300 font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>Doctor Workspace</span>
                    <span className="text-[10px] text-emerald-500 font-bold">→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate("/login?portal=admin")}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1D5BD8] border border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300 font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>Clinic Admin</span>
                    <span className="text-[10px] text-blue-500 font-bold">→</span>
                  </button>
                </div>
              </div>

              {/* Social Proof & Patient Stack */}
              <div className="pt-4 flex flex-wrap items-center gap-4 border-t border-[#E6EAF0] dark:border-zinc-800">
                <div className="flex -space-x-2.5">
                  <img
                    src={doctorHanaAvatar}
                    alt="Doctor"
                    className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-800 object-cover shadow-xs"
                  />
                  <img
                    src={doctorSamuelAvatar}
                    alt="Doctor"
                    className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-800 object-cover shadow-xs"
                  />
                  <img
                    src={doctorRahelAvatar}
                    alt="Doctor"
                    className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-800 object-cover shadow-xs"
                  />
                  <img
                    src={doctorDawitAvatar}
                    alt="Doctor"
                    className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-800 object-cover shadow-xs"
                  />
                </div>
                <div className="text-xs">
                  <div className="flex items-center gap-1 text-[#F59E0B]">
                    <Star className="w-3.5 h-3.5 fill-[#F59E0B]" />
                    <Star className="w-3.5 h-3.5 fill-[#F59E0B]" />
                    <Star className="w-3.5 h-3.5 fill-[#F59E0B]" />
                    <Star className="w-3.5 h-3.5 fill-[#F59E0B]" />
                    <Star className="w-3.5 h-3.5 fill-[#F59E0B]" />
                    <span className="font-bold text-[#172033] dark:text-white ml-1">
                      4.9 / 5.0
                    </span>
                  </div>
                  <p className="text-[#667085] dark:text-zinc-400 font-medium mt-0.5">
                    Trusted by 1,400+ patients across Addis Ababa clinics
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual with Elegant Floating Information Cards */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md sm:max-w-lg">
                {/* Image Frame */}
                <div className="relative rounded-3xl overflow-hidden border border-[#E6EAF0] dark:border-zinc-800 shadow-xl bg-slate-50 dark:bg-zinc-900 group">
                  <img
                    src={heroDoctorPortrait}
                    alt="Professional Ethiopian Physician in Consultation"
                    className="w-full h-[520px] object-cover object-center transition-transform duration-700 ease-out group-hover:scale-103"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#172033]/60 via-transparent to-transparent pointer-events-none" />

                  {/* Top Floating Badge: Available Today */}
                  <div className="absolute top-4 left-4 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[#172033] dark:text-white text-xs font-semibold flex items-center gap-2 border border-[#E6EAF0] dark:border-zinc-800 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-[#22A06B] animate-pulse" />
                    <span>500+ Verified Doctors</span>
                  </div>

                  <div className="absolute top-4 right-4 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md px-3 py-1.5 rounded-full text-[#1D5BD8] dark:text-[#60A5FA] text-xs font-bold border border-[#E6EAF0] dark:border-zinc-800 shadow-md">
                    Available Today
                  </div>

                  {/* Bottom Doctor Credential Card */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md rounded-2xl p-4 text-[#172033] dark:text-white shadow-lg border border-[#E6EAF0] dark:border-zinc-800 transition-transform duration-300 group-hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={hanaProfileImage}
                          alt="Dr. Hana Tesfaye"
                          className="w-11 h-11 rounded-xl object-cover border border-[#E6EAF0] dark:border-zinc-700"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-[#172033] dark:text-white">
                            Dr. Hana Tesfaye, MD
                          </h4>
                          <p className="text-xs text-[#1D5BD8] dark:text-[#60A5FA] font-semibold">
                            Internal Medicine Specialist
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#667085] dark:text-zinc-400 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-[#22A06B]" />
                            <span>98% On-Time Consultations</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenBooking("Dr. Hana Tesfaye")}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#1D5BD8] text-white hover:bg-[#1548B0] transition-colors cursor-pointer"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subtle outer decorative card */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: TRUST & QUANTITATIVE STATISTICS
          - Clean metrics strip with AnimatedCounter
         ========================================================================= */}
      <section className="py-16 bg-[#F7FAFC] dark:bg-[#0e0e10] border-b border-[#E6EAF0] dark:border-zinc-800">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <ScrollReveal animation="fade-up" delay={0}>
              <div className="text-center sm:text-left space-y-1">
                <div className="text-3xl sm:text-4xl font-bold text-[#1D5BD8] dark:text-[#60A5FA] tracking-tight">
                  <AnimatedCounter value={25} suffix="+" />
                </div>
                <div className="text-sm font-semibold text-[#172033] dark:text-white">
                  Years Experience
                </div>
                <p className="text-xs text-[#667085] dark:text-zinc-400">
                  Combined medical staff practice in Addis Ababa
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={80}>
              <div className="text-center sm:text-left space-y-1">
                <div className="text-3xl sm:text-4xl font-bold text-[#1D5BD8] dark:text-[#60A5FA] tracking-tight">
                  <AnimatedCounter value={15000} suffix="+" />
                </div>
                <div className="text-sm font-semibold text-[#172033] dark:text-white">
                  Consultations Held
                </div>
                <p className="text-xs text-[#667085] dark:text-zinc-400">
                  Scheduled & attended with digital tracking
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={160}>
              <div className="text-center sm:text-left space-y-1">
                <div className="text-3xl sm:text-4xl font-bold text-[#1D5BD8] dark:text-[#60A5FA] tracking-tight">
                  <AnimatedCounter value={98} suffix="%" />
                </div>
                <div className="text-sm font-semibold text-[#172033] dark:text-white">
                  Patient Satisfaction
                </div>
                <p className="text-xs text-[#667085] dark:text-zinc-400">
                  Verified ratings from clinic visitors
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={240}>
              <div className="text-center sm:text-left space-y-1">
                <div className="text-3xl sm:text-4xl font-bold text-[#1D5BD8] dark:text-[#60A5FA] tracking-tight">
                  <AnimatedCounter value={12} suffix="+" />
                </div>
                <div className="text-sm font-semibold text-[#172033] dark:text-white">
                  Specialties & Suites
                </div>
                <p className="text-xs text-[#667085] dark:text-zinc-400">
                  Accredited outpatient departments
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: MEDICAL SERVICES (HELTRO STYLE CARDS)
          - Clean white cards, generous spacing, hover lift
         ========================================================================= */}
      <section
        id="services"
        className="py-24 bg-[#FFFFFF] dark:bg-[#09090b] border-b border-[#E6EAF0] dark:border-zinc-800"
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up">
            <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF4FF] dark:bg-blue-950/40 text-[#1D5BD8] dark:text-[#93C5FD] text-xs font-semibold">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Our Medical Services</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#172033] dark:text-white tracking-tight">
                Comprehensive care for every stage of life
              </h2>
              <p className="text-sm sm:text-base text-[#667085] dark:text-zinc-400 leading-relaxed">
                From preventive family health to specialized diagnostics,
                discover calm, high-precision clinical services at ClinicFlow.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: "Primary Care & Internal Medicine",
                lead: "Dr. Hana Tesfaye, MD",
                desc: "Comprehensive adult physical exams, cardiovascular health, diabetes management, and chronic illness monitoring.",
                fee: "800 ETB",
                tag: "Routine & Chronic",
                doctorName: "Dr. Hana Tesfaye",
              },
              {
                icon: Baby,
                title: "Pediatrics & Family Care",
                lead: "Dr. Dawit Alemu, MD",
                desc: "Child developmental checks, routine vaccinations, infant nutrition, and seasonal pediatric illness treatment.",
                fee: "950 ETB",
                tag: "Newborn to Teen",
                doctorName: "Dr. Dawit Alemu",
              },
              {
                icon: UserCheck,
                title: "Women’s Health & Obstetrics",
                lead: "Dr. Rahel Tadesse, MD",
                desc: "Dedicated private suites for prenatal care, gynecological consultations, ultrasound imaging, and family planning.",
                fee: "1,100 ETB",
                tag: "Specialized Suite",
                doctorName: "Dr. Rahel Tadesse",
              },
              {
                icon: Activity,
                title: "Minor Outpatient Procedures",
                lead: "Dr. Samuel Kebede, MD",
                desc: "Sterile outpatient treatment including wound care, suture dressings, minor biopsies, and skin lesions.",
                fee: "1,250 ETB",
                tag: "Sterile Suite",
                doctorName: "Dr. Samuel Kebede",
              },
              {
                icon: FlaskConical,
                title: "Diagnostic Laboratory & Testing",
                lead: "Central Pathology Team",
                desc: "Rapid on-site hematology, lipid panels, urine analysis, and rapid diagnostic panels with same-day digital results.",
                fee: "From 350 ETB",
                tag: "Same-Day Results",
                doctorName: "Dr. Hana Tesfaye",
              },
              {
                icon: Stethoscope,
                title: "Preventive Health Checkups",
                lead: "General Outpatient Clinic",
                desc: "Annual executive screenings, blood pressure checks, lifestyle medicine, and doctor-guided health counseling.",
                fee: "600 ETB",
                tag: "Preventive",
                doctorName: "Dr. Dawit Alemu",
              },
            ].map((service, idx) => (
              <ScrollReveal key={idx} animation="fade-up" delay={idx * 60}>
                <div className="bg-white dark:bg-[#121214] rounded-2xl border border-[#E6EAF0] dark:border-zinc-800 p-7 flex flex-col justify-between hover:border-[#1D5BD8]/50 dark:hover:border-blue-500/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group h-full">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-[#EFF4FF] dark:bg-blue-950/40 text-[#1D5BD8] dark:text-[#60A5FA] flex items-center justify-center transition-transform duration-300 group-hover:scale-108">
                        <service.icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                        {service.tag}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-[#172033] dark:text-white group-hover:text-[#1D5BD8] dark:group-hover:text-[#60A5FA] transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-xs font-semibold text-[#1D5BD8] dark:text-[#60A5FA]">
                        {service.lead}
                      </p>
                      <p className="text-xs text-[#667085] dark:text-zinc-400 leading-relaxed pt-1">
                        {service.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-[#667085] dark:text-zinc-400 block">
                        Consultation:
                      </span>
                      <strong className="text-sm font-bold text-[#172033] dark:text-white">
                        {service.fee}
                      </strong>
                    </div>
                    <button
                      onClick={() => handleOpenBooking(service.doctorName)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#EFF4FF] dark:bg-blue-950/40 text-[#1D5BD8] dark:text-[#93C5FD] hover:bg-[#1D5BD8] hover:text-white dark:hover:bg-[#1D5BD8] dark:hover:text-white transition-all duration-200 cursor-pointer flex items-center gap-1 group/btn"
                    >
                      <span>Book Care</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: DOCTORS & SPECIALTY DEPARTMENTS (`#specialties`)
          - Clean tab filter + doctor cards with avatars & schedules
         ========================================================================= */}
      <section
        id="specialties"
        className="py-24 bg-[#F7FAFC] dark:bg-[#0e0e10] border-b border-[#E6EAF0] dark:border-zinc-800"
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF4FF] dark:bg-blue-950/40 text-[#1D5BD8] dark:text-[#93C5FD] text-xs font-semibold">
                  <Award className="w-3.5 h-3.5" />
                  <span>Certified Physicians</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#172033] dark:text-white tracking-tight">
                  Meet our medical team & specialists
                </h2>
                <p className="text-sm text-[#667085] dark:text-zinc-400 leading-relaxed">
                  Dedicated Ethiopian medical professionals with decades of
                  clinical experience in Bole Medhanealem.
                </p>
              </div>

              {/* Department Category Filter */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                {[
                  { label: "All Specialties", val: "all" },
                  { label: "Internal Medicine", val: "internal" },
                  { label: "Pediatrics", val: "pediatrics" },
                  { label: "Women’s Care", val: "womens" },
                  { label: "Procedures", val: "procedure" },
                ].map((tab) => (
                  <button
                    key={tab.val}
                    onClick={() => setActiveDeptTab(tab.val as any)}
                    className={`px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer font-semibold ${
                      activeDeptTab === tab.val
                        ? "bg-[#1D5BD8] text-white shadow-sm"
                        : "bg-white dark:bg-[#18181b] text-[#667085] dark:text-zinc-300 border border-[#E6EAF0] dark:border-zinc-700 hover:text-[#172033] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredDoctors.map((doc, idx) => (
              <ScrollReveal key={doc.id} animation="fade-up" delay={idx * 75}>
                <div className="bg-white dark:bg-[#141416] rounded-2xl border border-[#E6EAF0] dark:border-zinc-800 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group h-full">
                  <div>
                    {/* Image Header */}
                    <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-zinc-800">
                      <img
                        src={doc.image}
                        alt={doc.specialty}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-white/95 dark:bg-[#141416]/95 backdrop-blur-xs text-[#172033] dark:text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-[#E6EAF0] dark:border-zinc-700">
                        {doc.room}
                      </div>
                      <div className="absolute top-2.5 right-2.5 bg-[#22A06B] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        {doc.status}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={doc.avatar}
                          alt={doc.name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-white dark:border-zinc-700 shadow-xs"
                        />
                        <div>
                          <h4 className="font-bold text-[#172033] dark:text-white text-sm leading-tight group-hover:text-[#1D5BD8] dark:group-hover:text-[#60A5FA] transition-colors">
                            {doc.name}
                          </h4>
                          <span className="text-xs font-medium text-[#1D5BD8] dark:text-[#60A5FA] block mt-0.5">
                            {doc.specialty}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#667085] dark:text-zinc-400 leading-relaxed line-clamp-3">
                        {doc.description}
                      </p>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs">
                        <div className="flex items-center justify-between text-[#667085] dark:text-zinc-400">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-[#1D5BD8] dark:text-[#60A5FA]" />
                            <span>Hours:</span>
                          </span>
                          <span className="text-[#172033] dark:text-zinc-200 font-semibold">
                            {doc.hours}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[#667085] dark:text-zinc-400">
                          <span className="font-medium">Consultation Fee:</span>
                          <strong className="text-[#172033] dark:text-white font-bold">
                            {doc.fee}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Action */}
                  <div className="p-5 pt-0">
                    <button
                      onClick={() => handleOpenBooking(doc.name)}
                      className="w-full py-2.5 rounded-xl bg-[#1D5BD8] text-white font-semibold text-xs hover:bg-[#1548B0] hover:shadow-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Book Consultation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: HOW IT WORKS / PATIENT JOURNEY (`#how-it-works`)
          - 4 simple steps showing the effortless patient experience
         ========================================================================= */}
      <section
        id="how-it-works"
        className="py-24 bg-[#FFFFFF] dark:bg-[#09090b] border-b border-[#E6EAF0] dark:border-zinc-800"
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up">
            <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF4FF] dark:bg-blue-950/40 text-[#1D5BD8] dark:text-[#93C5FD] text-xs font-semibold">
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>The Patient Journey</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#172033] dark:text-white tracking-tight">
                How ClinicFlow simplifies your visit
              </h2>
              <p className="text-sm sm:text-base text-[#667085] dark:text-zinc-400 leading-relaxed">
                Enjoy transparent, punctual healthcare without early morning
                lines or lobby confusion.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {[
              {
                step: "01",
                title: "Select Doctor & Specialty",
                desc: "Browse accredited physicians by department, view transparent ETB consultation fees, and read patient feedback.",
              },
              {
                step: "02",
                title: "Instant Confirmation",
                desc: "Pick your preferred date and time slot. Receive an instant digital appointment confirmation and SMS reminder.",
              },
              {
                step: "03",
                title: "Punctual Consultation",
                desc: "Arrive at the clinic suite. Our digital queuing system coordinates doctor rooms to ensure zero hallway delays.",
              },
              {
                step: "04",
                title: "Digital Records & Telebirr",
                desc: "Access doctor notes and prescriptions in your patient portal. Settle fees effortlessly via Telebirr, CBE, or cash.",
              },
            ].map((item, idx) => (
              <ScrollReveal key={idx} animation="fade-up" delay={idx * 80}>
                <div className="bg-[#F7FAFC] dark:bg-[#141416] rounded-2xl border border-[#E6EAF0] dark:border-zinc-800 p-7 h-full flex flex-col justify-between hover:border-[#1D5BD8]/40 dark:hover:border-blue-500/40 transition-colors">
                  <div className="space-y-4">
                    <span className="text-2xl font-bold text-[#1D5BD8] dark:text-[#60A5FA] block font-mono">
                      {item.step}
                    </span>
                    <h3 className="text-base font-bold text-[#172033] dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#667085] dark:text-zinc-400 leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-zinc-800 flex items-center gap-1.5 text-xs text-[#1D5BD8] dark:text-[#60A5FA] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22A06B]" />
                    <span>Verified Patient Standard</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: CLINICAL COMMITMENT / WHY CHOOSE US
         ========================================================================= */}
      <section className="py-24 bg-[#F7FAFC] dark:bg-[#0e0e10] border-b border-[#E6EAF0] dark:border-zinc-800">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Image Collage */}
            <div className="lg:col-span-6">
              <ScrollReveal animation="fade-up">
                <div className="relative rounded-3xl overflow-hidden border border-[#E6EAF0] dark:border-zinc-800 shadow-xl">
                  <img
                    src={physiciansTeamImage}
                    alt="Physician Care Team"
                    className="w-full h-[440px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#172033]/70 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 dark:bg-[#141416]/95 backdrop-blur-md rounded-2xl p-5 border border-[#E6EAF0] dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-[#1D5BD8] dark:text-[#60A5FA]">
                          Bole Medhanealem Center
                        </div>
                        <div className="text-sm font-bold text-[#172033] dark:text-white mt-0.5">
                          Modern Outpatient Consultation Suites
                        </div>
                        <div className="text-xs text-[#667085] dark:text-zinc-400 mt-1 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#1D5BD8] dark:text-[#60A5FA]" />
                          <span>Cameroon St, Addis Ababa, Ethiopia</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#22A06B] bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                          Open Now
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Column: Values & Highlights */}
            <div className="lg:col-span-6 space-y-6">
              <ScrollReveal animation="fade-up" delay={80}>
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF4FF] dark:bg-blue-950/40 text-[#1D5BD8] dark:text-[#93C5FD] text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>The MediFlow Standard</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#172033] dark:text-white tracking-tight">
                    Why patients choose ClinicFlow for private care
                  </h2>
                  <p className="text-sm sm:text-base text-[#667085] dark:text-zinc-400 leading-relaxed">
                    We eliminate the stress of traditional clinic visits by
                    combining compassionate Ethiopian doctors with modern
                    scheduling technology.
                  </p>
                </div>

                <div className="space-y-4 pt-4">
                  {[
                    {
                      title: "Punctual Appointments",
                      desc: "Say goodbye to 3-hour waiting lobby queues. Consultation slots are tracked to start within 15 minutes of scheduled time.",
                    },
                    {
                      title: "Local Telebirr & CBE Birr Payment",
                      desc: "Instant QR code or transaction reference payment in ETB with immediate receipt issuance.",
                    },
                    {
                      title: "Secure Digital Health Records",
                      desc: "Access your consultation notes, lab results, and digital prescriptions anytime through our patient portal.",
                    },
                    {
                      title: "Comfortable Modern Waiting Lounge",
                      desc: "Calm outpatient waiting environments with clear digital displays and acoustic chimes.",
                    },
                  ].map((val, idx) => (
                    <div key={idx} className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-lg bg-[#EFF4FF] dark:bg-blue-950/40 text-[#1D5BD8] dark:text-[#60A5FA] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#172033] dark:text-white">
                          {val.title}
                        </h4>
                        <p className="text-xs text-[#667085] dark:text-zinc-400 mt-0.5 leading-relaxed">
                          {val.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <button
                    onClick={() => handleOpenBooking()}
                    className="px-6 py-3 rounded-xl bg-[#1D5BD8] text-white font-semibold text-xs hover:bg-[#1548B0] transition-all cursor-pointer shadow-xs"
                  >
                    Schedule A Visit
                  </button>
                  <button
                    onClick={() => onNavigate("/about")}
                    className="px-6 py-3 rounded-xl bg-white dark:bg-[#18181b] text-[#172033] dark:text-zinc-200 font-semibold text-xs border border-[#E6EAF0] dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                  >
                    Read About Our Clinic
                  </button>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: PATIENT TESTIMONIALS
         ========================================================================= */}
      <section className="py-24 bg-[#FFFFFF] dark:bg-[#09090b] border-b border-[#E6EAF0] dark:border-zinc-800">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up">
            <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF4FF] dark:bg-blue-950/40 text-[#1D5BD8] dark:text-[#93C5FD] text-xs font-semibold">
                <Star className="w-3.5 h-3.5 fill-[#1D5BD8] dark:fill-[#60A5FA]" />
                <span>Patient Experiences</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#172033] dark:text-white tracking-tight">
                Trusted by families across Addis Ababa
              </h2>
              <p className="text-sm sm:text-base text-[#667085] dark:text-zinc-400 leading-relaxed">
                Read what our patients say about their consultation experience
                and care quality.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Selamawit Bekele",
                location: "Bole, Addis Ababa",
                doctor: "Dr. Hana Tesfaye (Internal Medicine)",
                rating: 5,
                comment:
                  "I booked an appointment for 10:30 AM and was actually in Dr. Hana’s room at 10:35 AM! In other clinics I used to wait for 3 hours. The Telebirr payment took 10 seconds. Outstanding care!",
              },
              {
                name: "Dawit Girma",
                location: "Kazanchis, Addis Ababa",
                doctor: "Dr. Dawit Alemu (Pediatrics)",
                rating: 5,
                comment:
                  "Dr. Dawit took so much time to examine my 2-year-old son and explained the treatment thoroughly. The clinic waiting lounge is clean, peaceful, and child-friendly.",
              },
              {
                name: "Bethlehem Tilahun",
                location: "Old Airport, Addis Ababa",
                doctor: "Dr. Rahel Tadesse (Women’s Health)",
                rating: 5,
                comment:
                  "The privacy and professionalism in Suite 105 was remarkable. Receiving my lab results and digital prescription right on my phone made follow-up effortless.",
              },
            ].map((t, idx) => (
              <ScrollReveal key={idx} animation="fade-up" delay={idx * 80}>
                <div className="bg-[#F7FAFC] dark:bg-[#141416] rounded-2xl border border-[#E6EAF0] dark:border-zinc-800 p-7 flex flex-col justify-between h-full hover:border-[#1D5BD8]/40 dark:hover:border-blue-500/40 transition-colors">
                  <div className="space-y-4">
                    <div className="flex items-center gap-1 text-[#F59E0B]">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#F59E0B]" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-[#172033] dark:text-zinc-200 leading-relaxed italic">
                      "{t.comment}"
                    </p>
                  </div>
                  <div className="pt-5 mt-5 border-t border-slate-200 dark:border-zinc-800">
                    <div className="font-bold text-sm text-[#172033] dark:text-white">
                      {t.name}
                    </div>
                    <div className="text-xs text-[#667085] dark:text-zinc-400">
                      {t.location}
                    </div>
                    <div className="text-[11px] font-semibold text-[#1D5BD8] dark:text-[#60A5FA] mt-0.5">
                      {t.doctor}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: FAQ ACCORDION (`#faq`)
         ========================================================================= */}
      <section
        id="faq"
        className="py-24 bg-[#F7FAFC] dark:bg-[#0e0e10] border-b border-[#E6EAF0] dark:border-zinc-800"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-14 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF4FF] dark:bg-blue-950/40 text-[#1D5BD8] dark:text-[#93C5FD] text-xs font-semibold">
                <span>Frequently Asked Questions</span>
              </div>
              <h2 className="text-3xl font-bold text-[#172033] dark:text-white tracking-tight">
                Got questions? We have answers.
              </h2>
              <p className="text-sm text-[#667085] dark:text-zinc-400">
                Learn how appointments, local payments, and doctor visits work
                at ClinicFlow.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-3.5">
            {[
              {
                q: "How do I book an appointment?",
                a: 'You can click "Book Appointment" anywhere on this page, choose your doctor and specialty, select your date and time slot, and confirm in seconds. You can also visit our reception desk for walk-in scheduling.',
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept Telebirr, CBE Birr, commercial bank mobile transfers, M-Pesa, and cash payments at reception. All fees are transparently shown in Ethiopian Birr (ETB).",
              },
              {
                q: "Can I do a walk-in consultation without an appointment?",
                a: "Yes! Walk-in patients can check in at the reception kiosk or desk upon arrival. You will receive a digital ticket and estimated wait time on our lounge display.",
              },
              {
                q: "Where is ClinicFlow located in Addis Ababa?",
                a: "Our main outpatient medical facility is situated at Cameroon Street, Bole Medhanealem (near Edna Mall & Brass Hospital area), with branch diagnostic suites in Kazanchis.",
              },
              {
                q: "How can doctors and clinics use ClinicFlow?",
                a: 'Clinics and medical staff can click "Launch Clinic App" in the top navigation to access the full operational suite: patient queue management, electronic prescriptions, billing, and scheduling.',
              },
            ].map((faq, idx) => (
              <ScrollReveal key={idx} animation="fade-up" delay={idx * 50}>
                <div className="bg-white dark:bg-[#141416] rounded-xl border border-[#E6EAF0] dark:border-zinc-800 overflow-hidden transition-all duration-200">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left p-5 flex items-center justify-between font-bold text-[#172033] dark:text-white hover:text-[#1D5BD8] dark:hover:text-[#60A5FA] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronRight
                      className={`w-4 h-4 text-[#667085] dark:text-zinc-400 transition-transform duration-200 shrink-0 ${
                        activeFaq === idx
                          ? "rotate-90 text-[#1D5BD8] dark:text-[#60A5FA]"
                          : ""
                      }`}
                    />
                  </button>
                  {activeFaq === idx && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#667085] dark:text-zinc-400 leading-relaxed border-t border-slate-100 dark:border-zinc-800 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 9: FINAL CTA BANNER
          - Deep medical blue `#1D5BD8` to `#1548B0` with clean high-contrast white text
         ========================================================================= */}
      <section className="py-20 bg-gradient-to-r from-[#1D5BD8] to-[#1548B0] dark:from-[#1e3a8a] dark:to-[#172554] text-white">
        <ScrollReveal animation="fade-up">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>Punctual Private Healthcare in Ethiopia</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Ready to experience healthcare you can trust?
            </h2>
            <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto leading-relaxed font-normal">
              Book your consultation today or explore our clinical management
              suite for modern healthcare practices in Addis Ababa.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
              <button
                onClick={() => onNavigate("/register")}
                className="px-7 py-3.5 rounded-xl bg-white text-[#1D5BD8] font-bold text-sm hover:bg-[#EFF4FF] hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                Create Clinic Account
              </button>
              <button
                onClick={() => onNavigate("/login")}
                className="px-7 py-3.5 rounded-xl bg-white/15 text-white font-semibold text-sm hover:bg-white/25 hover:-translate-y-0.5 active:scale-95 transition-all border border-white/30 cursor-pointer backdrop-blur-xs"
              >
                Sign In to Portals
              </button>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* =========================================================================
          APPOINTMENT BOOKING MODAL (INTERACTIVE & POLISHED)
         ========================================================================= */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121214] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E6EAF0] dark:border-zinc-800 relative animate-in zoom-in-95 duration-200 text-[#172033] dark:text-zinc-100">
            {/* Close button */}
            <button
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {!bookingSuccess ? (
              <form onSubmit={handleConfirmBooking} className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D5BD8] dark:text-[#60A5FA] uppercase tracking-wide">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Schedule Appointment</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#172033] dark:text-white mt-1">
                    Book A Consultation
                  </h3>
                  <p className="text-xs text-[#667085] dark:text-zinc-400 mt-1">
                    Select your doctor and preferred time. Confirmation is
                    instant.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Select Doctor */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] dark:text-zinc-200 mb-1">
                      Physician & Specialty
                    </label>
                    <select
                      value={selectedDoctor}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E6EAF0] dark:border-zinc-700 focus:border-[#1D5BD8] focus:ring-2 focus:ring-[#EFF4FF] dark:focus:ring-blue-600/20 outline-none transition-all text-[#172033] dark:text-white bg-white dark:bg-[#18181b] cursor-pointer"
                    >
                      <option value="Dr. Hana Tesfaye">
                        Dr. Hana Tesfaye, MD (Internal Medicine · 800 ETB)
                      </option>
                      <option value="Dr. Dawit Alemu">
                        Dr. Dawit Alemu, MD (Pediatrics · 950 ETB)
                      </option>
                      <option value="Dr. Rahel Tadesse">
                        Dr. Rahel Tadesse, MD (Women’s Health · 1,100 ETB)
                      </option>
                      <option value="Dr. Samuel Kebede">
                        Dr. Samuel Kebede, MD (Minor Procedures · 1,250 ETB)
                      </option>
                    </select>
                  </div>

                  {/* Patient Name */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] dark:text-zinc-200 mb-1">
                      Patient Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Almaz Kebede"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E6EAF0] dark:border-zinc-700 focus:border-[#1D5BD8] focus:ring-2 focus:ring-[#EFF4FF] dark:focus:ring-blue-600/20 outline-none transition-all text-[#172033] dark:text-white bg-white dark:bg-[#18181b] placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] dark:text-zinc-200 mb-1">
                      Phone Number (for SMS & Telebirr)
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0911 234 567"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E6EAF0] dark:border-zinc-700 focus:border-[#1D5BD8] focus:ring-2 focus:ring-[#EFF4FF] dark:focus:ring-blue-600/20 outline-none transition-all text-[#172033] dark:text-white bg-white dark:bg-[#18181b] placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                    />
                  </div>

                  {/* Date & Time Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#172033] dark:text-zinc-200 mb-1">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#E6EAF0] dark:border-zinc-700 focus:border-[#1D5BD8] outline-none text-[#172033] dark:text-white bg-white dark:bg-[#18181b]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#172033] dark:text-zinc-200 mb-1">
                        Time Slot
                      </label>
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#E6EAF0] dark:border-zinc-700 focus:border-[#1D5BD8] outline-none text-[#172033] dark:text-white bg-white dark:bg-[#18181b] cursor-pointer"
                      >
                        <option value="09:00 AM">09:00 AM (Morning)</option>
                        <option value="10:30 AM">10:30 AM (Morning)</option>
                        <option value="11:45 AM">11:45 AM (Morning)</option>
                        <option value="02:30 PM">02:30 PM (Afternoon)</option>
                        <option value="04:00 PM">04:00 PM (Afternoon)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-[#1D5BD8] text-white font-semibold text-sm hover:bg-[#1548B0] active:scale-98 transition-all cursor-pointer shadow-md"
                  >
                    Confirm Consultation Booking
                  </button>
                  <p className="text-[11px] text-[#667085] dark:text-zinc-400 text-center mt-2">
                    Free cancellation up to 2 hours before the slot.
                  </p>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-[#EFF4FF] dark:bg-blue-950/40 text-[#1D5BD8] dark:text-[#60A5FA] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9 text-[#22A06B]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#172033] dark:text-white">
                    Appointment Confirmed!
                  </h3>
                  <p className="text-xs text-[#667085] dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                    We have booked your slot with{" "}
                    <strong>{selectedDoctor}</strong> for{" "}
                    <strong>
                      {selectedDate} at {selectedTime}
                    </strong>
                    .
                  </p>
                </div>

                <div className="bg-[#F7FAFC] dark:bg-[#18181b] rounded-2xl p-4 border border-[#E6EAF0] dark:border-zinc-800 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#667085] dark:text-zinc-400">
                      Patient:
                    </span>
                    <strong className="text-[#172033] dark:text-white">
                      {patientName || "Registered Patient"}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#667085] dark:text-zinc-400">
                      Booking Reference:
                    </span>
                    <strong className="text-[#1D5BD8] dark:text-[#60A5FA] font-mono">
                      MF-ET-{Math.floor(1000 + Math.random() * 9000)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#667085] dark:text-zinc-400">
                      Location:
                    </span>
                    <strong className="text-[#172033] dark:text-white">
                      Bole Medhanealem Clinic
                    </strong>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setIsBookingModalOpen(false);
                      onNavigate("/portals/patient");
                    }}
                    className="flex-1 py-3 rounded-xl bg-[#1D5BD8] text-white text-xs font-semibold hover:bg-[#1548B0] transition-colors cursor-pointer"
                  >
                    View in Patient Portal
                  </button>
                  <button
                    onClick={() => setIsBookingModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
