import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Filter,
  Search,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  List,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Drawer } from '../../components/ui/Drawer';
import { Input, Select } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAppointmentsPage, useClinicData } from '../../lib/hooks/useClinic';
import { useToast } from '../../components/ui/Toast';
import { Appointment, AppointmentStatus } from '../../types';
import { formatTimeSafe, formatDateSafe, clinicDateInputValue } from '../../lib/utils';

export const AppointmentsPage: React.FC<{ onNavigate: (path: string) => void }> = ({
  onNavigate
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'day' | 'week'>('list');
  const [filterDoctor, setFilterDoctor] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = clinicDateInputValue();
  const { doctors, patients, createAppointment, updateAppointmentStatus } =
    useClinicData({ includeAppointmentList: false });
  const appointmentsQuery = useAppointmentsPage({
    doctorId: filterDoctor === 'all' ? undefined : filterDoctor,
    status: filterStatus === 'all' ? undefined : filterStatus,
    search: searchQuery,
  }, currentPage);
  const appointments = appointmentsQuery.data?.data || [];
  const { success, error } = useToast();

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: today,
    time: '10:00',
    type: 'general_consultation' as Appointment['type'],
    reason: '',
    notes: ''
  });

  // Doctor conflict detector
  const conflictAppointment = appointments.find(
    a =>
      a.doctorId === formData.doctorId &&
      a.date === formData.date &&
      a.time === formData.time &&
      a.status !== 'cancelled'
  );

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId) {
      error('Please select both patient and physician.');
      return;
    }

    if (conflictAppointment) {
      error(
        `Scheduling conflict: Doctor already has an appointment with ${conflictAppointment.patientName} at ${formData.time}.`
      );
      return;
    }

    const patient = patients.find(p => p.id === formData.patientId);
    const doctor = doctors.find(d => d.id === formData.doctorId);
    if (!patient || !doctor) return;

    setIsSubmitting(true);
    try {
    await createAppointment({
      patientId: patient.id,
      patientName: patient.name,
      patientPhone: patient.phone,
      doctorId: doctor.id,
      doctorName: doctor.name,
      department: doctor.department,
      date: formData.date,
      time: formData.time,
      durationMinutes: 20,
      status: 'scheduled',
      type: formData.type,
      reason: formData.reason,
      notes: formData.notes
    });

    success(`Appointment scheduled for ${patient.name} on ${formData.date} at ${formData.time}!`);
    setIsDrawerOpen(false);
    setFormData({
      patientId: '',
      doctorId: '',
      date: today,
      time: '10:00',
      type: 'general_consultation',
      reason: '',
      notes: ''
    });
    } catch (createError) {
      error(createError instanceof Error ? createError.message : 'Could not create appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filterDoctor !== 'all' && apt.doctorId !== filterDoctor) return false;
    if (filterStatus !== 'all' && apt.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        apt.patientName.toLowerCase().includes(q) ||
        apt.patientPhone.includes(q) ||
        apt.doctorName.toLowerCase().includes(q) ||
        apt.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {appointmentsQuery.isLoading && <p role="status" className="text-sm text-slate-500">Loading appointments…</p>}
      {appointmentsQuery.error instanceof Error && <p role="alert" className="text-sm text-red-600">{appointmentsQuery.error.message}</p>}
      {/* 1. Header & Controls */}
      <div className="bg-gradient-to-r from-white via-white to-blue-50/40 dark:from-[#121214] dark:to-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Appointment Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Schedule consultations, manage slot conflicts, and direct check-ins
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View switcher */}
          <div className="flex items-center bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-700">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Day Slots
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Week
            </button>
          </div>

          <Button
            size="md"
            variant="primary"
            onClick={() => setIsDrawerOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Appointment
          </Button>
        </div>
      </div>

      {/* 2. Filters bar */}
      <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search patient, doctor, or reason..."
            leftIcon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500 dark:text-zinc-400 font-medium">Doctor:</label>
          <select
            value={filterDoctor}
            onChange={e => { setFilterDoctor(e.target.value); setCurrentPage(1); }}
            className="rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="all" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">All Doctors</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id} className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500 dark:text-zinc-400 font-medium">Status:</label>
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="all" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">All Statuses</option>
            <option value="scheduled" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">Scheduled</option>
            <option value="confirmed" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">Confirmed</option>
            <option value="checked_in" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">Checked In</option>
            <option value="in_consultation" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">In Consultation</option>
            <option value="completed" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">Completed</option>
            <option value="cancelled" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">Cancelled</option>
          </select>
        </div>
      </div>

      {/* 3. Main View Render */}
      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-[#121214] rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] dark:bg-zinc-900/60 border-b border-slate-200/80 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Doctor & Suite</th>
                  <th className="py-3.5 px-4">Consultation Type</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      No appointments matching the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map(apt => (
                    <tr key={apt.id} className="hover:bg-blue-50/40 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {formatTimeSafe(apt.time)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                          {formatDateSafe(apt.date)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{apt.patientName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">{apt.patientPhone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-zinc-200">{apt.doctorName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">{apt.department}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[11px]">
                          {apt.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-300 max-w-xs truncate">{apt.reason}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={apt.status} type="appointment" />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {apt.status === 'scheduled' || apt.status === 'confirmed' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onNavigate(`/dashboard/check-in?appointmentId=${apt.id}`)}
                          >
                            Check In
                          </Button>
                        ) : null}
                        {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              updateAppointmentStatus({ id: apt.id, status: 'cancelled' });
                              success('Appointment cancelled');
                            }}
                            className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium px-2 py-1 cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* DAY / WEEK TIME SLOTS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppointments.map(apt => (
            <Card key={apt.id} hoverEffect className="space-y-3">
              <div className="flex items-start justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatTimeSafe(apt.time)}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-zinc-400">· {formatDateSafe(apt.date)}</span>
                </div>
                <StatusBadge status={apt.status} type="appointment" />
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{apt.patientName}</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{apt.reason}</p>
              </div>

              <div className="text-xs text-slate-600 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-slate-900 dark:text-white font-medium">{apt.doctorName}</span>
                <span className="text-slate-400 dark:text-zinc-400">{apt.department.split('&')[0]}</span>
              </div>

              {apt.status === 'scheduled' || apt.status === 'confirmed' ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => onNavigate(`/dashboard/check-in?appointmentId=${apt.id}`)}
                >
                  Direct Check-In
                </Button>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      {appointmentsQuery.data?.meta && (
        <div className="flex items-center justify-between px-1 py-2 text-xs">
          <span className="text-slate-500">
            Page {appointmentsQuery.data.meta.page} of {appointmentsQuery.data.meta.totalPages} · {appointmentsQuery.data.meta.total} appointments
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={!appointmentsQuery.data.meta.hasPreviousPage} onClick={() => setCurrentPage(page => page - 1)}>Previous</Button>
            <Button size="sm" variant="outline" disabled={!appointmentsQuery.data.meta.hasNextPage} onClick={() => setCurrentPage(page => page + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* 4. BOOK APPOINTMENT DRAWER */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Schedule New Appointment"
        description="Select patient, doctor, and consultation slot. Conflict detection will alert if slot is occupied."
        width="lg"
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <Select
            label="Patient"
            required
            value={formData.patientId}
            onChange={e => setFormData({ ...formData, patientId: e.target.value })}
          >
            <option value="">Select registered patient...</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.mrn}) — {p.phone}
              </option>
            ))}
          </Select>

          <Select
            label="Consulting Doctor"
            required
            value={formData.doctorId}
            onChange={e => setFormData({ ...formData, doctorId: e.target.value })}
          >
            <option value="">Select doctor...</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.roomNumber} ({d.specialization.split('&')[0]})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              required
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
            />
            <Input
              label="Time Slot"
              type="time"
              required
              value={formData.time}
              onChange={e => setFormData({ ...formData, time: e.target.value })}
            />
          </div>

          {/* Conflict warning banner */}
          {conflictAppointment && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong>Slot Conflict Detected:</strong> {conflictAppointment.doctorName} is
                already scheduled for <strong>{conflictAppointment.patientName}</strong> at{' '}
                {formData.time}. Please select an alternative time.
              </div>
            </div>
          )}

          <Select
            label="Consultation Type"
            value={formData.type}
            onChange={e =>
              setFormData({ ...formData, type: e.target.value as Appointment['type'] })
            }
          >
            <option value="general_consultation">General Consultation</option>
            <option value="follow_up">Follow-Up Review</option>
            <option value="specialist_review">Specialist Review</option>
            <option value="preventive_check">Preventive Check</option>
          </Select>

          <Input
            label="Primary Reason / Chief Complaint"
            required
            placeholder="e.g. Hypertension medication review, migraine..."
            value={formData.reason}
            onChange={e => setFormData({ ...formData, reason: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-200">Clinical / Front-Desk Notes</label>
            <textarea
              rows={2}
              placeholder="Any preparatory instructions or patient notes..."
              className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-[#1D5BD8] focus:outline-none focus:ring-2 focus:ring-[#1D5BD8]/20 transition-all"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!!conflictAppointment || isSubmitting}
            >
              {isSubmitting ? 'Scheduling…' : 'Confirm Appointment'}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
