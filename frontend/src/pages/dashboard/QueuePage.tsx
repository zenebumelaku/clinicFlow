import React, { useState } from 'react';
import {
  Clock,
  Volume2,
  Play,
  CheckCircle2,
  SkipForward,
  UserCheck,
  Phone,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Filter,
  Tv,
  X,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useClinicData } from '../../lib/hooks/useClinic';
import { useToast } from '../../components/ui/Toast';
import { QueueItem, QueueStatus } from '../../types';
import { formatTimeSafe } from '../../lib/utils';

export const QueuePage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { queue, doctors, clinicProfile, updateQueueStatus, callNextPatient, isLoading, errors } = useClinicData();
  const { success, info, error } = useToast();
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');
  const [lastAnnouncedTicket, setLastAnnouncedTicket] = useState<{
    ticket: string;
    room: string;
    patient: string;
    doctor: string;
  } | null>(null);
  const [isLobbyTotemOpen, setIsLobbyTotemOpen] = useState(false);

  // Audio tone simulation & voice announcement
  const playChimeAndVoice = (ticket: string, room: string) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.65);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.65);
    } catch {
      // AudioContext fallback
    }

    // Optional speech synthesis
    if ('speechSynthesis' in window) {
      try {
        const destination = room ? `, please proceed to ${room}` : '';
        const utterance = new SpeechSynthesisUtterance(`Ticket ${ticket.replace('#', '')}${destination}`);
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Speech synth fallback
      }
    }
  };

  const handleCallNext = async () => {
    const docId = selectedDoctorFilter === 'all' ? undefined : selectedDoctorFilter;
    try {
      const called = await callNextPatient(docId);
      if (called) {
        playChimeAndVoice(called.ticketNumber, called.roomNumber);
        setLastAnnouncedTicket({
          ticket: called.ticketNumber,
          room: called.roomNumber,
          patient: called.patientName,
          doctor: called.doctorName
        });
        success(
          `Ticket ${called.ticketNumber} (${called.patientName}) called${called.roomNumber ? ` to ${called.roomNumber}` : ''}.`,
          'Patient Announced'
        );
      } else {
        info('No waiting patients found for the selected filter.');
      }
    } catch (actionError) {
      error(actionError instanceof Error ? actionError.message : 'Could not call the next patient');
    }
  };

  const handleAction = async (id: string, status: QueueStatus, ticket: string, patientName: string, room = '') => {
    try {
      await updateQueueStatus({ id, status });
      if (status === 'called') {
        playChimeAndVoice(ticket, room);
        setLastAnnouncedTicket({
          ticket,
          room,
          patient: patientName,
          doctor: doctors.find(doctor => doctor.roomNumber === room)?.name || 'Assigned Physician'
        });
      }
      success(`${ticket} (${patientName}) moved to ${status.replace('_', ' ').toUpperCase()}`);
    } catch (actionError) {
      error(actionError instanceof Error ? actionError.message : 'Could not update queue ticket');
    }
  };

  const filteredQueue = queue.filter(item => {
    if (selectedDoctorFilter !== 'all' && item.doctorId !== selectedDoctorFilter) {
      return false;
    }
    return true;
  });

  const waitingList = filteredQueue.filter(q => q.status === 'waiting');
  const calledList = filteredQueue.filter(q => q.status === 'called');
  const inConsultationList = filteredQueue.filter(q => q.status === 'in_consultation');
  const completedList = filteredQueue.filter(q => q.status === 'completed');

  return (
    <div className="space-y-6">
      {isLoading && <p role="status" className="text-sm text-slate-500">Loading queue…</p>}
      {errors.map(message => <p role="alert" key={message} className="text-sm text-red-600">{message}</p>)}
      {/* 1. TOP HEADER & PROMINENT CALL NEXT ACTION */}
      <div className="bg-gradient-to-r from-white via-white to-blue-50/40 dark:from-[#121214] dark:to-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Today's Live Queue Board
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Real-time outpatient consultation sequencing · Audible chime & voice announcements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Doctor filter */}
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <select
              value={selectedDoctorFilter}
              onChange={e => setSelectedDoctorFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-700 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">All Consultation Suites</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                  {d.name}{d.roomNumber ? ` (${d.roomNumber})` : ''}
                </option>
              ))}
            </select>
          </div>

          <Button
            size="md"
            variant="outline"
            onClick={() => setIsLobbyTotemOpen(true)}
            leftIcon={<Tv className="w-4 h-4 text-[#1D5BD8]" />}
          >
            Lobby Totem View
          </Button>

          <Button
            size="md"
            variant="outline"
            onClick={() => onNavigate('/dashboard/check-in')}
            leftIcon={<UserCheck className="w-4 h-4 text-[#1D5BD8]" />}
          >
            Check In
          </Button>

          <Button
            size="md"
            variant="primary"
            onClick={handleCallNext}
            disabled={waitingList.length === 0}
            leftIcon={<Volume2 className="w-4 h-4 text-emerald-300" />}
            className="shadow-sm font-semibold"
          >
            Call Next Patient
          </Button>
        </div>
      </div>

      {/* 2. TOP METRICS STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#121214] p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Waiting in Lobby</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
            {waitingList.length}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
            {waitingList.filter(q => q.priority === 'urgent').length} urgent priority
          </div>
        </div>

        <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-xs bg-blue-50/50 dark:bg-blue-950/30">
          <div className="text-xs font-semibold text-blue-700 dark:text-blue-400">Called to Room</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-200 tabular-nums mt-1">
            {calledList.length}
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-300 mt-0.5">Proceeding to suite</div>
        </div>

        <div className="p-4 rounded-xl border border-cyan-200 dark:border-cyan-900/60 shadow-xs bg-cyan-50/50 dark:bg-cyan-950/30">
          <div className="text-xs font-semibold text-cyan-800 dark:text-cyan-400">In Consultation</div>
          <div className="text-2xl font-bold text-cyan-900 dark:text-cyan-200 tabular-nums mt-1">
            {inConsultationList.length}
          </div>
          <div className="text-[11px] text-cyan-700 dark:text-cyan-300 mt-0.5">Active with physician</div>
        </div>

        <div className="bg-white dark:bg-[#121214] p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Average Wait Time</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
            14 <span className="text-sm font-normal text-slate-500 dark:text-zinc-400">min</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Within 20m target</div>
        </div>
      </div>

      {/* 3. DYNAMIC SOUND ANNOUNCEMENT BANNER */}
      {lastAnnouncedTicket && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white flex items-center justify-between text-xs shadow-lg animate-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center font-bold shrink-0 animate-bounce">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">
                CALLING TICKET {lastAnnouncedTicket.ticket} → PLEASE PROCEED TO {lastAnnouncedTicket.room}
              </div>
              <div className="text-[11px] text-blue-200">
                Patient: {lastAnnouncedTicket.patient} · Consulting: {lastAnnouncedTicket.doctor}
              </div>
            </div>
          </div>
          <button
            onClick={() => setLastAnnouncedTicket(null)}
            className="p-1 rounded text-blue-200 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. THE 4 COLUMNS LIVE QUEUE BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* COLUMN 1: WAITING */}
        <div className="bg-[#F8FAFC]/90 dark:bg-zinc-900/60 rounded-2xl p-4 flex flex-col h-[650px] border border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-zinc-800 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                1. Waiting ({waitingList.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Lobby Area</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {waitingList.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400 dark:text-zinc-500 italic">
                No patients waiting
              </div>
            ) : (
              waitingList.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#121214] p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-xs transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-base font-extrabold text-blue-700 dark:text-[#93C5FD] bg-blue-50 dark:bg-[#1D5BD8]/20 px-2 py-0.5 rounded border border-blue-200/80 dark:border-[#1D5BD8]/30 tabular-nums">
                        {item.ticketNumber}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{item.patientName}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.patientPhone}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        Position #{index + 1}
                      </span>
                      <StatusBadge status={item.priority} type="priority" className="mt-1" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Doctor:</span>
                      <strong className="text-slate-800 dark:text-zinc-200">{item.doctorName}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Room:</span>
                      <strong className="text-slate-900 dark:text-white">{item.roomNumber || 'Not assigned'}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Wait Time:</span>
                      <span className="text-amber-700 dark:text-amber-400 font-semibold tabular-nums">
                        {item.estimatedWaitMinutes ? `~${item.estimatedWaitMinutes} mins` : 'Estimate unavailable'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleAction(item.id, 'called', item.ticketNumber, item.patientName, item.roomNumber)}
                      leftIcon={<Volume2 className="w-3.5 h-3.5" />}
                    >
                      Call
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAction(item.id, 'skipped', item.ticketNumber, item.patientName)}
                      leftIcon={<SkipForward className="w-3.5 h-3.5" />}
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: CALLED */}
        <div className="bg-blue-50/30 dark:bg-blue-950/20 rounded-2xl p-4 flex flex-col h-[650px] border border-blue-200/70 dark:border-blue-900/50">
          <div className="flex items-center justify-between pb-3 border-b border-blue-200/80 dark:border-blue-900/50 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                2. Called ({calledList.length})
              </h2>
            </div>
            <span className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">Entering Suite</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {calledList.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-blue-400 dark:text-blue-500 italic">
                No active call announcements
              </div>
            ) : (
              calledList.map(item => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#121214] p-3.5 rounded-xl border border-blue-300/80 dark:border-blue-800 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-3 ring-1 ring-blue-500/15"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-lg font-black text-blue-700 dark:text-[#93C5FD] bg-blue-100/80 dark:bg-[#1D5BD8]/30 px-2 py-0.5 rounded border border-blue-300 dark:border-[#1D5BD8]/40 tabular-nums">
                        {item.ticketNumber}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{item.patientName}</h4>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                        → Please proceed to {item.roomNumber || 'the consultation area'}
                      </div>
                    </div>
                    <StatusBadge status={item.status} type="queue" />
                  </div>

                  <div className="text-xs text-slate-600 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <span>Physician:</span>
                    <strong className="text-slate-900 dark:text-white">{item.doctorName}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleAction(item.id, 'in_consultation', item.ticketNumber, item.patientName)}
                      leftIcon={<Play className="w-3.5 h-3.5" />}
                    >
                      Start Visit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        playChimeAndVoice(item.ticketNumber, item.roomNumber);
                        setLastAnnouncedTicket({
                          ticket: item.ticketNumber,
                          room: item.roomNumber,
                          patient: item.patientName,
                          doctor: item.doctorName
                        });
                        success(`Recall announcement broadcasted for ${item.ticketNumber}`);
                      }}
                      leftIcon={<Volume2 className="w-3.5 h-3.5" />}
                    >
                      Re-Call
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 3: IN CONSULTATION */}
        <div className="bg-cyan-50/30 dark:bg-cyan-950/20 rounded-2xl p-4 flex flex-col h-[650px] border border-cyan-200/70 dark:border-cyan-900/50">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-200/80 dark:border-cyan-900/50 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-900 dark:text-cyan-300">
                3. In Consultation ({inConsultationList.length})
              </h2>
            </div>
            <span className="text-[11px] text-cyan-700 dark:text-cyan-400 font-medium">Doctor Office</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {inConsultationList.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-cyan-400 dark:text-cyan-500 italic">
                No visits in progress
              </div>
            ) : (
              inConsultationList.map(item => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#121214] p-3.5 rounded-xl border border-cyan-200/80 dark:border-cyan-800 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-base font-extrabold text-cyan-900 dark:text-cyan-200 bg-cyan-50 dark:bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800 tabular-nums">
                        {item.ticketNumber}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{item.patientName}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">{item.department}</p>
                    </div>
                    <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800">
                      {item.roomNumber || 'Not assigned'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-1">
                    <div className="flex justify-between">
                      <span>Doctor:</span>
                      <strong className="text-slate-900 dark:text-white">{item.doctorName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Started At:</span>
                      <span className="tabular-nums font-medium text-slate-700 dark:text-zinc-300">
                        {item.startTime ? formatTimeSafe(item.startTime) : 'Just now'}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleAction(item.id, 'completed', item.ticketNumber, item.patientName)}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Complete Visit
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 4: COMPLETED */}
        <div className="bg-[#F8FAFC]/90 dark:bg-zinc-900/60 rounded-2xl p-4 flex flex-col h-[650px] border border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-zinc-800 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                4. Completed Today ({completedList.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Discharged</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {completedList.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400 dark:text-zinc-500 italic">
                No completed visits yet today
              </div>
            ) : (
              completedList.map(item => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#121214] p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] hover:border-emerald-300 dark:hover:border-emerald-600 transition-all space-y-2 opacity-95"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 tabular-nums">
                        {item.ticketNumber}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">{item.patientName}</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 pt-1 border-t border-slate-100 dark:border-zinc-800">
                    <span>{item.doctorName}</span>
                    <button
                      onClick={() => onNavigate(`/dashboard/payments?patientName=${encodeURIComponent(item.patientName)}`)}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                    >
                      Billing Receipt →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. FULLSCREEN LOBBY TOTEM DISPLAY MODAL */}
      {isLobbyTotemOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col p-6 sm:p-10 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div>
              <div className="text-xs font-bold tracking-widest uppercase text-blue-400">
                {clinicProfile?.name || 'Clinic'} · Waiting Room Totem
              </div>
              <h1 className="text-2xl font-bold text-white mt-1">
                Live Outpatient Queue Board
              </h1>
            </div>
            <button
              onClick={() => setIsLobbyTotemOpen(false)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Active Call Big Screen Banner */}
          <div className="my-6 p-8 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border-2 border-blue-500/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs uppercase font-bold text-blue-300 tracking-widest block">
                NOW SERVING
              </span>
              <div className="text-6xl font-black text-white tabular-nums tracking-tight mt-1">
                {calledList[0]?.ticketNumber || '#A102'}
              </div>
              <div className="text-lg font-semibold text-slate-200 mt-2">
                Patient: {calledList[0]?.patientName || 'Meron Bekele'}
              </div>
            </div>

            <div className="text-right bg-slate-950/80 p-6 rounded-xl border border-slate-800">
              <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider block">
                DESTINATION SUITE
              </span>
              <div className="text-4xl font-extrabold text-white mt-1">
                {calledList[0]?.roomNumber || 'Room not assigned'}
              </div>
              <div className="text-sm text-slate-400 mt-1">
                {calledList[0]?.doctorName || 'Dr. Hana Tesfaye'} · Adult Care
              </div>
            </div>
          </div>

          {/* Upcoming next in line */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
            <div className="bg-slate-900/90 rounded-xl p-5 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Next in Line
              </h3>
              <div className="space-y-2">
                {waitingList.slice(0, 4).map((w, idx) => (
                  <div key={w.id} className="p-3 rounded-lg bg-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-blue-400">{w.ticketNumber}</span>
                      <div className="text-xs text-slate-300">{w.patientName}</div>
                    </div>
                    <span className="text-xs text-slate-400">Position #{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/90 rounded-xl p-5 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Consultations
              </h3>
              <div className="space-y-2">
                {inConsultationList.map(c => (
                  <div key={c.id} className="p-3 rounded-lg bg-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold text-cyan-400">{c.ticketNumber}</span>
                      <div className="text-xs text-slate-300">{c.doctorName}</div>
                    </div>
                    <span className="text-xs text-cyan-300 font-semibold">{c.roomNumber}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/90 rounded-xl p-5 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Lobby Instructions
              </h3>
              <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
                <p>• Please watch the screen for your ticket number announcement.</p>
                <p>• When your number chimes, proceed immediately to the assigned room.</p>
                <p>• Urgent triage cases are prioritized automatically.</p>
                <p>• Digital fee settlement is available via Telebirr at the front counter.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
