import React from "react";
import {
  Hospital,
  ShieldCheck,
  HeartHandshake,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ScrollReveal } from "../../components/ui/ScrollReveal";

export const AboutPage: React.FC<{ onNavigate: (path: string) => void }> = ({
  onNavigate,
}) => {
  return (
    <div className="bg-[#f8fafc] dark:bg-[#09090b] min-h-screen py-16 text-[#172033] dark:text-zinc-100 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <ScrollReveal animation="fade-up">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF4FF] dark:bg-blue-950/40 border border-[#BFDBFE] dark:border-blue-800/40 text-[#1D5BD8] dark:text-[#93C5FD] text-xs font-semibold">
              About ClinicFlow
            </div>
            <h1 className="text-3xl font-extrabold text-[#172033] dark:text-white tracking-tight">
              Smarter clinic operations. Better patient experiences.
            </h1>
            <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              ClinicFlow is an operations platform purposefully built for
              private clinics, outpatient centers, and specialty healthcare
              practices in Ethiopia.
            </p>
          </div>
        </ScrollReveal>

        {/* Mission Card */}
        <ScrollReveal animation="fade-up" delay={80}>
          <div className="bg-white dark:bg-[#121214] p-8 rounded-2xl border border-[#E6EAF0] dark:border-zinc-800 shadow-xs hover:shadow-md transition-all duration-300 space-y-4">
            <h2 className="text-lg font-bold text-[#172033] dark:text-white">
              Our Mission
            </h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              In many Ethiopian private clinics, patients experience hours of
              chaotic waiting, uncertain consultation queues, and manual paper
              registries. Reception staff face stressful bottlenecks, while
              doctors struggle with unexpected walk-ins and scheduling overlaps.
            </p>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              ClinicFlow replaces that friction with digital queue numbers,
              transparent wait estimations, real-time doctor availability
              indicators, and streamlined local payment tracking via Telebirr,
              CBE Birr, and cash.
            </p>
          </div>
        </ScrollReveal>

        {/* Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScrollReveal animation="fade-up" delay={120}>
            <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-[#E6EAF0] dark:border-zinc-800 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group h-full">
              <ShieldCheck className="w-6 h-6 text-[#1D5BD8] dark:text-[#60A5FA] mb-3 transition-transform duration-300 group-hover:scale-110" />
              <h3 className="font-bold text-[#172033] dark:text-white text-sm mb-1">
                Operational Focus
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                We do not replace clinical judgment or medical ERPs. We solve
                the everyday front desk and queue challenges clinics face daily.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={180}>
            <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-[#E6EAF0] dark:border-zinc-800 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group h-full">
              <HeartHandshake className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-3 transition-transform duration-300 group-hover:scale-110" />
              <h3 className="font-bold text-[#172033] dark:text-white text-sm mb-1">
                Dignified Waiting
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Patients deserve to know their position in line and estimated
                wait times, reducing lobby overcrowding and patient stress.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={240}>
            <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-[#E6EAF0] dark:border-zinc-800 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group h-full">
              <MapPin className="w-6 h-6 text-[#1D5BD8] dark:text-[#60A5FA] mb-3 transition-transform duration-300 group-hover:scale-110" />
              <h3 className="font-bold text-[#172033] dark:text-white text-sm mb-1">
                Local Ethiopian Design
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Designed around local payment behaviors (Telebirr & cash),
                Ethiopian phone standards, and fast front desk check-in habits.
              </p>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal animation="scale-up" delay={300}>
          <div className="text-center pt-6">
            <Button
              size="lg"
              onClick={() => onNavigate("/dashboard/overview")}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Explore Clinic Management Demo
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};
