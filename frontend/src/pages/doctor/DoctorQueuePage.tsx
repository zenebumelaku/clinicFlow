import React, { useState } from 'react';
import {
  Clock,
  Play,
  CheckCircle2,
  SkipForward,
  Volume2,
  Users,
  Search,
  Filter,
  ArrowRight,
  MapPin,
  Check,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useClinicData } from '../../lib/hooks/useClinic';
import { authService } from '../../lib/services/authService';
import { useToast } from '../../components/ui/Toast';
import { formatTimeSafe } from '../../lib/utils';
import { QueueItem, QueueStatus } from '../../types';

interface DoctorQueuePageProps {
  onNavigate: (path: string) => void;
}

export const DoctorQueuePage: React.FC<DoctorQueuePageProps> = ({ onNavigate }) => {
  const { doctors, queue, updateQueueStatus, callNextPatient } = useClinicData();
  const { success, error, info } = useToast();
  const currentUser = authService.getUser();
  const myDoctor = doctors.find(d => d.userId === currentUser?.id) || doctors[0];

  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting' | 'called' | 'completed'>('all');
  const [search, setSearch] = useState('');

  const myQueue = myDoctor ? queue.filter(q => !q.doctorId || q.doctorId === myDoctor.id) : queue;
  const waitingPatients = myQueue.filter(q => q.status === 'waiting');
  const calledPatients = myQueue.filter(q => q.status === 'called');
  const inConsultationPatient = myQueue.find(q => q.status === 'in_consultation');
  const completedToday = myQueue.filter(q => q.status === 'completed');

  const filteredQueue = myQueue
    .filter(item => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        return (
          item.patientName.toLowerCase().includes(query) ||
          item.ticketNumber.toLowerCase().includes(query) ||
          item.patientPhone.includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const rank: Record<QueueStatus, number> = {
        in_consultation: 0,
        called: 1,
        waiting: 2,
        completed: 3,
        skipped: 4,
      };
      return rank[a.status] - rank[b.status];
    });

  // Sound chime
  const playChime = (ticket: string) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.65);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.65);
    } catch {
      // AudioContext fallback
    }
    if ('speechSynthesis' in window) {
      try {
        const msg = new SpeechSynthesisUtterance(`Ticket ${ticket.replace('#', '')}, please enter ${myDoctor?.roomNumber || 'the consultation room'}`);
        msg.rate = 0.95;
        window.speechSynthesis.speak(msg);
      } catch {
        // Speech synth fallback
      }
    }
  };

  const handleCallNext = async () => {
    try {
      const called = await callNextPatient(myDoctor?.id);
      if (called) {
        playChime(called.ticketNumber);
        success(`Called ${called.patientName} (${called.ticketNumber}) to ${myDoctor?.roomNumber || 'your room'}`);
      } else {
        info('No waiting patients in queue for your desk.');
      }
    } catch (err) {
      error(err instanceof Error ? err.message : 'Could not call patient');
    }
  };

  const handleStatusChange = async (id: string, status: QueueStatus, ticket: string, patientName: string) => {
    try {
      await updateQueueStatus({ id, status });
      if (status === 'called') {
        playChime(ticket);
        success(`Ticket ${ticket} called into ${myDoctor?.roomNumber || 'desk'}`);
      } else if (status === 'in_consultation') {
        success(`Consultation started for ${patientName}`);
      } else if (status === 'completed') {
        success(`Consultation completed for ${patientName}`);
      } else {
        info(`Ticket ${ticket} marked as ${status}`);
      }
    } catch (err) {
      error(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/60 via-white to-white dark:from-emerald-950/20 dark:via-[#121214] dark:to-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Consultation Queue · {myDoctor?.name || 'Doctor Workspace'}
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            {myDoctor?.specialization} · Assigned to {myDoctor?.roomNumber || 'Room 102'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleCallNext}
            leftIcon={<Volume2 className="h-4 w-4" />}
          >
            Call Next Patient
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate('/doctor/overview')}
          >
            Consultation Desk
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-[#121214]">
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Waiting in Lobby</p>
          <p className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400">{waitingPatients.length}</p>
          <p className="mt-1 text-[11px] text-slate-400">Patients in line</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-[#121214]">
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Called / Entering</p>
          <p className="mt-2 text-3xl font-black text-blue-600 dark:text-blue-400">{calledPatients.length}</p>
          <p className="mt-1 text-[11px] text-slate-400">Announced to room</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-[#121214]">
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">In Consultation</p>
          <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {inConsultationPatient ? 1 : 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {inConsultationPatient ? inConsultationPatient.ticketNumber : 'Desk ready'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-[#121214]">
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Completed Today</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{completedToday.length}</p>
          <p className="mt-1 text-[11px] text-slate-400">Visits concluded</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {(['all', 'waiting', 'called', 'completed'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-slate-900'
                }`}
              >
                {tab} ({tab === 'all' ? myQueue.length : myQueue.filter(q => q.status === tab).length})
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient or ticket..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Queue Table / List */}
        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
          {filteredQueue.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500">
              No queue tickets found for the selected view.
            </div>
          ) : (
            filteredQueue.map(item => (
              <div
                key={item.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 px-2 rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base font-black text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 px-2.5 py-1 rounded-lg font-mono">
                    {item.ticketNumber}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{item.patientName}</span>
                      <StatusBadge status={item.priority} type="priority" />
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-3">
                      <span>Tel: {item.patientPhone}</span>
                      <span>•</span>
                      <span>Checked in: {formatTimeSafe(item.checkInTime)}</span>
                      {item.estimatedWaitMinutes > 0 && item.status === 'waiting' && (
                        <>
                          <span>•</span>
                          <span>Est. wait: ~{item.estimatedWaitMinutes}m</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <StatusBadge status={item.status} type="queue" />

                  {item.status === 'waiting' && (
                    <Button
                      size="sm"
                      variant="primary"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleStatusChange(item.id, 'called', item.ticketNumber, item.patientName)}
                      leftIcon={<Volume2 className="h-3.5 w-3.5" />}
                    >
                      Call to Desk
                    </Button>
                  )}

                  {item.status === 'called' && (
                    <Button
                      size="sm"
                      variant="primary"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleStatusChange(item.id, 'in_consultation', item.ticketNumber, item.patientName)}
                      leftIcon={<Play className="h-3.5 w-3.5" />}
                    >
                      Start Consult
                    </Button>
                  )}

                  {item.status === 'in_consultation' && (
                    <Button
                      size="sm"
                      variant="primary"
                      className="bg-emerald-700 hover:bg-emerald-800 text-white"
                      onClick={() => handleStatusChange(item.id, 'completed', item.ticketNumber, item.patientName)}
                      leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    >
                      Complete
                    </Button>
                  )}

                  {(item.status === 'waiting' || item.status === 'called') && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(item.id, 'skipped', item.ticketNumber, item.patientName)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition"
                      title="Skip ticket"
                    >
                      <SkipForward className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
