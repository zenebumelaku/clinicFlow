import React, { useState } from 'react';
import {
  Search,
  UserCheck,
  CalendarDays,
  Printer,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Clock,
  Sparkles,
  Check
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useClinicData } from '../../lib/hooks/useClinic';
import { useToast } from '../../components/ui/Toast';
import { Patient, Appointment, QueueItem, PriorityLevel } from '../../types';
import { formatPhone, formatTimeSafe, clinicDateInputValue } from '../../lib/utils';

export const CheckInPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { patients, doctors, appointments, checkInPatient, isLoading, errors, clinicProfile } =
    useClinicData({ patientSearch: searchQuery });
  const { success, error } = useToast();
  const today = clinicDateInputValue();

  // Result state
  const [checkedInResult, setCheckedInResult] = useState<QueueItem | null>(null);

  // Filter patients based on query
  const filteredPatients = searchQuery.trim()
    ? patients.filter(
        p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.phone.includes(searchQuery) ||
          p.mrn.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : patients.slice(0, 5);

  // Find appointments for the selected patient
  const patientAppointments = selectedPatient
    ? appointments.filter(
        a => a.patientId === selectedPatient.id && a.date === today
      )
    : [];

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    // Auto-select doctor and appointment if patient has one scheduled today
    const todayApt = appointments.find(
      a =>
        a.patientId === patient.id &&
        a.date === today &&
        (a.status === 'scheduled' || a.status === 'confirmed')
    );
    if (todayApt) {
      setSelectedAppointment(todayApt);
      setSelectedDoctorId(todayApt.doctorId);
    } else {
      setSelectedAppointment(null);
      setSelectedDoctorId(doctors[0]?.id || '');
    }
  };

  const handleConfirmCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !selectedDoctorId) return;

    setIsSubmitting(true);
    try {
      const result = await checkInPatient({
        patientId: selectedPatient.id,
        doctorId: selectedDoctorId,
        appointmentId: selectedAppointment?.id,
        priority
      });

      setCheckedInResult(result);
      success(`Patient ${selectedPatient.name} successfully checked in!`);
    } catch (checkInError) {
      error(checkInError instanceof Error ? checkInError.message : 'Could not check in patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedPatient(null);
    setSelectedAppointment(null);
    setCheckedInResult(null);
    setSearchQuery('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {isLoading && <p role="status" className="text-sm text-slate-500">Loading check-in data…</p>}
      {errors.map(message => <p role="alert" key={message} className="text-sm text-red-600">{message}</p>)}
      {/* Header */}
      <div className="bg-gradient-to-r from-white via-white to-blue-50/40 dark:from-[#121214] dark:to-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-blue-600 dark:text-[#60A5FA] uppercase tracking-wider">
            Reception Desk
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Rapid Patient Check-In
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Search patient records, link appointment or walk-in, and issue queue tickets
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('/dashboard/queue')}
        >
          View Live Queue
        </Button>
      </div>

      {/* Main check-in container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Step 1: Patient Search */}
        <div className="md:col-span-6 space-y-4">
          <Card>
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                1. Select Patient
              </span>
              <button
                type="button"
                onClick={() => onNavigate('/dashboard/patients?action=new')}
                className="text-xs font-semibold text-blue-600 dark:text-[#60A5FA] hover:text-blue-800 dark:hover:text-[#93C5FD] flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" /> New Patient
              </button>
            </div>

            <div className="mt-4">
              <Input
                placeholder="Search MRN, name, or Ethiopian phone..."
                leftIcon={<Search className="w-4 h-4" />}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredPatients.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  No matching patients found.
                </div>
              ) : (
                filteredPatients.map(p => {
                  const isSelected = selectedPatient?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPatient(p)}
                      className={`p-3.5 rounded-xl text-xs cursor-pointer transition-all duration-200 flex items-center justify-between border ${
                        isSelected
                          ? 'bg-[#EFF4FF] dark:bg-[#1D5BD8]/20 border-blue-600 dark:border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                          : 'bg-[#F8FAFC] dark:bg-zinc-900/60 border-slate-200/70 dark:border-zinc-800 hover:bg-blue-50/40 dark:hover:bg-zinc-800/70 hover:border-blue-200/80 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                          MRN: <strong className="text-slate-700 dark:text-zinc-300">{p.mrn}</strong> · {formatPhone(p.phone)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 px-2 py-0.5 rounded-md font-medium border border-slate-200/60 dark:border-zinc-700">
                          {p.age} yrs · {p.gender}
                        </span>
                        {isSelected && (
                          <div className="text-[11px] text-[#1D5BD8] dark:text-[#60A5FA] font-bold mt-1 flex items-center justify-end gap-1">
                            <Check className="w-3.5 h-3.5 text-[#1D5BD8] dark:text-[#60A5FA]" />
                            <span>Selected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Step 2: Check-In Details */}
        <div className="md:col-span-6 space-y-4">
          <Card>
            <div className="pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200">
                2. Check-In Confirmation
              </span>
            </div>

            {selectedPatient ? (
              <form onSubmit={handleConfirmCheckIn} className="space-y-4">
                <div className="p-3.5 bg-[#F8FAFC] dark:bg-zinc-900/60 rounded-xl border border-slate-200/80 dark:border-zinc-800 text-xs">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {selectedPatient.name} ({selectedPatient.mrn})
                  </div>
                  <div className="text-slate-500 dark:text-zinc-400 text-[11px] mt-0.5">
                    Phone: {formatPhone(selectedPatient.phone)} · Blood: {selectedPatient.bloodType || 'N/A'}
                  </div>
                  {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                    <div className="text-red-600 dark:text-red-400 text-[11px] font-medium mt-1">
                      Allergies: {selectedPatient.allergies.join(', ')}
                    </div>
                  )}
                </div>

                {patientAppointments.length > 0 && (
                  <div className="p-3 bg-blue-50/60 dark:bg-[#1D5BD8]/10 rounded-lg border border-blue-200 dark:border-[#1D5BD8]/30 text-xs space-y-1">
                    <div className="font-semibold text-blue-900 dark:text-[#93C5FD] flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-blue-600 dark:text-[#60A5FA]" />
                      Scheduled Appointment Found Today
                    </div>
                    {patientAppointments.map(a => (
                      <div key={a.id} className="text-slate-700 dark:text-zinc-300 text-[11px]">
                        {formatTimeSafe(a.time)} with <strong>{a.doctorName}</strong> ({a.department})
                      </div>
                    ))}
                  </div>
                )}

                <Select
                  label="Assigning Consulting Physician"
                  required
                  value={selectedDoctorId}
                  onChange={e => setSelectedDoctorId(e.target.value)}
                >
                  <option value="">Select Doctor...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}{d.roomNumber ? ` — ${d.roomNumber}` : ''} ({d.specialization.split('&')[0]})
                    </option>
                  ))}
                </Select>

                <Select
                  label="Queue Priority Level"
                  value={priority}
                  onChange={e => setPriority(e.target.value as PriorityLevel)}
                >
                  <option value="normal">Normal (Standard rotation)</option>
                  <option value="urgent">Urgent / Acute Distress</option>
                  <option value="elderly_child">Child / Senior Citizen Priority</option>
                  <option value="follow_up">Quick Lab / Follow-up review</option>
                </Select>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-2"
                  isLoading={isSubmitting}
                  leftIcon={<UserCheck className="w-4 h-4" />}
                >
                  Confirm Check-In & Generate Ticket
                </Button>
              </form>
            ) : (
              <div className="py-16 text-center text-xs text-slate-400 dark:text-zinc-500 space-y-2">
                <UserCheck className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" />
                <p>Select a patient from the left column to begin check-in.</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* CHECK-IN SUCCESS MODAL / TICKET SLIP */}
      {checkedInResult && (
        <Modal
          isOpen={!!checkedInResult}
          onClose={resetForm}
          title="Patient Checked In"
          maxWidth="sm"
        >
          <div className="space-y-5 text-center">
            {/* Visual ticket slip */}
            <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4 shadow-xl border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                {clinicProfile?.name || 'Clinic'} Ticket
              </div>

              <div>
                <div className="text-4xl font-black text-white tracking-tight tabular-nums">
                  {checkedInResult.ticketNumber}
                </div>
                <div className="text-sm font-semibold text-slate-200 mt-1">
                  {checkedInResult.patientName}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-xs text-slate-300 space-y-1">
                <div>
                  Proceed to: <strong className="text-white">{checkedInResult.roomNumber || 'Room not assigned'}</strong>
                </div>
                <div>Doctor: {checkedInResult.doctorName}</div>
                <div className="text-blue-300 font-medium">
                  You are currently <strong className="text-white">#{checkedInResult.position}</strong> in line
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                className="w-1/2"
                onClick={() => {
                  window.print();
                }}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Slip
              </Button>
              <Button
                variant="primary"
                size="md"
                className="w-1/2"
                onClick={resetForm}
              >
                Next Patient
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
