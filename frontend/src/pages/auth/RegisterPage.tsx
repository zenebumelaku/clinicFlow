import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building,
  CheckCircle2,
  Clock3,
  Hospital,
  Lock,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { authService } from '../../lib/services/authService';
import medicalVisual from '../../assets/images/auth_medical_visual_1791475805267.jpg';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
}

interface RegistrationForm {
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  code: string;
  clinicName: string;
  clinicPhone: string;
  clinicAddress: string;
  clinicCity: string;
}

const initialForm: RegistrationForm = {
  phone: '',
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: '',
  code: '',
  clinicName: '',
  clinicPhone: '',
  clinicAddress: '',
  clinicCity: '',
};

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { success, error } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState(initialForm);
  const [isSending, setIsSending] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds === 0) return;
    const timer = window.setTimeout(
      () => setCooldownSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  const sendCode = async () => {
    setIsSending(true);
    try {
      const result = await authService.sendRegistrationOtp(form.phone);
      setCooldownSeconds(result.cooldownSeconds);
      setStep(2);
      success('Verification code sent. Check your phone for the code.');
    } catch (sendError) {
      error(sendError instanceof Error ? sendError.message : 'Unable to send a verification code.');
    } finally {
      setIsSending(false);
    }
  };

  const handleAccountDetails = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      error('The passwords do not match.');
      return;
    }
    await sendCode();
  };

  const handleRegistration = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsRegistering(true);
    try {
      await authService.registerClinic({
        phone: form.phone,
        code: form.code,
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        clinicName: form.clinicName.trim(),
        ...(form.clinicPhone.trim() ? { clinicPhone: form.clinicPhone.trim() } : {}),
        ...(form.clinicAddress.trim() ? { clinicAddress: form.clinicAddress.trim() } : {}),
        ...(form.clinicCity.trim() ? { clinicCity: form.clinicCity.trim() } : {}),
      });
      success('Your clinic account is ready.');
      onNavigate('/dashboard/overview');
    } catch (registrationError) {
      error(
        registrationError instanceof Error
          ? registrationError.message
          : 'Unable to finish clinic registration.',
      );
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 transition-colors">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-36 -top-40 h-[28rem] w-[28rem] rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-900/15 lg:hidden"
      />
      <div className="hidden lg:block lg:col-span-5 relative bg-zinc-950 overflow-hidden">
        <img
          src={medicalVisual}
          alt="ClinicFlow clinic registration"
          className="w-full h-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/40 to-zinc-900/20" />
        <div className="absolute inset-0 p-12 flex flex-col justify-between text-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#1D5BD8] flex items-center justify-center shadow-lg shadow-blue-950/30">
              <Hospital className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">ClinicFlow</span>
          </div>
          <div className="max-w-md space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-blue-100 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Secure clinic onboarding
            </div>
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              Bring your clinic into a better flow.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              Create an administrator account to coordinate appointments, patient records, and
              daily clinic operations in one place.
            </p>
            <div className="flex items-center gap-2 text-sm text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
              <span>Phone verification helps protect your account</span>
            </div>
          </div>
          <p className="text-xs text-white/50">ClinicFlow · Clinic operations, brought together.</p>
        </div>
      </div>

      <div className="relative z-10 lg:col-span-7 flex flex-col justify-center px-4 sm:px-8 lg:px-12 xl:px-20 py-6 sm:py-10">
        <div className="w-full max-w-xl mx-auto">
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#1D5BD8] flex items-center justify-center text-white shadow-md shadow-blue-900/20">
                <Hospital className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-tight">ClinicFlow</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[#1D5BD8] hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40"
            >
              Sign in
            </button>
          </div>

          <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xl shadow-slate-900/[0.06] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-black/20 sm:p-8">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D5BD8] dark:text-blue-400">
                  New clinic account
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-[1.75rem]">
                  {step === 1 ? 'Start with your account' : 'Tell us about your clinic'}
                </h1>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                  {step === 1
                    ? 'Your clinic workspace is just a few steps away.'
                    : `We sent a verification code to ${form.phone}.`}
                </p>
              </div>
              <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300 sm:inline-flex">
                <Clock3 className="h-3.5 w-3.5" />
                About 1 min
              </span>
            </div>

            <div className="mb-7" aria-label={`Step ${step} of 2`}>
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      step === 1
                        ? 'bg-[#1D5BD8] text-white'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {step === 1 ? '1' : <CheckCircle2 className="h-4 w-4" />}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200 sm:text-sm">
                    Your details
                  </span>
                </div>
                <div className="mx-3 h-px flex-1 bg-slate-200 dark:bg-zinc-800">
                  <div
                    className={`h-px bg-[#1D5BD8] transition-all duration-300 ${
                      step === 2 ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      step === 2
                        ? 'bg-[#1D5BD8] text-white'
                        : 'border border-slate-300 bg-white text-slate-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400'
                    }`}
                  >
                    2
                  </span>
                  <span
                    className={`text-xs font-semibold sm:text-sm ${
                      step === 2
                        ? 'text-slate-700 dark:text-zinc-200'
                        : 'text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    Your clinic
                  </span>
                </div>
              </div>
            </div>

          {step === 1 ? (
            <form onSubmit={(event) => void handleAccountDetails(event)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First name"
                  autoComplete="given-name"
                  required
                  minLength={2}
                  maxLength={80}
                  leftIcon={<User className="w-4 h-4" />}
                  value={form.firstName}
                  onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                />
                <Input
                  label="Last name"
                  autoComplete="family-name"
                  required
                  minLength={2}
                  maxLength={80}
                  value={form.lastName}
                  onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                />
              </div>
              <Input
                label="Mobile number"
                type="tel"
                autoComplete="tel"
                required
                minLength={6}
                maxLength={32}
                placeholder="+251 911 234567"
                leftIcon={<Phone className="w-4 h-4" />}
                helperText="A verification code will be sent to this number."
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
              <Input
                label="Email address (optional)"
                type="email"
                autoComplete="email"
                maxLength={254}
                placeholder="you@yourclinic.com"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                leftIcon={<Lock className="w-4 h-4" />}
                helperText="Use at least 8 characters."
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
              <Input
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                error={
                  form.confirmPassword && form.password !== form.confirmPassword
                    ? 'Passwords do not match.'
                    : undefined
                }
                value={form.confirmPassword}
                onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
              />
              <Button
                type="submit"
                size="lg"
                className="w-full mt-2"
                isLoading={isSending}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send verification code
              </Button>
            </form>
          ) : (
            <form onSubmit={(event) => void handleRegistration(event)} className="space-y-4">
              <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm dark:border-emerald-900/70 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <span className="font-medium text-emerald-900 dark:text-emerald-200">
                    Mobile number added
                  </span>
                </div>
                <span className="max-w-[45%] truncate text-xs text-emerald-800 dark:text-emerald-300">
                  {form.phone}
                </span>
              </div>
              <Input
                label="Verification code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                minLength={6}
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="6-digit code"
                helperText="In local development, the code is printed in the backend terminal."
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
              <div className="flex items-center justify-between -mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setForm({ ...form, code: '' });
                    setCooldownSeconds(0);
                  }}
                  className="text-xs font-medium text-[#1D5BD8] hover:underline"
                >
                  Edit phone number
                </button>
                <button
                  type="button"
                  disabled={isSending || cooldownSeconds > 0}
                  onClick={() => void sendCode()}
                  className="text-xs font-medium text-[#1D5BD8] hover:underline disabled:text-slate-400 disabled:no-underline"
                >
                  {cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : 'Resend code'}
                </button>
              </div>
              <Input
                label="Clinic name"
                autoComplete="organization"
                required
                minLength={2}
                maxLength={150}
                placeholder="e.g. Addis Health Center"
                leftIcon={<Building className="w-4 h-4" />}
                value={form.clinicName}
                onChange={(event) => setForm({ ...form, clinicName: event.target.value })}
              />
              <Input
                label="Clinic contact number (optional)"
                type="tel"
                autoComplete="tel"
                minLength={6}
                maxLength={32}
                placeholder={form.phone}
                leftIcon={<Phone className="w-4 h-4" />}
                helperText="Defaults to your verified mobile number."
                value={form.clinicPhone}
                onChange={(event) => setForm({ ...form, clinicPhone: event.target.value })}
              />
              <Input
                label="City (optional)"
                autoComplete="address-level2"
                maxLength={100}
                placeholder="Addis Ababa"
                leftIcon={<MapPin className="w-4 h-4" />}
                value={form.clinicCity}
                onChange={(event) => setForm({ ...form, clinicCity: event.target.value })}
              />
              <Input
                label="Clinic address (optional)"
                autoComplete="street-address"
                maxLength={255}
                placeholder="Street, neighborhood, or building"
                value={form.clinicAddress}
                onChange={(event) => setForm({ ...form, clinicAddress: event.target.value })}
              />
              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>
                <Button type="submit" size="lg" className="flex-1" isLoading={isRegistering}>
                  Create clinic account
                </Button>
              </div>
            </form>
          )}

          <div className="text-center text-xs text-slate-500 dark:text-zinc-400 pt-4 border-t border-slate-100 dark:border-zinc-800">
            Already registered?{' '}
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Sign in
            </button>
          </div>
          </section>
          <p className="mt-5 text-center text-xs text-slate-400 dark:text-zinc-500">
            Your account is protected with verified sign-in and secure password storage.
          </p>
        </div>
      </div>
    </div>
  );
};
