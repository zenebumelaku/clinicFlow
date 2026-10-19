import React, { useState } from 'react';
import {
  Calendar,
  CalendarDays,
  Clock,
  HeartPulse,
  MapPin,
  Phone,
  TicketCheck,
  Users,
  Plus,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useClinicData } from '../../lib/hooks/useClinic';
import { authService } from '../../lib/services/authService';
import { formatDateSafe, formatPhone, formatTimeSafe, clinicDateInputValue } from '../../lib/utils';
import { QueueStatus } from '../../types';
import { useToast } from '../../components/ui/Toast';

interface PatientPortalPageProps {
  onNavigate: (path: string) => void;
  currentPath?: string;
}

export const PatientPortalPage: React.FC<PatientPortalPageProps> = ({
  onNavigate,
}) => {
  const { patients, appointments, queue, doctors, payments, createAppointment, updateAppointmentStatus, isLoading, errors } = useClinicData();
  const { success, error } = useToast();
  const currentUser = authService.getUser();
  const today = clinicDateInputValue();

  // Resolve current logged in patient profile
  const patient =
    patients.find(p => p.phone === currentUser?.phone || p.id === currentUser?.id) ||
    patients[0];

  // Resolve ticket for this patient
  const activeTicket = queue
    .filter(
      ticket =>
        (!patient || ticket.patientId === patient.id || ticket.patientPhone === patient.phone || ticket.patientName === patient.name) &&
        ticket.status !== 'completed' &&
        ticket.status !== 'skipped'
    )
    .sort((a, b) => {
      const rank: Record<QueueStatus, number> = {
        in_consultation: 0,
        called: 1,
        waiting: 2,
        completed: 3,
        skipped: 4,
      };
      return rank[a.status] - rank[b.status];
    })[0] || queue.find(ticket => ticket.status !== 'completed' && ticket.status !== 'skipped');

  // Appointments for this patient
  const patientAppointments = appointments
    .filter(appointment => !patient || appointment.patientId === patient.id || appointment.patientPhone === patient.phone || appointment.patientName === patient.name)
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));

  const nextAppointment = patientAppointments.find(
    appointment => appointment.status !== 'completed' && appointment.status !== 'cancelled'
  );

  const pastAppointments = patientAppointments.filter(
    appointment => appointment.status === 'completed' || appointment.status === 'cancelled'
  );

  // Payments for this patient
  const myPayments = patient
    ? payments.filter(p => p.patientId === patient.id || p.patientPhone === patient.phone || p.patientName === patient.name)
    : payments;

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id || '');
  const [bookingDate, setBookingDate] = useState<string>(today);
  const [bookingTime, setBookingTime] = useState<string>('10:30');
  const [bookingReason, setBookingReason] = useState<string>('Routine Consultation');

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = doctors.find(d => d.id === selectedDoctorId) || doctors[0];
    if (!doc) {
      error('Please select an available doctor.');
      return;
    }
    setIsSubmitting(true);
    try {
      await createAppointment({
        patientId: patient?.id || 'pat-1',
        patientName: patient?.name || `${currentUser?.firstName} ${currentUser?.lastName}` || 'Patient',
        patientPhone: patient?.phone || currentUser?.phone || '',
        doctorId: doc.id,
        doctorName: doc.name,
        department: doc.department || doc.specialization,
        date: bookingDate,
        time: bookingTime,
        durationMinutes: 30,
        status: 'scheduled',
        type: 'general_consultation',
        reason: bookingReason,
      });
      success(`Appointment confirmed with ${doc.name} on ${formatDateSafe(bookingDate)} at ${formatTimeSafe(bookingTime)}!`);
      setIsBookingOpen(false);
    } catch (err) {
      error(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelVisit = async (id: string, doctorName: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await updateAppointmentStatus({ id, status: 'cancelled' });
      success(`Your visit with ${doctorName} has been cancelled.`);
    } catch (err) {
      error(err instanceof Error ? err.message : 'Cancellation failed');
    }
  };

  const ticketCard = (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#17114F] via-[#2C247D] to-[#5547C8] p-6 text-white shadow-xl shadow-violet-950/15 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-violet-200">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
          Live Clinic Queue Ticket
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('/patient/queue')}
            className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-violet-100 hover:bg-white/20 transition cursor-pointer"
          >
            Open Full Totem Screen →
          </button>
        </div>
      </div>
      {activeTicket ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-sm text-violet-200">Your ticket</p>
            <p className="mt-1 text-5xl font-black tracking-tight sm:text-6xl font-mono">
              {activeTicket.ticketNumber}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <StatusBadge status={activeTicket.status} type="queue" />
              <span className="text-xs text-violet-200">
                Priority: <strong className="capitalize">{activeTicket.priority}</strong>
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 sm:min-w-56">
            <p className="text-xs text-violet-200 font-semibold uppercase">What happens next</p>
            <p className="mt-1 text-lg font-bold">
              {activeTicket.status === 'in_consultation'
                ? 'You are in Consultation'
                : activeTicket.status === 'called'
                  ? 'Please proceed to room!'
                  : `Position ${activeTicket.position || 1} in line`}
            </p>
            {activeTicket.status === 'waiting' && (
              <p className="mt-1 text-xs text-violet-100">
                Estimated wait: ~{activeTicket.estimatedWaitMinutes || 10} minutes
              </p>
            )}
            {activeTicket.status === 'called' && (
              <p className="mt-1 text-xs text-emerald-300 font-semibold">
                Proceed directly to {activeTicket.roomNumber || 'Room 102'}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-violet-100 sm:col-span-2 pt-2 border-t border-white/10">
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-300" />
              Doctor: <strong className="text-white">{activeTicket.doctorName || 'Dr. Hana Tesfaye'}</strong>
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-violet-300" />
              Location: <strong className="text-white">{activeTicket.roomNumber || 'East Wing · Room 102'}</strong>
            </span>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center space-y-2">
          <TicketCheck className="mx-auto h-10 w-10 text-violet-200" />
          <h2 className="text-lg font-bold">No active queue ticket today</h2>
          <p className="mx-auto max-w-md text-xs text-violet-200">
            When you arrive at the clinic, your ticket will appear here live with your room directions.
          </p>
        </div>
      )}
    </section>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header Banner */}
      <header className="relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-white to-violet-100/80 p-6 shadow-xs dark:border-zinc-800 dark:from-[#121214] dark:via-[#121214] dark:to-violet-950/30 sm:p-8">
        <div className="absolute -right-10 -top-12 h-48 w-48 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-800/20" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-xs font-semibold text-violet-700 dark:border-violet-900 dark:bg-zinc-900/70 dark:text-violet-300">
              <HeartPulse className="h-3.5 w-3.5" />
              Addis Ababa Healthcare Patient Care
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Welcome, {patient?.name || currentUser?.firstName || 'Patient'}
            </h1>
            <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
              Follow appointments, review live clinic queue status, and access consultation receipts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => setIsBookingOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
              className="bg-violet-700 hover:bg-violet-800 text-white shadow-xs"
            >
              Book Consultation
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate('/contact')}
              leftIcon={<Phone className="h-4 w-4" />}
            >
              Clinic Support
            </Button>
          </div>
        </div>

        {/* Patient Profile Bar */}
        <div className="relative mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-violet-100 pt-4 text-xs text-slate-600 dark:border-zinc-800 dark:text-zinc-400">
          <span className="font-semibold text-slate-900 dark:text-white">
            MRN: <span className="font-mono text-violet-700 dark:text-violet-400">{patient?.mrn || 'ET-2026-0104'}</span>
          </span>
          {patient?.phone && <span>Tel: {formatPhone(patient.phone)}</span>}
          {patient?.age && <span>Age: {patient.age} years</span>}
          {patient?.emergencyContact?.name && (
            <span>Emergency Contact: {patient.emergencyContact.name}</span>
          )}
        </div>
      </header>

      {/* 4 Quick Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => onNavigate('/patient/appointments')}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs transition hover:-translate-y-0.5 hover:border-violet-300 dark:border-zinc-800 dark:bg-[#121214] cursor-pointer"
        >
          <CalendarDays className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {patientAppointments.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Scheduled Appointments</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('/patient/queue')}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs transition hover:-translate-y-0.5 hover:border-violet-300 dark:border-zinc-800 dark:bg-[#121214] cursor-pointer"
        >
          <TicketCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <p className="mt-3 text-lg font-black text-slate-900 dark:text-white font-mono">
            {activeTicket ? activeTicket.ticketNumber : 'No Ticket'}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Today’s Live Ticket</p>
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs dark:border-zinc-800 dark:bg-[#121214]">
          <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white truncate">
            {nextAppointment ? `${formatDateSafe(nextAppointment.date)} (${formatTimeSafe(nextAppointment.time)})` : 'None Scheduled'}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Next Upcoming Visit</p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/patient/payments')}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs transition hover:-translate-y-0.5 hover:border-violet-300 dark:border-zinc-800 dark:bg-[#121214] cursor-pointer"
        >
          <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {myPayments.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Payment Invoices</p>
        </button>
      </div>

      {/* Live Ticket Section */}
      {ticketCard}

      {/* Upcoming Consultations Card */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Upcoming Scheduled Visits
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Confirmations and room assignments for your upcoming consultations.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsBookingOpen(true)}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Book Visit
          </Button>
        </div>

        {patientAppointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled').length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-6 text-center dark:bg-zinc-900/60">
            <Calendar className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-zinc-200">
              No upcoming appointments
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Book a consultation with an accredited physician when you need clinical care.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {patientAppointments
              .filter(a => a.status !== 'completed' && a.status !== 'cancelled')
              .map(appointment => (
                <div
                  key={appointment.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-violet-300 dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-violet-100 p-2.5 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 shrink-0">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {appointment.doctorName} · {appointment.department}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        Date: <strong>{formatDateSafe(appointment.date)}</strong> at <strong>{formatTimeSafe(appointment.time)}</strong>
                      </p>
                      {appointment.reason && (
                        <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1 italic">
                          "{appointment.reason}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <StatusBadge status={appointment.status} type="appointment" />
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/60 text-xs"
                      onClick={() => handleCancelVisit(appointment.id, appointment.doctorName)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Past Visit History */}
      {pastAppointments.length > 0 && (
        <Card className="space-y-4">
          <div className="border-b border-slate-100 pb-3 dark:border-zinc-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Past Consultations & Visit History ({pastAppointments.length})
            </h2>
            <p className="text-xs text-slate-500">Record of concluded visits and doctor recommendations.</p>
          </div>
          <div className="space-y-2.5">
            {pastAppointments.slice(0, 3).map(apt => (
              <div
                key={apt.id}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{apt.doctorName}</span>
                  <span className="text-slate-400"> · {formatDateSafe(apt.date)}</span>
                  {apt.reason && <p className="text-slate-500 mt-0.5">{apt.reason}</p>}
                </div>
                <StatusBadge status={apt.status} type="appointment" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Interactive Booking Modal */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 dark:bg-[#121214] max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-violet-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Book a Doctor Consultation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Schedule an appointment with an accredited clinic doctor.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  Select Physician
                </label>
                <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto pr-1">
                  {doctors.map(doc => {
                    const isSelected = selectedDoctorId === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctorId(doc.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center gap-2.5 ${
                          isSelected
                            ? 'border-violet-600 bg-violet-50/60 dark:border-violet-500 dark:bg-violet-950/40 text-violet-950 dark:text-violet-100 shadow-xs'
                            : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 flex items-center justify-center font-bold text-xs shrink-0">
                          {doc.name.replace(/^Dr\.\s*/, '').charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold truncate">{doc.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                            {doc.specialization}
                          </p>
                          <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            {doc.consultationFeeETB ? `${doc.consultationFeeETB} ETB` : 'General Fee'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Appointment Date"
                  type="date"
                  min={today}
                  value={bookingDate}
                  onChange={e => setBookingDate(e.target.value)}
                  required
                />
                <Select
                  label="Preferred Time Slot"
                  value={bookingTime}
                  onChange={e => setBookingTime(e.target.value)}
                  options={[
                    { value: '08:30', label: '08:30 AM (Morning Slot)' },
                    { value: '09:30', label: '09:30 AM (Morning Slot)' },
                    { value: '10:30', label: '10:30 AM (Mid-Morning)' },
                    { value: '11:30', label: '11:30 AM (Mid-Morning)' },
                    { value: '14:00', label: '02:00 PM (Afternoon)' },
                    { value: '15:00', label: '03:00 PM (Afternoon)' },
                    { value: '16:00', label: '04:00 PM (Late Afternoon)' },
                  ]}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  Reason for Consultation / Symptoms
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe your symptoms or reason for visit..."
                  value={bookingReason}
                  onChange={e => setBookingReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsBookingOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 bg-violet-700 hover:bg-violet-800 text-white"
                  isLoading={isSubmitting}
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Confirm Appointment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
