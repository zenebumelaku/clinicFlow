import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building,
  CheckCircle2,
  Hospital,
  Lock,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Users,
  HeartPulse,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
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
  clinicName: string;
  clinicPhone: string;
  clinicAddress: string;
  clinicCity: string;
}

interface PatientForm {
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  gender: string;
  dateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

const initialClinicForm: RegistrationForm = {
  phone: '',
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: '',
  clinicName: '',
  clinicPhone: '',
  clinicAddress: '',
  clinicCity: '',
};

const initialPatientForm: PatientForm = {
  phone: '',
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: '',
  gender: 'male',
  dateOfBirth: '1995-01-01',
  emergencyContactName: '',
  emergencyContactPhone: '',
};

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { success, error } = useToast();
  const searchType = new URLSearchParams(window.location.search).get('type');
  const [regType, setRegType] = useState<'patient' | 'clinic'>(
    searchType === 'clinic' ? 'clinic' : 'patient'
  );
  const [step, setStep] = useState<1 | 2>(1);
  const [clinicForm, setClinicForm] = useState(initialClinicForm);
  const [patientForm, setPatientForm] = useState(initialPatientForm);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleClinicAccountDetails = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (clinicForm.password !== clinicForm.confirmPassword) {
      error('The passwords do not match.');
      return;
    }
    setStep(2);
  };

  const handleClinicRegistration = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsRegistering(true);
    try {
      await authService.registerClinic({
        phone: clinicForm.phone,
        ...(clinicForm.email.trim() ? { email: clinicForm.email.trim() } : {}),
        password: clinicForm.password,
        firstName: clinicForm.firstName.trim(),
        lastName: clinicForm.lastName.trim(),
        clinicName: clinicForm.clinicName.trim(),
        ...(clinicForm.clinicPhone.trim() ? { clinicPhone: clinicForm.clinicPhone.trim() } : {}),
        ...(clinicForm.clinicAddress.trim() ? { clinicAddress: clinicForm.clinicAddress.trim() } : {}),
        ...(clinicForm.clinicCity.trim() ? { clinicCity: clinicForm.clinicCity.trim() } : {}),
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

  const handlePatientRegistration = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (patientForm.password !== patientForm.confirmPassword) {
      error('The passwords do not match.');
      return;
    }
    setIsRegistering(true);
    try {
      await authService.registerPatient({
        phone: patientForm.phone,
        ...(patientForm.email.trim() ? { email: patientForm.email.trim() } : {}),
        password: patientForm.password,
        firstName: patientForm.firstName.trim(),
        lastName: patientForm.lastName.trim(),
        gender: patientForm.gender,
        dateOfBirth: patientForm.dateOfBirth,
        emergencyContactName: patientForm.emergencyContactName.trim() || undefined,
        emergencyContactPhone: patientForm.emergencyContactPhone.trim() || undefined,
      });
      success('Welcome to MediFlow! Your patient account and record are ready.');
      onNavigate('/patient/dashboard');
    } catch (registrationError) {
      error(
        registrationError instanceof Error
          ? registrationError.message
          : 'Unable to create patient account.',
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
          alt="ClinicFlow Registration"
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
              Accredited Addis Ababa Healthcare Network
            </div>
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              {regType === 'patient'
                ? 'Your personal health records, simplified.'
                : 'Bring your clinic into a better flow.'}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              {regType === 'patient'
                ? 'Create a patient account to track appointments, follow your live clinic queue ticket, and access visit summaries.'
                : 'Create an administrator account to coordinate appointments, patient records, and daily clinic operations in one place.'}
            </p>
            <div className="flex items-center gap-2 text-sm text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
              <span>Instant secure access across all devices</span>
            </div>
          </div>
          <p className="text-xs text-white/50">ClinicFlow · Addis Ababa, Ethiopia</p>
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
            {/* Account Type Selector Tabs */}
            <div className="mb-6 flex rounded-2xl bg-slate-100 p-1 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => setRegType('patient')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition cursor-pointer ${
                  regType === 'patient'
                    ? 'bg-white text-violet-700 shadow-xs dark:bg-zinc-800 dark:text-violet-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <HeartPulse className="h-4 w-4" />
                Patient Registration
              </button>
              <button
                type="button"
                onClick={() => setRegType('clinic')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition cursor-pointer ${
                  regType === 'clinic'
                    ? 'bg-white text-blue-700 shadow-xs dark:bg-zinc-800 dark:text-blue-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <Hospital className="h-4 w-4" />
                Clinic Practice
              </button>
            </div>

            {/* PATIENT REGISTRATION FORM */}
            {regType === 'patient' && (
              <div>
                <div className="mb-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
                    Patient Care Access
                  </p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-[1.75rem]">
                    Create your patient profile
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                    Sign up to view your live queue tickets, book doctor appointments, and see visit receipts.
                  </p>
                </div>

                <form onSubmit={handlePatientRegistration} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="First Name"
                      placeholder="e.g. Ayalew"
                      value={patientForm.firstName}
                      onChange={e => setPatientForm(f => ({ ...f, firstName: e.target.value }))}
                      required
                    />
                    <Input
                      label="Last Name"
                      placeholder="e.g. Kebede"
                      value={patientForm.lastName}
                      onChange={e => setPatientForm(f => ({ ...f, lastName: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Phone Number"
                      placeholder="+251 9... or 09..."
                      leftIcon={<Phone className="h-4 w-4" />}
                      value={patientForm.phone}
                      onChange={e => setPatientForm(f => ({ ...f, phone: e.target.value }))}
                      required
                    />
                    <Input
                      label="Email (Optional)"
                      type="email"
                      placeholder="you@example.com"
                      value={patientForm.email}
                      onChange={e => setPatientForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Date of Birth"
                      type="date"
                      value={patientForm.dateOfBirth}
                      onChange={e => setPatientForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                      required
                    />
                    <Select
                      label="Gender"
                      value={patientForm.gender}
                      onChange={e => setPatientForm(f => ({ ...f, gender: e.target.value }))}
                      options={[
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other' },
                      ]}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Emergency Contact Name (Optional)"
                      placeholder="e.g. Tigist Kebede"
                      value={patientForm.emergencyContactName}
                      onChange={e => setPatientForm(f => ({ ...f, emergencyContactName: e.target.value }))}
                    />
                    <Input
                      label="Emergency Contact Phone (Optional)"
                      placeholder="+251 9..."
                      value={patientForm.emergencyContactPhone}
                      onChange={e => setPatientForm(f => ({ ...f, emergencyContactPhone: e.target.value }))}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Password"
                      type="password"
                      placeholder="At least 6 characters"
                      leftIcon={<Lock className="h-4 w-4" />}
                      value={patientForm.password}
                      onChange={e => setPatientForm(f => ({ ...f, password: e.target.value }))}
                      required
                    />
                    <Input
                      label="Confirm Password"
                      type="password"
                      placeholder="Re-enter password"
                      leftIcon={<Lock className="h-4 w-4" />}
                      value={patientForm.confirmPassword}
                      onChange={e => setPatientForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    isLoading={isRegistering}
                    className="w-full bg-violet-700 hover:bg-violet-800 mt-2"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Complete Patient Sign Up
                  </Button>
                </form>
              </div>
            )}

            {/* CLINIC REGISTRATION FORM */}
            {regType === 'clinic' && (
              <div>
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D5BD8] dark:text-blue-400">
                      New Clinic Practice
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-[1.75rem]">
                      {step === 1 ? 'Start with your admin account' : 'Tell us about your clinic'}
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {step === 1
                        ? 'Your clinic workspace is just a few steps away.'
                        : 'Add your clinic details to finish creating your account.'}
                    </p>
                  </div>
                </div>

                <div className="mb-6" aria-label={`Step ${step} of 2`}>
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
                      <span className="text-xs font-semibold">Administrator</span>
                    </div>
                    <div className="mx-3 h-0.5 flex-1 bg-slate-200 dark:bg-zinc-800" />
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          step === 2
                            ? 'bg-[#1D5BD8] text-white'
                            : 'border border-slate-300 text-slate-500 dark:border-zinc-700 dark:text-zinc-400'
                        }`}
                      >
                        2
                      </span>
                      <span className="text-xs font-semibold">Clinic practice</span>
                    </div>
                  </div>
                </div>

                {step === 1 ? (
                  <form onSubmit={handleClinicAccountDetails} className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label="First Name"
                        placeholder="e.g. Sara"
                        value={clinicForm.firstName}
                        onChange={e => setClinicForm(f => ({ ...f, firstName: e.target.value }))}
                        required
                      />
                      <Input
                        label="Last Name"
                        placeholder="e.g. Tadesse"
                        value={clinicForm.lastName}
                        onChange={e => setClinicForm(f => ({ ...f, lastName: e.target.value }))}
                        required
                      />
                    </div>
                    <Input
                      label="Phone Number"
                      placeholder="+251 9... or 09..."
                      leftIcon={<Phone className="h-4 w-4" />}
                      value={clinicForm.phone}
                      onChange={e => setClinicForm(f => ({ ...f, phone: e.target.value }))}
                      required
                    />
                    <Input
                      label="Email (Optional)"
                      type="email"
                      placeholder="admin@clinic.et"
                      value={clinicForm.email}
                      onChange={e => setClinicForm(f => ({ ...f, email: e.target.value }))}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label="Password"
                        type="password"
                        placeholder="At least 6 characters"
                        leftIcon={<Lock className="h-4 w-4" />}
                        value={clinicForm.password}
                        onChange={e => setClinicForm(f => ({ ...f, password: e.target.value }))}
                        required
                      />
                      <Input
                        label="Confirm Password"
                        type="password"
                        placeholder="Re-enter password"
                        leftIcon={<Lock className="h-4 w-4" />}
                        value={clinicForm.confirmPassword}
                        onChange={e => setClinicForm(f => ({ ...f, confirmPassword: e.target.value }))}
                        required
                      />
                    </div>
                    <Button type="submit" size="lg" className="w-full mt-2" rightIcon={<ArrowRight className="h-4 w-4" />}>
                      Continue to Clinic Details
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleClinicRegistration} className="space-y-4">
                    <Input
                      label="Clinic Name"
                      placeholder="e.g. Bole Specialty Clinic"
                      leftIcon={<Building className="h-4 w-4" />}
                      value={clinicForm.clinicName}
                      onChange={e => setClinicForm(f => ({ ...f, clinicName: e.target.value }))}
                      required
                    />
                    <Input
                      label="Clinic Reception Phone (Optional)"
                      placeholder="+251 11..."
                      leftIcon={<Phone className="h-4 w-4" />}
                      value={clinicForm.clinicPhone}
                      onChange={e => setClinicForm(f => ({ ...f, clinicPhone: e.target.value }))}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label="City"
                        placeholder="e.g. Addis Ababa"
                        leftIcon={<MapPin className="h-4 w-4" />}
                        value={clinicForm.clinicCity}
                        onChange={e => setClinicForm(f => ({ ...f, clinicCity: e.target.value }))}
                      />
                      <Input
                        label="Address / Subcity"
                        placeholder="e.g. Bole Medhanealem"
                        value={clinicForm.clinicAddress}
                        onChange={e => setClinicForm(f => ({ ...f, clinicAddress: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                        Back
                      </Button>
                      <Button type="submit" size="lg" isLoading={isRegistering} className="flex-1" rightIcon={<CheckCircle2 className="h-4 w-4" />}>
                        Complete Clinic Registration
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500 dark:border-zinc-800 dark:text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="font-semibold text-[#1D5BD8] hover:underline dark:text-blue-400 cursor-pointer"
              >
                Sign in to your portal
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
