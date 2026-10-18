import React from 'react';
import {
  Calendar,
  CalendarDays,
  Clock,
  HeartPulse,
  MapPin,
  Phone,
  TicketCheck,
  Users,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useClinicData } from '../../lib/hooks/useClinic';
import { formatDateSafe, formatPhone, formatTimeSafe } from '../../lib/utils';
import { QueueStatus } from '../../types';

interface PatientPortalPageProps {
  onNavigate: (path: string) => void;
  currentPath: string;
}

export const PatientPortalPage: React.FC<PatientPortalPageProps> = ({
  onNavigate,
  currentPath,
}) => {
  const { patients, appointments, queue, isLoading, errors } = useClinicData();
  const patient = patients[0];
  const isQueuePage = currentPath === '/patient/queue';
  const isAppointmentsPage = currentPath === '/patient/appointments';
  const activeTicket = queue
    .filter(ticket => ticket.status !== 'completed' && ticket.status !== 'skipped')
    .sort((a, b) => {
      const rank: Record<QueueStatus, number> = {
        in_consultation: 0,
        called: 1,
        waiting: 2,
        completed: 3,
        skipped: 4,
      };
      return rank[a.status] - rank[b.status];
    })[0];
  const patientAppointments = appointments
    .filter(appointment => !patient || appointment.patientId === patient.id)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  const nextAppointment = patientAppointments.find(
    appointment => appointment.status !== 'completed' && appointment.status !== 'cancelled',
  );

  const title = isQueuePage
    ? 'Your live queue'
    : isAppointmentsPage
      ? 'Your appointments'
      : 'Your care, all in one place';
  const subtitle = isQueuePage
    ? 'Follow your ticket and know what to expect next.'
    : isAppointmentsPage
      ? 'Review your scheduled consultations and visit history.'
      : 'A clear view of your clinic visits, appointments, and queue status.';

  const ticketCard = (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#17114F] via-[#2C247D] to-[#5547C8] p-6 text-white shadow-xl shadow-violet-950/15 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-violet-200">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
          Live ticket status
        </div>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-violet-100">
          Updates automatically
        </span>
      </div>
      {activeTicket ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-sm text-violet-200">Your ticket</p>
            <p className="mt-1 text-5xl font-black tracking-tight sm:text-6xl">
              {activeTicket.ticketNumber}
            </p>
            <div className="mt-3">
              <StatusBadge status={activeTicket.status} type="queue" />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 sm:min-w-52">
            <p className="text-xs text-violet-200">What happens next</p>
            <p className="mt-1 text-lg font-bold">
              {activeTicket.status === 'in_consultation'
                ? 'You are with your doctor'
                : activeTicket.status === 'called'
                  ? 'Please proceed to your doctor'
                  : `Position ${activeTicket.position || 1} in line`}
            </p>
            {activeTicket.status === 'waiting' && activeTicket.estimatedWaitMinutes > 0 && (
              <p className="mt-1 text-xs text-violet-100">
                Estimated wait: about {activeTicket.estimatedWaitMinutes} minutes
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-violet-100 sm:col-span-2">
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" /> {activeTicket.doctorName}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {activeTicket.roomNumber || 'Ask reception for your consultation room'}
            </span>
          </div>
        </div>
      ) : (
        <div className="py-9 text-center">
          <TicketCheck className="mx-auto h-10 w-10 text-violet-200" />
          <h2 className="mt-3 text-lg font-bold">No active ticket today</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-violet-200">
            When you arrive for your visit, the reception team will check you in and issue your queue ticket.
          </p>
        </div>
      )}
    </section>
  );

  const appointmentList = (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Appointments</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            {patientAppointments.length} visit{patientAppointments.length === 1 ? '' : 's'} on your record
          </p>
        </div>
        <CalendarDays className="h-5 w-5 text-violet-600 dark:text-violet-300" />
      </div>
      {patientAppointments.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-6 text-center dark:bg-zinc-900/60">
          <Calendar className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-zinc-200">
            No appointments to show
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Contact the clinic to arrange or change a visit.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {patientAppointments.map(appointment => (
            <article
              key={appointment.id}
              className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-violet-300 hover:bg-violet-50/40 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-violet-800 sm:flex-row sm:items-center"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-violet-100 p-2.5 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatDateSafe(appointment.date)} · {formatTimeSafe(appointment.time)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
                    {appointment.doctorName} · {appointment.department}
                  </p>
                  {appointment.reason && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                      {appointment.reason}
                    </p>
                  )}
                </div>
              </div>
              <StatusBadge status={appointment.status} type="appointment" />
            </article>
          ))}
        </div>
      )}
    </Card>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-white to-violet-100/80 p-6 shadow-sm dark:border-zinc-800 dark:from-[#121214] dark:via-[#121214] dark:to-violet-950/30 sm:p-8">
        <div className="absolute -right-10 -top-12 h-48 w-48 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-800/20" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-xs font-semibold text-violet-700 dark:border-violet-900 dark:bg-zinc-900/70 dark:text-violet-300">
              <HeartPulse className="h-3.5 w-3.5" />
              Patient care portal
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-zinc-400">{subtitle}</p>
          </div>
          <Button
            variant="primary"
            onClick={() => onNavigate('/contact')}
            leftIcon={<Phone className="h-4 w-4" />}
            className="bg-violet-700 hover:bg-violet-800"
          >
            Contact the clinic
          </Button>
        </div>
        <div className="relative mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-violet-100 pt-4 text-xs text-slate-600 dark:border-zinc-800 dark:text-zinc-400">
          <span className="font-semibold text-slate-800 dark:text-zinc-200">
            {patient?.name || 'Patient profile'}
          </span>
          <span>{patient?.mrn ? `MRN ${patient.mrn}` : 'Medical record number pending'}</span>
          {patient?.phone && <span>{formatPhone(patient.phone)}</span>}
        </div>
      </header>

      {isLoading && <p role="status" className="text-sm text-slate-500">Loading your care information…</p>}
      {errors.map(message => (
        <p role="alert" key={message} className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {message}
        </p>
      ))}

      {isQueuePage ? (
        <>
          {ticketCard}
          <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Need help with your visit?</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                The clinic team can help with check-in, ticket questions, and directions.
              </p>
            </div>
            <Button variant="outline" onClick={() => onNavigate('/contact')}>Get clinic support</Button>
          </Card>
        </>
      ) : isAppointmentsPage ? (
        appointmentList
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => onNavigate('/patient/appointments')}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 dark:border-zinc-800 dark:bg-[#121214]"
            >
              <CalendarDays className="h-5 w-5 text-violet-600 dark:text-violet-300" />
              <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{patientAppointments.length}</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Appointments on record</p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/patient/queue')}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 dark:border-zinc-800 dark:bg-[#121214]"
            >
              <TicketCheck className="h-5 w-5 text-violet-600 dark:text-violet-300" />
              <p className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                {activeTicket?.ticketNumber || 'No active ticket'}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Today’s queue status</p>
            </button>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#121214]">
              <Clock className="h-5 w-5 text-violet-600 dark:text-violet-300" />
              <p className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                {nextAppointment ? formatDateSafe(nextAppointment.date) : 'No upcoming visit'}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Next scheduled appointment</p>
            </div>
          </div>
          {ticketCard}
          {appointmentList}
        </>
      )}
    </div>
  );
};
