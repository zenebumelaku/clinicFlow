import React, { useState } from 'react';
import {
  Stethoscope,
  Clock,
  Calendar,
  CheckCircle2,
  Users,
  Building,
  Phone,
  Mail,
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Drawer } from '../../components/ui/Drawer';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useClinicData } from '../../lib/hooks/useClinic';
import { useToast } from '../../components/ui/Toast';
import { Input } from '../../components/ui/Input';
import { Doctor, DoctorAvailability } from '../../types';
import { formatETB, formatPhone, formatTimeSafe, clinicDateInputValue } from '../../lib/utils';

export const DoctorsPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { doctors, queue, appointments, updateDoctorAvailability, createDoctor, isLoading, errors } = useClinicData();
  const { success, error } = useToast();
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showCreateDoctor, setShowCreateDoctor] = useState(false);
  const [isCreatingDoctor, setIsCreatingDoctor] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    specialization: '',
    licenseNumber: '',
    consultationFee: '',
  });
  const today = clinicDateInputValue();

  const handleToggleAvailability = async (doctor: Doctor, newStatus: DoctorAvailability) => {
    try {
      await updateDoctorAvailability({ id: doctor.id, availability: newStatus });
      success(`${doctor.name} availability set to ${newStatus.toUpperCase()}`);
      if (selectedDoctor && selectedDoctor.id === doctor.id) {
        setSelectedDoctor({ ...selectedDoctor, availability: newStatus });
      }
    } catch (saveError) {
      error(saveError instanceof Error ? saveError.message : 'Could not update doctor availability');
    }
  };

  const handleCreateDoctor = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsCreatingDoctor(true);
    try {
      await createDoctor({
        ...doctorForm,
        email: doctorForm.email || undefined,
        consultationFee: doctorForm.consultationFee ? Number(doctorForm.consultationFee) : undefined,
      });
      success('Doctor account created.');
      setDoctorForm({
        firstName: '', lastName: '', phone: '', email: '', password: '',
        specialization: '', licenseNumber: '', consultationFee: '',
      });
      setShowCreateDoctor(false);
    } catch (createError) {
      error(createError instanceof Error ? createError.message : 'Could not create doctor account');
    } finally {
      setIsCreatingDoctor(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white dark:bg-[#121214] p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Doctor Roster & Availability
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Manage physician duty status, consultation rooms, and daily queue loads
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Button size="sm" onClick={() => setShowCreateDoctor(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Add Doctor
          </Button>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {doctors.filter(d => d.availability === 'available').length} Available
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {doctors.filter(d => d.availability === 'busy').length} With Patient
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-medium border border-slate-200 dark:border-zinc-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {doctors.filter(d => d.availability === 'off_duty').length} Off Duty
          </span>
        </div>
      </div>

      {/* 2. Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && <p role="status" className="text-sm text-slate-500">Loading doctors…</p>}
        {errors.map(message => <p role="alert" key={message} className="text-sm text-red-600">{message}</p>)}
        {!isLoading && !errors.length && doctors.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-slate-500">No doctors are registered for this clinic yet.</p>
        )}
        {doctors.map(doctor => {
          const doctorWaitingQueue = queue.filter(
            q => q.doctorId === doctor.id && (q.status === 'waiting' || q.status === 'called')
          );
          const doctorTodayApts = appointments.filter(
            a => a.doctorId === doctor.id && a.date === today
          );

          return (
            <Card key={doctor.id} hoverEffect className="space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {doctor.avatarUrl ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#E6EAF0] dark:border-slate-700 shrink-0">
                        <img
                          src={doctor.avatarUrl}
                          alt={doctor.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#EFF4FF] dark:bg-[#1D5BD8]/20 text-[#1D5BD8] dark:text-[#93C5FD] font-bold flex items-center justify-center text-lg shrink-0">
                        {doctor.name.charAt(4)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-[#172033] dark:text-white text-sm leading-tight">
                        {doctor.name}
                      </h3>
                      <p className="text-xs text-[#1D5BD8] dark:text-[#60A5FA] font-semibold mt-0.5">
                        {doctor.specialization}
                      </p>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        {doctor.roomNumber} · {doctor.department.split('&')[0]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status selector */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800 text-xs">
                  <span className="text-slate-500 dark:text-zinc-400 font-medium">Duty Status:</span>
                  <div className="flex items-center gap-1">
                    {(['available', 'busy', 'off_duty'] as DoctorAvailability[]).map(st => (
                      <button
                        key={st}
                        onClick={() => handleToggleAvailability(doctor, st)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer capitalize ${
                          doctor.availability === st
                            ? st === 'available'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : st === 'busy'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-zinc-700 dark:bg-zinc-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Workload stats */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-slate-100 dark:border-zinc-800">
                  <div className="p-2 rounded-lg bg-[#F8FAFC] dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80">
                    <span className="text-slate-400 dark:text-zinc-500 block text-[10px]">In Queue</span>
                    <strong className="text-slate-900 dark:text-white font-bold tabular-nums">
                      {doctorWaitingQueue.length}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-[#F8FAFC] dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80">
                    <span className="text-slate-400 dark:text-zinc-500 block text-[10px]">Today's Slots</span>
                    <strong className="text-slate-900 dark:text-white font-bold tabular-nums">
                      {doctorTodayApts.length}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-[#F8FAFC] dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80">
                    <span className="text-slate-400 dark:text-zinc-500 block text-[10px]">Fee (ETB)</span>
                    <strong className="text-[#1D5BD8] dark:text-[#93C5FD] font-bold tabular-nums">
                      {doctor.consultationFeeETB}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {doctor.workingHours.start && doctor.workingHours.end
                    ? `Hours: ${doctor.workingHours.start} - ${doctor.workingHours.end}`
                    : 'Working hours not configured'}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedDoctor(doctor)}
                >
                  Doctor Profile
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 3. DOCTOR PROFILE & SCHEDULE DRAWER */}
      {selectedDoctor && (
        <Drawer
          isOpen={!!selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          title={selectedDoctor.name}
          description={`${selectedDoctor.specialization} · ${selectedDoctor.roomNumber}`}
          width="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
              {selectedDoctor.avatarUrl ? (
                <img
                  src={selectedDoctor.avatarUrl}
                  alt={selectedDoctor.name}
                  className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-zinc-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-[#1D5BD8]/30 text-blue-700 dark:text-[#93C5FD] font-bold flex items-center justify-center text-xl">
                  {selectedDoctor.name.charAt(4)}
                </div>
              )}
              <div className="text-xs space-y-1">
                <div className="font-bold text-slate-900 dark:text-white text-sm">{selectedDoctor.name}</div>
                <div className="text-slate-600 dark:text-zinc-400">{selectedDoctor.department}</div>
                <div className="text-slate-500 dark:text-zinc-400">
                  Fee: <strong className="text-slate-900 dark:text-white">{formatETB(selectedDoctor.consultationFeeETB)}</strong>
                  {' · '}Avg Consult: <strong className="text-slate-900 dark:text-white">{selectedDoctor.averageConsultationMinutes} min</strong>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Availability Setting
              </h4>
              <div className="flex items-center gap-2">
                {(['available', 'busy', 'off_duty'] as DoctorAvailability[]).map(st => (
                  <Button
                    key={st}
                    size="sm"
                    variant={selectedDoctor.availability === st ? 'primary' : 'outline'}
                    onClick={() => handleToggleAvailability(selectedDoctor, st)}
                  >
                    Set {st.replace('_', ' ').toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Today's Queue for this doctor */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Assigned Waiting Queue
              </h4>
              <div className="space-y-2">
                {queue.filter(q => q.doctorId === selectedDoctor.id && q.status === 'waiting')
                  .length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-zinc-500">No waiting patients assigned right now.</p>
                ) : (
                  queue
                    .filter(q => q.doctorId === selectedDoctor.id && q.status === 'waiting')
                    .map(item => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-xs flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-700 dark:text-[#93C5FD] bg-blue-50 dark:bg-[#1D5BD8]/20 px-2 py-0.5 rounded border border-blue-200 dark:border-[#1D5BD8]/30 tabular-nums">
                            {item.ticketNumber}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">{item.patientName}</span>
                        </div>
                        <StatusBadge status={item.priority} type="priority" />
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Today's appointments */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Today's Consultations
              </h4>
              <div className="space-y-2">
                {appointments
                  .filter(a => a.doctorId === selectedDoctor.id && a.date === today)
                  .map(a => (
                    <div
                      key={a.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {formatTimeSafe(a.time)} — {a.patientName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">{a.reason}</div>
                      </div>
                      <StatusBadge status={a.status} type="appointment" />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}
      <Drawer
        isOpen={showCreateDoctor}
        onClose={() => setShowCreateDoctor(false)}
        title="Create Doctor Account"
        description="Creates a doctor login and adds them to this clinic."
      >
        <form className="space-y-4" onSubmit={handleCreateDoctor}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First name" required value={doctorForm.firstName} onChange={event => setDoctorForm({ ...doctorForm, firstName: event.target.value })} />
            <Input label="Last name" required value={doctorForm.lastName} onChange={event => setDoctorForm({ ...doctorForm, lastName: event.target.value })} />
            <Input label="Phone" required type="tel" value={doctorForm.phone} onChange={event => setDoctorForm({ ...doctorForm, phone: event.target.value })} />
            <Input label="Email" type="email" value={doctorForm.email} onChange={event => setDoctorForm({ ...doctorForm, email: event.target.value })} />
            <Input label="Temporary password" required type="password" minLength={6} value={doctorForm.password} onChange={event => setDoctorForm({ ...doctorForm, password: event.target.value })} />
            <Input label="Specialization" required value={doctorForm.specialization} onChange={event => setDoctorForm({ ...doctorForm, specialization: event.target.value })} />
            <Input label="Medical license number" required value={doctorForm.licenseNumber} onChange={event => setDoctorForm({ ...doctorForm, licenseNumber: event.target.value })} />
            <Input label="Consultation fee (ETB)" type="number" min="0" step="0.01" value={doctorForm.consultationFee} onChange={event => setDoctorForm({ ...doctorForm, consultationFee: event.target.value })} />
          </div>
          <p className="text-xs text-slate-500">Duty status can be managed after the account is created. Scheduling hours are not supported by the current API.</p>
          <Button type="submit" disabled={isCreatingDoctor}>
            {isCreatingDoctor ? 'Creating…' : 'Create Doctor'}
          </Button>
        </form>
      </Drawer>
    </div>
  );
};
