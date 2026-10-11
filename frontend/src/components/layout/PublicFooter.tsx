import React from 'react';
import { Hospital, MapPin, Phone, Mail, ArrowUpRight, ShieldCheck } from 'lucide-react';

interface PublicFooterProps {
  onNavigate: (path: string) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ onNavigate }) => {
  const scrollToSection = (id: string) => {
    onNavigate(`/#${id}`);
  };

  return (
    <footer className="bg-[#121214] dark:bg-[#070709] text-zinc-400 pt-16 pb-12 border-t border-zinc-800">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-zinc-800">
          {/* Column 1: Brand & Ethiopian context (spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1D5BD8] flex items-center justify-center text-white shadow-md">
                <Hospital className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                MediFlow<span className="text-[#3B82F6]">.ET</span>
              </span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
              Modern private healthcare platform connecting patients with trusted doctors, real-time consultation queuing, and verified appointments across Addis Ababa.
            </p>
            <div className="space-y-2 text-xs text-zinc-400 pt-2">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#3B82F6] shrink-0" />
                <span>Bole Medhanealem & Kazanchis, Addis Ababa, Ethiopia</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#3B82F6] shrink-0" />
                <span>+251 11 662 4890 · +251 911 200 300</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#3B82F6] shrink-0" />
                <span>support@mediflowet.com</span>
              </div>
            </div>
          </div>

          {/* Column 2: Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => scrollToSection('services')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Medical Services
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('specialties')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Specialties & Doctors
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('faq')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/patient')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Patient Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('/about')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  About MediFlow
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/contact')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Contact & Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/dashboard/overview')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Clinic Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/doctor/overview')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Physician Portal
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/patient/dashboard')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Patient Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Support & Standards */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Help Center & FAQ</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
              </li>
              <li>
                <div className="pt-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-xs text-white border border-zinc-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#22A06B]" />
                    <span>Verified MOH Practice</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            © 2026 MediFlow ET. All rights reserved. Addis Ababa, Ethiopia.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-zinc-300 transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-zinc-300 transition-colors cursor-pointer">Terms</span>
            <span className="hover:text-zinc-300 transition-colors cursor-pointer">Patient Rights</span>
            <span className="hover:text-zinc-300 transition-colors cursor-pointer">Telebirr Integration</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
