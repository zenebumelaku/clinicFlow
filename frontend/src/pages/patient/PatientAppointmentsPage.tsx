import React, { useState } from 'react';
import {
  Calendar,
  CalendarDays,
  Plus,
  Clock,
  Users,
  MapPin,
  X,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useClinicData } from '../../lib/hooks/useClinic';
import { authService } from '../../lib/services/authService';
import { formatDateSafe, formatTimeSafe, clinicDateInputValue } from '../../lib/utils';
import { useToast } from '../../components/ui/Toast';

interface PatientAppointmentsPageProps {
  onNavigate: (path: string) => void;
}

export const PatientAppointmentsPage: React.FC<PatientAppointmentsPageProps> = ({ onNavigate }) => {
  const { appointments, doctors, patients, createAppointment, updateAppointmentStatus } = useClinicData();
  const { success, error } = useToast();
  const currentUser = authService.getUser();
  const patient = patients.find(p => p.phone === currentUser?.phone || p.id === currentUser?.id) || patients[0];
  const today = clinicDateInputValue();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Booking Form State
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id || '');
  const [bookingDate, setBookingDate] = useState<string>(today);
  const [bookingTime, setBookingTime] = useState<string>('10:30');
  const [bookingReason, setBookingReason] = useState<string>('General Health Consultation');

  // Filter appointments for this patient
  const myAppointments = appointments
    .filter(a => !patient || a.patientId === patient.id || a.patientPhone === patient.phone || a.patientName === patient.name)
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));

  const upcomingVisits = myAppointments.filter(
    a => a.status !== 'completed' && a.status !== 'cancelled'
  );
  const pastVisits = myAppointments.filter(
    a => a.status === 'completed' || a.status === 'cancelled'
  );

  const displayedAppointments =
    activeTab === 'upcoming'
      ? upcomingVisits
      : activeTab === 'past'
        ? pastVisits
        : myAppointments;

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) {
      error('Please sign in to complete booking.');
      return;
    }
    const doctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];
    if (!doctor) {
      error('Please select an available doctor.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAppointment({
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        doctorId: doctor.id,
        doctorName: doctor.name,
        department: doctor.department || doctor.specialization,
        date: bookingDate,
        time: bookingTime,
        durationMinutes: 30,
        status: 'scheduled',
        type: 'general_consultation',
        reason: bookingReason,
      });
      success(`Appointment confirmed with ${doctor.name} on ${formatDateSafe(bookingDate)} at ${formatTimeSafe(bookingTime)}!`);
      setIsBookingModalOpen(false);
      setActiveTab('upcoming');
    } catch (err) {
      error(err instanceof Error ? err.message : 'Unable to book appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAppointment = async (id: string, doctorName: string) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled consultation?')) return;
    try {
      await updateAppointmentStatus({ id, status: 'cancelled' });
      success(`Your appointment with ${doctorName} has been cancelled.`);
    } catch (err) {
      error(err instanceof Error ? err.message : 'Cancellation failed');
    }
  };

  const filteredDoctors = selectedDept === 'all'
    ? doctors
    : doctors.filter(d => (d.department || '').toLowerCase().includes(selectedDept.toLowerCase()) || d.specialization.toLowerCase().includes(selectedDept.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-violet-50/60 via-white to-white dark:from-violet-950/20 dark:via-[#121214] dark:to-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Consultation Schedule & Bookings
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Book appointments with accredited specialist physicians in Addis Ababa.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            className="bg-violet-700 hover:bg-violet-800 text-white"
            onClick={() => setIsBookingModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Book New Appointment
          </Button>
          <Button variant="outline" onClick={() => onNavigate('/patient/dashboard')}>
            Dashboard
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-violet-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
              }`}
            >
              Upcoming ({upcomingVisits.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('past')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'past'
                  ? 'bg-violet-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
              }`}
            >
              Past Visits ({pastVisits.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-violet-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
              }`}
            >
              All Records ({myAppointments.length})
            </button>
          </div>
          <span className="text-xs text-slate-400">Patient: {patient?.name || 'Care Account'}</span>
        </div>

        {/* Appointment List */}
        {displayedAppointments.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Calendar className="mx-auto h-10 w-10 text-slate-300 dark:text-zinc-600" />
            <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
              No appointments found in this view
            </p>
            <p className="text-xs text-slate-400">
              Click "Book New Appointment" to schedule your next visit with our medical team.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedAppointments.map(appointment => (
              <div
                key={appointment.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#121214] hover:border-violet-300 dark:hover:border-violet-800 transition"
              >
                <div className="flex items-start gap-3.5">
                  <div className="h-11 w-11 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] uppercase font-bold">Time</span>
                    <span className="text-xs font-black">{formatTimeSafe(appointment.time)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {appointment.doctorName}
                      </p>
                      <StatusBadge status={appointment.status} type="appointment" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      {appointment.department || 'Specialist Consultation'} · Date:{' '}
                      <strong className="text-slate-700 dark:text-zinc-300">{formatDateSafe(appointment.date)}</strong>
                    </p>
                    {appointment.reason && (
                      <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1 italic">
                        "{appointment.reason}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/30"
                      onClick={() => handleCancelAppointment(appointment.id, appointment.doctorName)}
                    >
                      Cancel Visit
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Book Appointment Modal */}
      {isBookingModalOpen && (
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
                    Select your preferred physician, appointment date, and time slot.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="mt-5 space-y-4">
              {/* Doctor Selection */}
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
                            : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
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
                            {doc.consultationFeeETB ? `${doc.consultationFeeETB} ETB` : 'Consultation included'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Date & Time Picker */}
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

              {/* Reason for Visit */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  Reason for Visit / Symptoms
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe your symptoms or reason for visit (e.g. checkup, persistent cough, follow-up)..."
                  value={bookingReason}
                  onChange={e => setBookingReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  required
                />
              </div>

              <div className="flex gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsBookingModalOpen(false)}
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
                  Confirm Booking
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
