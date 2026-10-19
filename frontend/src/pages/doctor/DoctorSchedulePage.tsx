import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  User,
  Phone,
  Search,
  Filter,
  CheckCircle2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAppointmentsPage, useClinicData } from '../../lib/hooks/useClinic';
import { authService } from '../../lib/services/authService';
import { formatDateSafe, formatTimeSafe, clinicDateInputValue } from '../../lib/utils';
import { useToast } from '../../components/ui/Toast';

interface DoctorSchedulePageProps {
  onNavigate: (path: string) => void;
}

export const DoctorSchedulePage: React.FC<DoctorSchedulePageProps> = ({ onNavigate }) => {
  const { doctors, updateAppointmentStatus } = useClinicData({ includeAppointmentList: false });
  const { success, error } = useToast();
  const currentUser = authService.getUser();
  const myDoctor = doctors.find(d => d.userId === currentUser?.id) || doctors[0];

  const today = clinicDateInputValue();
  const [selectedDate, setSelectedDate] = useState(today);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const appointmentsQuery = useAppointmentsPage(
    {
      doctorId: myDoctor?.id,
      status: filterStatus === 'all' ? undefined : filterStatus,
      search: search.trim() || undefined,
    },
    page,
    Boolean(myDoctor)
  );

  const appointments = appointmentsQuery.data?.data || [];
  const meta = appointmentsQuery.data?.meta;

  const handleStatusUpdate = async (id: string, status: any, patientName: string) => {
    try {
      await updateAppointmentStatus({ id, status });
      success(`Appointment status updated for ${patientName}`);
    } catch (err) {
      error(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/60 via-white to-white dark:from-blue-950/20 dark:via-[#121214] dark:to-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Consultation Schedule · {myDoctor?.name || 'Doctor Workspace'}
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            {myDoctor?.specialization} · Consultation Suite ({myDoctor?.roomNumber || 'Room 102'})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => onNavigate('/doctor/overview')}
          >
            Back to Consultation Desk
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {['all', 'scheduled', 'confirmed', 'checked_in', 'completed', 'cancelled'].map(st => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setFilterStatus(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-slate-900'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Schedule List */}
        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
          {appointmentsQuery.isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading schedule...</div>
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500">
              No consultations found for this filter.
            </div>
          ) : (
            appointments.map(apt => (
              <div
                key={apt.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 px-2 rounded-xl transition"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] uppercase font-bold">Time</span>
                    <span className="text-xs font-black">{formatTimeSafe(apt.time)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{apt.patientName}</p>
                      <StatusBadge status={apt.status} type="appointment" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      Date: {formatDateSafe(apt.date)} · Tel: {apt.patientPhone || '—'}
                    </p>
                    {apt.reason && (
                      <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1 italic">
                        "{apt.reason}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {apt.status === 'scheduled' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(apt.id, 'confirmed', apt.patientName)}
                    >
                      Confirm Booking
                    </Button>
                  )}
                  {apt.status === 'confirmed' && (
                    <Button
                      size="sm"
                      variant="primary"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => onNavigate('/doctor/overview')}
                    >
                      Go to Desk
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination controls */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-500">
            <span>Page {meta.page} of {meta.totalPages} ({meta.total} appointments)</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= meta.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
