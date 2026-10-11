import React from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  UserPlus,
  CalendarPlus,
  ArrowUpRight,
  Stethoscope,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { format } from 'date-fns';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useClinicData, useClinicReports } from '../../lib/hooks/useClinic';
import { authService } from '../../lib/services/authService';
import { useTheme } from '../../lib/theme';
import { formatETB, formatTimeSafe, clinicDateInputValue } from '../../lib/utils';
import { Role } from '../../types';

interface OverviewPageProps {
  onNavigate: (path: string) => void;
  role: Role;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate, role }) => {
  const { doctors, appointments, queue, stats, clinicProfile, callNextPatient } = useClinicData();
  const reportsQuery = useClinicReports('today');
  const { isDark } = useTheme();

  const waitingQueue = queue.filter(q => q.status === 'waiting');
  const inConsultationQueue = queue.filter(q => q.status === 'in_consultation');
  const today = clinicDateInputValue();
  const todayAppointments = appointments.filter(appointment => appointment.date === today);
  const currentUser = authService.getUser();
  const revenueTrendData = (reportsQuery.data?.revenue || []).map(point => ({
    time: point.date,
    revenue: point.revenue,
  }));
  const waitDistributionData = (reportsQuery.data?.waitingTime || []).map(point => ({
    date: point.date,
    wait: point.averageWaitingTimeMinutes,
  })).filter(point => point.wait !== null);
  const clinicName = clinicProfile?.name || 'Clinic';
  const greetingName = role === 'doctor'
    ? `Dr. ${currentUser?.firstName || ''}`.trim()
    : currentUser?.firstName || 'Clinic Operations';
  const todayFormatted = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <div className="space-y-6">
      {/* 1. TOP GREETING & QUICK ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-white via-white to-blue-50/40 dark:from-[#121214] dark:to-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
        <div>
          <div className="text-xs font-semibold text-blue-600 dark:text-[#60A5FA] uppercase tracking-wider">
            {clinicName}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Welcome, {greetingName}
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {todayFormatted}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('/dashboard/check-in')}
            leftIcon={<UserPlus className="w-4 h-4 text-[#1D5BD8]" />}
          >
            Check-In Patient
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('/dashboard/appointments')}
            leftIcon={<CalendarPlus className="w-4 h-4" />}
          >
            New Appointment
          </Button>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <Card hoverEffect className="cursor-pointer" onClick={() => onNavigate('/dashboard/appointments')}>
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Appointments Today</span>
            <div className="w-8 h-8 rounded-lg bg-[#EFF4FF] dark:bg-[#1D5BD8]/20 text-[#1D5BD8] dark:text-[#60A5FA] flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {stats.appointmentsToday}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Scheduled for today</p>
        </Card>

        {/* KPI 2 */}
        <Card hoverEffect className="cursor-pointer" onClick={() => onNavigate('/dashboard/queue')}>
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Patients Waiting</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {waitingQueue.length}
            </span>
            {waitingQueue.some(q => q.priority === 'urgent') && (
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-0.5 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded">
                <AlertCircle className="w-3 h-3" /> {waitingQueue.filter(q => q.priority === 'urgent').length} urgent
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Average wait: {stats.averageWaitMinutes} min</p>
        </Card>

        {/* KPI 3 */}
        <Card hoverEffect className="cursor-pointer" onClick={() => onNavigate('/dashboard/queue')}>
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Completed Visits</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {stats.completedVisits}
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {stats.completedPercent}% of total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {queue.filter(q => q.status === 'in_consultation' || q.status === 'called').length} called or in consultation
          </p>
        </Card>

        {/* KPI 4 */}
        <Card hoverEffect className="cursor-pointer" onClick={() => onNavigate('/dashboard/payments')}>
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Today's Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {formatETB(stats.todayRevenueETB)}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Completed payments today</p>
        </Card>
      </div>

      {/* 3. MIDDLE SECTION: LIVE QUEUE BOARD & DOCTOR AVAILABILITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Queue Active Panel */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121214] rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Waiting Room Queue
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Real-time patient order and room assignments</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate('/dashboard/queue')}
            >
              Full Queue Board
            </Button>
          </div>

          <div className="space-y-3">
            {/* Actively called / in consultation */}
            {inConsultationQueue.length > 0 && (
              <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-[#1D5BD8]/10 border border-blue-200/60 dark:border-[#1D5BD8]/30">
                <div className="text-[11px] font-semibold text-[#1D5BD8] dark:text-[#60A5FA] uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Currently in Consultation</span>
                  <span className="text-[#1D5BD8] dark:text-[#93C5FD]">Suite Active</span>
                </div>
                {inConsultationQueue.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-[#1D5BD8] dark:text-[#93C5FD] bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-blue-200 dark:border-zinc-700 tabular-nums shadow-2xs">
                        {item.ticketNumber}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">{item.patientName}</span>
                    </div>
                    <div className="text-slate-600 dark:text-zinc-400">
                      {item.doctorName} · <strong className="text-slate-900 dark:text-white">{item.roomNumber}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Waiting line preview */}
            <div className="space-y-2">
              {waitingQueue.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Waiting room is currently clear.
                </div>
              ) : (
                waitingQueue.slice(0, 4).map(item => (
                  <div key={item.id} className="p-2.5 rounded-xl border border-slate-200/60 dark:border-zinc-800/80 bg-[#F8FAFC]/80 dark:bg-zinc-900/60 hover:bg-blue-50/40 dark:hover:bg-zinc-800/60 transition-colors flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#1D5BD8] dark:text-[#93C5FD] bg-white dark:bg-[#1D5BD8]/20 px-2.5 py-1 rounded-md border border-blue-200/80 dark:border-[#1D5BD8]/40 tabular-nums shadow-2xs">
                        {item.ticketNumber}
                      </span>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{item.patientName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">{item.department}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={item.priority} type="priority" />
                      <div className="text-right">
                        <div className="font-medium text-slate-800 dark:text-zinc-200 tabular-nums">
                          ~{item.estimatedWaitMinutes} min
                        </div>
                        <div className="text-[10px] text-slate-400">estimated</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                {waitingQueue.length} patient{waitingQueue.length === 1 ? '' : 's'} waiting in lobby
              </span>
              <Button
                size="sm"
                variant="primary"
                onClick={() => callNextPatient()}
                disabled={waitingQueue.length === 0}
              >
                Call Next Patient
              </Button>
            </div>
          </div>
        </div>

        {/* Doctor Availability & Suites */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121214] rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-3.5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[#1D5BD8] dark:text-[#60A5FA]" />
                  Doctor Roster & Suites
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Today's active consultations</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onNavigate('/dashboard/doctors')}
              >
                Manage
              </Button>
            </div>

            <div className="space-y-2.5">
              {doctors.slice(0, 4).map(doc => (
                <div
                  key={doc.id}
                  className="p-3 rounded-xl border border-slate-200/70 dark:border-zinc-800/80 bg-[#F8FAFC] dark:bg-zinc-900/60 hover:bg-blue-50/50 dark:hover:bg-zinc-800/80 hover:border-blue-200/80 dark:hover:border-zinc-700 transition-all flex items-center justify-between text-xs shadow-2xs group"
                >
                  <div className="flex items-center gap-3">
                    {doc.avatarUrl ? (
                      <img
                        src={doc.avatarUrl}
                        alt={doc.name}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-zinc-800 border border-slate-200/80 dark:border-slate-700 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-[#1D5BD8]/30 text-[#1D5BD8] dark:text-[#93C5FD] font-bold flex items-center justify-center shrink-0 ring-2 ring-white dark:ring-zinc-800">
                        {doc.name.charAt(4)}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white group-hover:text-[#1D5BD8] dark:group-hover:text-[#60A5FA] transition-colors">{doc.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {doc.specialization.split('&')[0]}
                        {doc.roomNumber && <> · <span className="font-medium text-slate-700 dark:text-slate-300">{doc.roomNumber}</span></>}
                      </div>
                    </div>
                  </div>

                  <StatusBadge status={doc.availability} type="availability" />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Clinic hours not configured</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              {doctors.filter(doctor => doctor.availability === 'available').length} Available
            </span>
          </div>
        </div>
      </div>

      {/* 4. CHARTS: REVENUE PROGRESSION & WAITING TIMES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue progression chart */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Today's Revenue</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Completed payments reported for the clinic day</p>
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
              {formatETB(stats.todayRevenueETB)}
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D5BD8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1D5BD8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#e2e8f0'} opacity={0.8} />
                <XAxis dataKey="time" stroke={isDark ? '#a1a1aa' : '#71717a'} fontSize={11} tickLine={false} />
                <YAxis
                  stroke={isDark ? '#a1a1aa' : '#71717a'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => `${val / 1000}k`}
                />
                <Tooltip
                  formatter={(value: any) => [`${value} ETB`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    color: isDark ? '#f4f4f5' : '#0f172a',
                    borderRadius: '8px',
                    fontSize: '12px',
                    border: isDark ? '1px solid #27272a' : '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1D5BD8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wait time bar chart */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Average Wait Time</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Observed waiting time for today's consultations</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 dark:text-[#60A5FA] bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
              {stats.averageWaitMinutes ? `Avg: ${stats.averageWaitMinutes} min` : 'No completed wait data'}
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waitDistributionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#e2e8f0'} opacity={0.8} />
                <XAxis dataKey="date" stroke={isDark ? '#a1a1aa' : '#71717a'} fontSize={10} tickLine={false} />
                <YAxis stroke={isDark ? '#a1a1aa' : '#71717a'} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} minutes`, 'Wait Time']}
                  contentStyle={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    color: isDark ? '#f4f4f5' : '#0f172a',
                    borderRadius: '8px',
                    fontSize: '12px',
                    border: isDark ? '1px solid #27272a' : '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="wait" fill="#1D5BD8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. TODAY'S APPOINTMENT TIMELINE & RECENT PATIENTS */}
      <div className="bg-white dark:bg-[#121214] rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Today's Appointment Schedule</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Upcoming consultation visits and check-in status</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate('/dashboard/appointments')}
          >
            View All Schedule
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-medium">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Patient</th>
                <th className="py-2.5 px-3">Doctor</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {todayAppointments.slice(0, 6).map(apt => (
                <tr key={apt.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white tabular-nums">
                    {formatTimeSafe(apt.time)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 dark:text-white">{apt.patientName}</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">{apt.patientPhone}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-zinc-300 font-medium">{apt.doctorName}</td>
                  <td className="py-3 px-3 text-slate-500 dark:text-zinc-400">{apt.department}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-zinc-400 max-w-xs truncate">{apt.reason}</td>
                  <td className="py-3 px-3">
                    <StatusBadge status={apt.status} type="appointment" />
                  </td>
                  <td className="py-3 px-3 text-right">
                    {apt.status === 'confirmed' || apt.status === 'scheduled' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onNavigate(`/dashboard/check-in?appointmentId=${apt.id}`)}
                      >
                        Check In
                      </Button>
                    ) : (
                      <button
                        onClick={() => onNavigate('/dashboard/appointments')}
                        className="text-xs text-[#1D5BD8] dark:text-[#60A5FA] hover:text-[#1548B0] font-medium cursor-pointer"
                      >
                        Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {todayAppointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">No appointments scheduled for today.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
