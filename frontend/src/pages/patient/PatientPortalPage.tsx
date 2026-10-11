import React from 'react';
import {
  Clock,
  Calendar,
  CreditCard,
  User,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Sparkles,
  Phone,
  Building
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useClinicData } from '../../lib/hooks/useClinic';
import { formatTimeSafe, formatDateSafe, formatETB, formatPhone } from '../../lib/utils';

export const PatientPortalPage: React.FC<{ onNavigate: (path: string) => void }> = ({
  onNavigate
}) => {
  const { patients, appointments, queue, payments } = useClinicData();

  const myPatient = patients[0];

  const myTicket = queue.find(q => q.status !== 'completed' && q.status !== 'skipped');
  const myAppointments = myPatient ? appointments.filter(a => a.patientId === myPatient.id) : [];
  const myPayments = myPatient ? payments.filter(p => p.patientId === myPatient.id) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Greeting & Patient Card */}
      <div className="bg-gradient-to-r from-white via-white to-blue-50/40 dark:from-[#121214] dark:to-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-[#1D5BD8] text-white font-bold flex items-center justify-center text-lg ring-2 ring-white dark:ring-zinc-800 shadow-xs">
            {myPatient?.name ? myPatient.name.charAt(0) : 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {myPatient?.name || 'Patient profile'}
              </h1>
              <span className="text-xs bg-blue-50 dark:bg-zinc-800 text-[#1D5BD8] dark:text-[#93C5FD] font-semibold px-2.5 py-0.5 rounded-md border border-blue-200/80 dark:border-zinc-700 tabular-nums">
                MRN: {myPatient?.mrn || 'Not assigned'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {myPatient?.phone ? formatPhone(myPatient.phone) : 'Contact details unavailable'}
              {myPatient?.age ? ` · ${myPatient.age} yrs` : ''}
              {myPatient?.gender ? ` · ${myPatient.gender}` : ''}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onNavigate('/dashboard/appointments')}
        >
          Book Appointment
        </Button>
      </div>

      {/* 2. LIVE QUEUE TICKET TRACKER */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            Live Clinic Queue Status
          </div>
          <span className="text-xs text-slate-400">Your clinic</span>
        </div>

        {myTicket ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400">Your Assigned Ticket</span>
                <div className="text-4xl sm:text-5xl font-black text-white tabular-nums tracking-tight">
                  {myTicket.ticketNumber}
                </div>
                <div className="mt-1">
                  <StatusBadge status={myTicket.status} type="queue" />
                </div>
              </div>

              <div className="sm:text-right bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400 block">Queue Position</span>
                <div className="text-2xl font-bold text-emerald-400 tabular-nums">
                  {myTicket.status === 'in_consultation'
                    ? 'In Consultation Room'
                    : myTicket.status === 'called'
                    ? 'Entering Room Now'
                    : `#${myTicket.position || 1} in line`}
                </div>
                <span className="text-xs text-slate-300">
                  {myTicket.estimatedWaitMinutes
                    ? `Estimated wait: ~${myTicket.estimatedWaitMinutes} minutes`
                    : 'Wait estimate unavailable'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  Consulting Doctor: <strong className="text-white">{myTicket.doctorName}</strong>
                </span>
              </div>
              <div className="text-blue-300 font-semibold">
                {myTicket.roomNumber
                  ? <>Please wait in the lobby → Proceed to <strong>{myTicket.roomNumber}</strong></>
                  : 'Please wait in the clinic lobby'}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 text-xs space-y-2">
            <p>You do not currently have an active queue ticket today.</p>
            <p className="text-[11px] text-slate-500">
              When you arrive at the clinic, the receptionist will check you in and issue your ticket.
            </p>
          </div>
        )}
      </div>

      {/* 3. My Appointments & Past Visits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appointments */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Your Appointments</h3>
            <span className="text-xs text-slate-400 dark:text-zinc-500">{myAppointments.length} total</span>
          </div>

          <div className="space-y-2.5">
            {myAppointments.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500">No appointments scheduled.</p>
            ) : (
              myAppointments.map(a => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-900/60 hover:bg-blue-50/40 dark:hover:bg-zinc-800/70 hover:border-blue-200/80 dark:hover:border-zinc-700 transition-all text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {formatDateSafe(a.date)} at {formatTimeSafe(a.time)}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {a.doctorName} · {a.reason}
                    </div>
                  </div>
                  <StatusBadge status={a.status} type="appointment" />
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Payments / Receipts */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Payment Receipts</h3>
            <span className="text-xs text-slate-400 dark:text-zinc-500">{myPayments.length} recorded</span>
          </div>

          <div className="space-y-2.5">
            {myPayments.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500">No payment receipts found.</p>
            ) : (
              myPayments.map(p => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-900/60 hover:bg-blue-50/40 dark:hover:bg-zinc-800/70 hover:border-blue-200/80 dark:hover:border-zinc-700 transition-all text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {formatETB(p.amountETB)} ·{' '}
                      <span className="uppercase text-[#1D5BD8] dark:text-[#60A5FA] font-semibold">
                        {p.paymentMethod}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Receipt: {p.receiptNumber} · {formatDateSafe(p.date)}
                    </div>
                  </div>
                  <StatusBadge status={p.status} type="payment" />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
