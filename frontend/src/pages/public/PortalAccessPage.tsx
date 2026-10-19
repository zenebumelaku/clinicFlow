import React from 'react';
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  Hospital,
  LockKeyhole,
  Stethoscope,
  Users,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { authService } from '../../lib/services/authService';

export type PortalKind = 'patient' | 'doctor' | 'admin';

interface PortalAccessPageProps {
  portal: PortalKind;
  onNavigate: (path: string) => void;
}

const portalContent = {
  patient: {
    title: 'Your care, made easier.',
    description: 'Keep your appointments and live queue status together in one private patient space.',
    features: [
      { icon: CalendarDays, label: 'Review appointments and visit details' },
      { icon: HeartPulse, label: 'Follow your live clinic queue ticket' },
      { icon: ClipboardList, label: 'See care updates linked to your account' },
    ],
    signInLabel: 'Sign in to Patient Portal',
  },
  doctor: {
    title: 'Your clinical day, in focus.',
    description: 'A dedicated workspace for your assigned patient queue, consultation schedule, and visit flow.',
    features: [
      { icon: Users, label: 'Review patients assigned to your care' },
      { icon: CalendarDays, label: 'See your consultation schedule' },
      { icon: ClipboardList, label: 'Start and complete consultations' },
    ],
    signInLabel: 'Sign in to Doctor Portal',
  },
  admin: {
    title: 'Run your clinic with clarity.',
    description: 'Manage the front desk and clinic operations from a role-secured administrative workspace.',
    features: [
      { icon: CalendarDays, label: 'Coordinate appointments and check-ins' },
      { icon: Users, label: 'Manage patients, doctors, and clinic staff' },
      { icon: ClipboardList, label: 'Monitor queue, payments, and reports' },
    ],
    signInLabel: 'Sign in to Admin Portal',
  },
} as const;

const homeForPortal: Record<PortalKind, string> = {
  patient: '/patient/dashboard',
  doctor: '/doctor/overview',
  admin: '/dashboard/overview',
};

const roleMatchesPortal = (role: string, portal: PortalKind) => {
  const normalizedRole = role.toLowerCase();
  if (portal === 'admin') return normalizedRole === 'admin' || normalizedRole === 'receptionist';
  return normalizedRole === portal;
};

export const PortalAccessPage: React.FC<PortalAccessPageProps> = ({ portal, onNavigate }) => {
  const { success, error } = useToast();
  const content = portalContent[portal];
  const user = authService.getUser();
  const hasMatchingAccount = Boolean(user && roleMatchesPortal(user.role, portal));

  const colorClasses = {
    patient: {
      badge: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200',
      button: 'bg-violet-700 hover:bg-violet-800 text-white',
      check: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
    },
    doctor: {
      badge: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
      button: 'bg-emerald-700 hover:bg-emerald-800 text-white',
      check: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    },
    admin: {
      badge: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200',
      button: 'bg-blue-700 hover:bg-blue-800 text-white',
      check: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    },
  }[portal];

  const handleLaunch = async () => {
    try {
      if (!hasMatchingAccount) {
        await authService.demoLogin(portal);
      }
      success(`Entering ${portal} workspace`);
      onNavigate(homeForPortal[portal]);
    } catch (e) {
      error(e instanceof Error ? e.message : 'Could not launch portal.');
      onNavigate(`/login?portal=${portal}`);
    }
  };

  const primaryLabel = portal === 'doctor'
    ? 'Launch Doctor Workspace (Dr. Hana)'
    : portal === 'patient'
      ? 'Launch Patient Portal (Abebe Kebede)'
      : 'Launch Clinic Admin Portal';

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12 sm:px-6">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-zinc-800 dark:bg-[#121214] lg:grid-cols-[1fr_0.9fr]">
        <div className="p-7 sm:p-10 lg:p-12">
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${colorClasses.badge}`}>
            {portal === 'patient' ? <HeartPulse className="h-4 w-4" /> : portal === 'doctor' ? <Stethoscope className="h-4 w-4" /> : <Hospital className="h-4 w-4" />}
            {portal} portal
          </div>
          <h1 className="mt-6 max-w-lg text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            {content.title}
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-600 dark:text-zinc-400">
            {content.description}
          </p>

          <div className="mt-8 space-y-3">
            {content.features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-zinc-900/70 dark:text-zinc-300">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorClasses.check}`}>
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row flex-wrap">
            <Button
              size="lg"
              onClick={() => void handleLaunch()}
              rightIcon={<ArrowRight className="h-4 w-4" />}
              className={colorClasses.button}
            >
              {primaryLabel}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate(`/login?portal=${portal}`)}
            >
              Sign in with password
            </Button>
            {portal === 'admin' && (
              <Button size="lg" variant="outline" onClick={() => onNavigate('/register')}>
                Register a clinic
              </Button>
            )}
            {portal === 'patient' && (
              <Button size="lg" variant="outline" onClick={() => onNavigate('/register')}>
                Create Patient Account
              </Button>
            )}
          </div>
          {user && !hasMatchingAccount && (
            <p className="mt-4 text-xs text-amber-700 dark:text-amber-300">
              You are signed in as {user.role.toLowerCase()}. We’ll sign out before opening the {portal} sign-in so each portal stays separate.
            </p>
          )}
          {!user && portal !== 'admin' && (
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
              <LockKeyhole className="h-3.5 w-3.5" />
              Sign in with an account created for this role.
            </p>
          )}
        </div>

        <div className={`relative hidden items-center justify-center overflow-hidden p-10 lg:flex ${
          portal === 'patient'
            ? 'bg-gradient-to-br from-violet-700 via-indigo-800 to-slate-950'
            : portal === 'doctor'
              ? 'bg-gradient-to-br from-emerald-700 via-teal-900 to-slate-950'
              : 'bg-gradient-to-br from-blue-700 via-indigo-900 to-slate-950'
        }`}>
          <div className="absolute -right-14 -top-14 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -bottom-20 -left-16 h-72 w-72 rounded-full border border-white/10" />
          <div className="relative max-w-xs text-center text-white">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur">
              {portal === 'patient' ? <HeartPulse className="h-9 w-9" /> : portal === 'doctor' ? <Stethoscope className="h-9 w-9" /> : <Hospital className="h-9 w-9" />}
            </div>
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-white/65">ClinicFlow</p>
            <p className="mt-3 text-xl font-semibold leading-relaxed">
              {portal === 'patient'
                ? 'Your health journey. Your information. Your portal.'
                : portal === 'doctor'
                  ? 'The right tools for every consultation.'
                  : 'One clear view of your clinic operations.'}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};
