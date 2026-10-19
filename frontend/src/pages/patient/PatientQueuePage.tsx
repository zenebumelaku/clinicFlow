import React, { useState, useEffect } from 'react';
import {
  Clock,
  TicketCheck,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Phone,
  Sparkles,
  ArrowRight,
  Volume2,
  CalendarDays,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useClinicData } from '../../lib/hooks/useClinic';
import { authService } from '../../lib/services/authService';
import { useToast } from '../../components/ui/Toast';
import { clinicDateInputValue } from '../../lib/utils';
import { QueueStatus } from '../../types';

interface PatientQueuePageProps {
  onNavigate: (path: string) => void;
}

export const PatientQueuePage: React.FC<PatientQueuePageProps> = ({ onNavigate }) => {
  const { queue, appointments, patients, doctors, checkInPatient } = useClinicData();
  const { success, error } = useToast();
  const currentUser = authService.getUser();
  const patient = patients.find(p => p.phone === currentUser?.phone || p.id === currentUser?.id) || patients[0];
  const today = clinicDateInputValue();

  // Find ticket belonging to this patient or active queue
  const myTicket = queue.find(
    t =>
      (patient && (t.patientId === patient.id || t.patientPhone === patient.phone || t.patientName === patient.name)) &&
      t.status !== 'completed' &&
      t.status !== 'skipped'
  ) || queue.find(t => t.status !== 'completed' && t.status !== 'skipped');

  // Check if patient has an appointment today not checked in
  const todayAppointment = appointments.find(
    a =>
      (!patient || a.patientId === patient.id) &&
      a.date === today &&
      (a.status === 'scheduled' || a.status === 'confirmed')
  );

  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const handleSelfCheckIn = async () => {
    if (!todayAppointment) return;
    setIsCheckingIn(true);
    try {
      await checkInPatient({
        patientId: todayAppointment.patientId,
        doctorId: todayAppointment.doctorId,
        appointmentId: todayAppointment.id,
        priority: 'normal',
      });
      success('Check-in successful! Your live ticket has been issued.');
    } catch (err) {
      error(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-violet-50/60 via-white to-white dark:from-violet-950/20 dark:via-[#121214] dark:to-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <TicketCheck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Live Queue Status & Ticket Totem
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Real-time tracking for {patient?.name || 'Patient'} · Addis Ababa Clinic Lobby
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => onNavigate('/patient/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Main Ticket Display Totem */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#17114F] via-[#2C247D] to-[#5547C8] p-6 text-white shadow-xl shadow-violet-950/20 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-violet-200">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
            Live Lobby Totem
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-violet-100 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Auto-refreshing live
          </span>
        </div>

        {myTicket ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-sm font-medium text-violet-200">Your Clinic Queue Number</p>
              <p className="mt-2 text-6xl font-black tracking-tight sm:text-7xl font-mono">
                {myTicket.ticketNumber}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <StatusBadge status={myTicket.status} type="queue" />
                <span className="text-xs text-violet-200">
                  Priority: <strong className="capitalize">{myTicket.priority}</strong>
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 sm:min-w-64 backdrop-blur-xs">
              <p className="text-xs font-semibold text-violet-200 uppercase tracking-wider">Next Step</p>
              <p className="mt-2 text-xl font-bold">
                {myTicket.status === 'in_consultation'
                  ? 'Currently in Consultation'
                  : myTicket.status === 'called'
                    ? 'Please proceed to room!'
                    : `Position ${myTicket.position || 1} in line`}
              </p>
              <p className="mt-2 text-xs text-violet-100">
                {myTicket.status === 'in_consultation'
                  ? 'Your physician is reviewing your care.'
                  : myTicket.status === 'called'
                    ? `Doctor is ready for you in ${myTicket.roomNumber || 'Room 102'}`
                    : `Estimated wait: ~${myTicket.estimatedWaitMinutes || 10} minutes`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-violet-100 sm:col-span-2 pt-4 border-t border-white/10 mt-2">
              <span className="inline-flex items-center gap-2 font-medium">
                <Users className="h-4 w-4 text-violet-300" />
                Physician: <strong className="text-white">{myTicket.doctorName || 'Dr. Hana Tesfaye'}</strong>
              </span>
              <span className="inline-flex items-center gap-2 font-medium">
                <MapPin className="h-4 w-4 text-violet-300" />
                Suite: <strong className="text-white">{myTicket.roomNumber || 'Room 102 · East Wing'}</strong>
              </span>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center space-y-4">
            <TicketCheck className="mx-auto h-12 w-12 text-violet-300" />
            <div>
              <h2 className="text-xl font-bold">No Active Queue Ticket Right Now</h2>
              <p className="mt-1 text-sm text-violet-200 max-w-md mx-auto">
                You do not currently have a waiting ticket. You can check in for today's appointment or book a new consultation.
              </p>
            </div>

            {todayAppointment && (
              <div className="pt-2">
                <Button
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                  isLoading={isCheckingIn}
                  onClick={handleSelfCheckIn}
                  leftIcon={<CheckCircle2 className="h-5 w-5" />}
                >
                  Check In for Today's Visit ({todayAppointment.time})
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Helpful Instructions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Volume2 className="h-4 w-4 text-violet-600" />
            Audio & Lobby Screens
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            When your ticket number is announced over the clinic chime, please make your way to the consultation suite indicated on your ticket.
          </p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Phone className="h-4 w-4 text-violet-600" />
            Front Desk Support
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            Need to reschedule or speak with the reception team? Contact the front desk directly or visit the intake kiosk.
          </p>
        </Card>
      </div>
    </div>
  );
};
