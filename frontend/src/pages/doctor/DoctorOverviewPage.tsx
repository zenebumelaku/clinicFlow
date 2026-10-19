import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useClinicData } from '../../lib/hooks/useClinic';
import { authService } from '../../lib/services/authService';
import { useToast } from '../../components/ui/Toast';
import { formatTimeSafe, clinicDateInputValue } from '../../lib/utils';
import { DoctorAvailability } from '../../types';

export const DoctorOverviewPage: React.FC<{ onNavigate: (path: string) => void }> = ({
  onNavigate
}) => {
  const { doctors, queue, appointments, updateQueueStatus, updateDoctorAvailability } =
    useClinicData();
  const { success, error } = useToast();
  const currentUser = authService.getUser();

  const myDoctor = doctors.find(doctor => doctor.userId === currentUser?.id) || doctors[0];
  const today = clinicDateInputValue();

  const [clinicalNotes, setClinicalNotes] = useState('');
  const [prescription, setPrescription] = useState('');

  const myQueue = myDoctor ? queue.filter(q => q.doctorId === myDoctor.id) : [];
  const myWaiting = myQueue.filter(q => q.status === 'waiting');
  const myCalled = myQueue.filter(q => q.status === 'called');
  const myInConsultation = myQueue.find(q => q.status === 'in_consultation');
  const myCompletedToday = myQueue.filter(q => q.status === 'completed');

  // Consultation elapsed timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (myInConsultation) {
      timer = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      setSecondsElapsed(0);
    }
    return () => clearInterval(timer);
  }, [myInConsultation]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleStartConsultation = async (id: string, ticket: string, patientName: string) => {
    try {
      await updateQueueStatus({ id, status: 'in_consultation' });
      success(`Consultation started for ${patientName} (${ticket})`);
    } catch (actionError) {
      error(actionError instanceof Error ? actionError.message : 'Could not start consultation');
    }
  };

  const handleCompleteConsultation = async (id: string, ticket: string, patientName: string) => {
    try {
      await updateQueueStatus({ id, status: 'completed' });
      success(`Consultation completed for ${patientName} (${ticket})`);
    } catch (actionError) {
      error(actionError instanceof Error ? actionError.message : 'Could not complete consultation');
    }
  };

  if (!myDoctor) {
    return (
      <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        No doctor profile is linked to this signed-in account. Contact a clinic administrator.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-white via-white to-blue-50/40 dark:from-[#121214] dark:to-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          {myDoctor.avatarUrl ? (
            <img
              src={myDoctor.avatarUrl}
              alt={myDoctor.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-blue-600 ring-2 ring-white dark:ring-zinc-800 shrink-0 shadow-xs"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xl shrink-0">
              {myDoctor.name.replace(/^Dr\.\s*/, '').charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{myDoctor.name}</h1>
              <span className="text-xs bg-blue-100 dark:bg-[#1D5BD8]/20 text-blue-700 dark:text-[#93C5FD] font-bold px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-[#1D5BD8]/30">
                {myDoctor.roomNumber || 'Room not assigned'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {myDoctor.specialization} · {myDoctor.department}
            </p>
          </div>
        </div>

        {/* Doctor Status controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-700 text-xs">
            {(['available', 'busy', 'off_duty'] as DoctorAvailability[]).map(st => (
              <button
                key={st}
                onClick={() => updateDoctorAvailability({ id: myDoctor.id, availability: st })}
                className={`px-3 py-1 font-semibold rounded-lg transition-colors cursor-pointer capitalize ${
                  myDoctor.availability === st
                    ? st === 'available'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : st === 'busy'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-zinc-700 dark:bg-zinc-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            Reception calls the next patient
          </span>
        </div>
      </div>

      {/* 2. ACTIVE CONSULTATION SUITE PANEL */}
      <Card className="border-2 border-blue-500/40 bg-gradient-to-r from-blue-50/40 via-white to-white dark:from-[#1D5BD8]/10 dark:via-[#121214] dark:to-[#121214]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
              Active Consultation Desk ({myDoctor.roomNumber})
            </span>
            {myInConsultation ? (
              <div className="mt-1">
                <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-blue-700 dark:text-[#93C5FD] bg-blue-100 dark:bg-[#1D5BD8]/30 px-2 py-0.5 rounded text-lg tabular-nums">
                    {myInConsultation.ticketNumber}
                  </span>
                  <span>{myInConsultation.patientName}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                  Phone: {myInConsultation.patientPhone} · Priority:{' '}
                  <StatusBadge status={myInConsultation.priority} type="priority" />
                </div>
              </div>
            ) : myCalled.length > 0 ? (
              <div className="mt-1">
                <div className="text-lg font-bold text-amber-700 dark:text-amber-400">
                  Patient Called: {myCalled[0].ticketNumber} — {myCalled[0].patientName}
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Patient entering consultation suite</p>
              </div>
            ) : (
              <div className="mt-1 text-slate-500 dark:text-zinc-400 text-sm italic">
                Desk ready for next patient.
              </div>
            )}
          </div>

          {/* Timer & Completion button / Call button */}
          {myInConsultation ? (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Duration</span>
                <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatTimer(secondsElapsed)}
                </div>
              </div>
              <Button
                size="lg"
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  handleCompleteConsultation(
                    myInConsultation.id,
                    myInConsultation.ticketNumber,
                    myInConsultation.patientName
                  );
                  setClinicalNotes('');
                  setPrescription('');
                }}
                leftIcon={<CheckCircle2 className="w-5 h-5" />}
              >
                Complete Consultation
              </Button>
            </div>
          ) : myCalled.length > 0 ? (
            <Button
              size="lg"
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() =>
                handleStartConsultation(
                  myCalled[0].id,
                  myCalled[0].ticketNumber,
                  myCalled[0].patientName
                )
              }
              leftIcon={<Play className="w-4 h-4" />}
            >
              Begin Consultation
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate('/doctor/queue')}
              leftIcon={<Play className="w-4 h-4" />}
            >
              View Waiting Queue ({myWaiting.length})
            </Button>
          )}
        </div>

        {/* Clinical notes and prescription writer when in consultation */}
        {myInConsultation && (
          <div className="mt-5 pt-4 border-t border-blue-200/60 dark:border-zinc-800 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                Clinical Diagnosis & Consultation Notes
              </label>
              <textarea
                rows={3}
                placeholder="Chief complaint, clinical findings, diagnosis..."
                value={clinicalNotes}
                onChange={e => setClinicalNotes(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                Prescriptions & Follow-up Instructions
              </label>
              <textarea
                rows={3}
                placeholder="Prescribed medications, dosage, follow-up instructions..."
                value={prescription}
                onChange={e => setPrescription(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        )}
      </Card>

      {/* 3. My Waiting Queue List & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Waiting queue for this doctor */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121214] rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Patients in Waiting Lobby ({myWaiting.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Ordered by arrival and triage priority</p>
            </div>
            <span className="text-xs text-slate-400 dark:text-zinc-500">
              {myDoctor.roomNumber ? `Suite ${myDoctor.roomNumber}` : 'Room not assigned'}
            </span>
          </div>

          <div className="space-y-2.5">
            {myWaiting.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500">
                All assigned patients have been seen!
              </div>
            ) : (
              myWaiting.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-900/60 hover:bg-blue-50/40 dark:hover:bg-zinc-800/70 hover:border-blue-200/80 dark:hover:border-zinc-700 transition-all flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-700 dark:text-[#93C5FD] bg-blue-50 dark:bg-[#1D5BD8]/20 px-2.5 py-0.5 rounded-md border border-blue-200/80 dark:border-[#1D5BD8]/30 tabular-nums">
                      {item.ticketNumber}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{item.patientName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Queue #{idx + 1} · Est. wait ~{item.estimatedWaitMinutes} min
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.priority} type="priority" />
                    <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                      Waiting for call
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Doctor's Today Appointments */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121214] rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Consultation Schedule</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Scheduled bookings today</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 dark:text-[#93C5FD] bg-blue-50 dark:bg-[#1D5BD8]/20 px-2 py-0.5 rounded">
              {appointments.filter(a => a.doctorId === myDoctor.id && a.date === today).length} booked
            </span>
          </div>

          <div className="space-y-2.5">
            {appointments
              .filter(a => a.doctorId === myDoctor.id && a.date === today)
              .map(apt => (
                <div
                  key={apt.id}
                  className="p-3 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-900/60 hover:bg-blue-50/40 dark:hover:bg-zinc-800/70 hover:border-blue-200/80 dark:hover:border-zinc-700 transition-all text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {formatTimeSafe(apt.time)} — {apt.patientName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">{apt.reason}</div>
                  </div>
                  <StatusBadge status={apt.status} type="appointment" />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
