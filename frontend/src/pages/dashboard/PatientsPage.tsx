import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Calendar,
  FileText,
  CreditCard,
  UserCheck,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Drawer } from '../../components/ui/Drawer';
import { Input, Select } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useClinicData, usePatientsPage } from '../../lib/hooks/useClinic';
import { useToast } from '../../components/ui/Toast';
import { Patient } from '../../types';
import { formatPhone, formatDateSafe, formatTimeSafe, formatETB } from '../../lib/utils';

export const PatientsPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedPatientForView, setSelectedPatientForView] = useState<Patient | null>(null);
  const { appointments, payments, createPatient, isLoading, errors } =
    useClinicData({ includePatientList: false });
  const patientsQuery = usePatientsPage(searchQuery, currentPage, selectedGender);
  const patients = patientsQuery.data?.data || [];
  const { success, error } = useToast();

  // New patient form state
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'male' as 'male' | 'female',
    age: 30,
    emergencyName: '',
    emergencyPhone: '',
  });

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
    const created = await createPatient({
      name: newPatient.name,
      phone: newPatient.phone,
      email: newPatient.email,
      gender: newPatient.gender,
      age: Number(newPatient.age),
      emergencyContact: {
        name: newPatient.emergencyName,
        phone: newPatient.emergencyPhone,
      },
    });

    success(`Patient ${created.name} registered with MRN ${created.mrn}`);
    setIsAddDrawerOpen(false);
    setNewPatient({
      name: '',
      phone: '',
      email: '',
      gender: 'male',
      age: 30,
      emergencyName: '',
      emergencyPhone: '',
    });
    } catch (createError) {
      error(createError instanceof Error ? createError.message : 'Could not register patient');
    }
  };

  const filteredPatients = patients;

  // Selected patient's operational history
  const patientApts = selectedPatientForView
    ? appointments.filter(a => a.patientId === selectedPatientForView.id)
    : [];
  const patientPayments = selectedPatientForView
    ? payments.filter(p => p.patientId === selectedPatientForView.id)
    : [];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-gradient-to-r from-white via-white to-blue-50/40 dark:from-[#121214] dark:to-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Patient Registry
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Centralized directory of registered clinic patients, contact details, and visit tallies
          </p>
        </div>

        <Button
          size="md"
          variant="primary"
          onClick={() => setIsAddDrawerOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Register New Patient
        </Button>
      </div>

      {/* 2. Search & Filters */}
      <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex-1 min-w-[240px]">
          <Input
            placeholder="Search by MRN, patient name, or phone..."
            leftIcon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500 dark:text-zinc-400 font-medium">Gender:</label>
          <select
            value={selectedGender}
            onChange={e => { setSelectedGender(e.target.value); setCurrentPage(1); }}
            className="rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 px-3 py-2 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="all" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">All</option>
            <option value="male" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Male</option>
            <option value="female" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Female</option>
          </select>
        </div>
      </div>

      {/* 3. Patients Table */}
      {(isLoading || patientsQuery.isLoading) && <p role="status" className="text-sm text-slate-500">Loading patients…</p>}
      {[...errors, ...(patientsQuery.error instanceof Error ? [patientsQuery.error.message] : [])]
        .map(message => <p role="alert" key={message} className="text-sm text-red-600">{message}</p>)}
      <div className="bg-white dark:bg-[#121214] rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] dark:bg-zinc-900/60 border-b border-slate-200/80 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Patient / MRN</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Demographics</th>
                <th className="py-3.5 px-4">Registered Date</th>
                <th className="py-3.5 px-4">Last Visit</th>
                <th className="py-3.5 px-4">Total Visits</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No patients match your search.
                  </td>
                </tr>
              ) : (
                filteredPatients.map(patient => (
                  <tr key={patient.id} className="hover:bg-blue-50/40 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{patient.name}</div>
                      <div className="text-[11px] text-[#1D5BD8] dark:text-[#60A5FA] font-semibold tabular-nums">
                        {patient.mrn}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-zinc-300">
                      {formatPhone(patient.phone)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize text-slate-700 dark:text-zinc-300">
                        {patient.gender}, {patient.age} yrs
                      </span>
                      {patient.bloodType && (
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500 block">
                          Blood: {patient.bloodType}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-zinc-400 tabular-nums">
                      {formatDateSafe(patient.registeredDate)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-zinc-300 tabular-nums font-medium">
                      {patient.lastVisitDate ? formatDateSafe(patient.lastVisitDate) : 'Not available'}
                    </td>
                    <td className="py-3.5 px-4 tabular-nums">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-semibold">
                        {patient.totalVisits ?? '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedPatientForView(patient)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Profile
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onNavigate(`/dashboard/check-in?patientId=${patient.id}`)
                        }
                      >
                        Check In
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {patientsQuery.data?.meta && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-zinc-800 text-xs">
            <span className="text-slate-500">
              Page {patientsQuery.data.meta.page} of {patientsQuery.data.meta.totalPages} · {patientsQuery.data.meta.total} patients
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={!patientsQuery.data.meta.hasPreviousPage} onClick={() => setCurrentPage(page => page - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={!patientsQuery.data.meta.hasNextPage} onClick={() => setCurrentPage(page => page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* 4. ADD PATIENT DRAWER */}
      <Drawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title="Register New Clinic Patient"
        description="Creates patient profile and assigns unique Ethiopian Medical Record Number (MRN)."
        width="lg"
      >
        <form onSubmit={handleCreatePatient} className="space-y-4">
          <Input
            label="Full Name"
            required
            placeholder="Patient full name"
            value={newPatient.name}
            onChange={e => setNewPatient({ ...newPatient, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              required
              placeholder="+251 9... or 09..."
              value={newPatient.phone}
              onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="optional@example.com"
              value={newPatient.email}
              onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Gender"
              value={newPatient.gender}
              onChange={e =>
                setNewPatient({ ...newPatient, gender: e.target.value as 'male' | 'female' })
              }
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </Select>

            <Input
              label="Age (Years)"
              type="number"
              required
              value={newPatient.age}
              onChange={e => setNewPatient({ ...newPatient, age: Number(e.target.value) })}
            />
          </div>

          {/* Emergency Contact */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Emergency Contact (saved to patient profile)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Name"
                placeholder="Contact Person"
                value={newPatient.emergencyName}
                onChange={e => setNewPatient({ ...newPatient, emergencyName: e.target.value })}
              />
              <Input
                label="Contact Phone"
                placeholder="+251 9..."
                value={newPatient.emergencyPhone}
                onChange={e => setNewPatient({ ...newPatient, emergencyPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Complete Registration</Button>
          </div>
        </form>
      </Drawer>

      {/* 5. PATIENT PROFILE OPERATIONS DRAWER */}
      {selectedPatientForView && (
        <Drawer
          isOpen={!!selectedPatientForView}
          onClose={() => setSelectedPatientForView(null)}
          title={selectedPatientForView.name}
          description={`MRN: ${selectedPatientForView.mrn} · Registered: ${formatDateSafe(
            selectedPatientForView.registeredDate
          )}`}
          width="xl"
        >
          <div className="space-y-6">
            {/* Quick summary badges */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#F8FAFC] dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-xs">
              <div>
                <span className="text-slate-400 dark:text-zinc-500 block text-[11px]">Phone</span>
                <strong className="text-slate-900 dark:text-white font-semibold">
                  {formatPhone(selectedPatientForView.phone)}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 dark:text-zinc-500 block text-[11px]">Age & Gender</span>
                <strong className="text-slate-900 dark:text-white font-semibold">
                  {selectedPatientForView.age} years · {selectedPatientForView.gender}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 dark:text-zinc-500 block text-[11px]">Blood Group</span>
                <strong className="text-slate-900 dark:text-white font-semibold">
                  {selectedPatientForView.bloodType || 'N/A'}
                </strong>
              </div>
            </div>

            {/* Quick check-in action */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/70 dark:bg-[#1D5BD8]/15 border border-blue-200/80 dark:border-[#1D5BD8]/30 text-xs">
              <span className="text-blue-900 dark:text-[#93C5FD] font-medium">
                Arrived at clinic? Issue today's queue ticket immediately.
              </span>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  const patId = selectedPatientForView.id;
                  setSelectedPatientForView(null);
                  onNavigate(`/dashboard/check-in?patientId=${patId}`);
                }}
              >
                Rapid Check-In
              </Button>
            </div>

            {/* Emergency & Allergies */}
            <div className="space-y-2 text-xs">
              <h4 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Emergency Contact
              </h4>
              <p className="text-slate-700 dark:text-zinc-300 bg-[#F8FAFC] dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200/70 dark:border-zinc-800">
                {selectedPatientForView.emergencyContact?.name} (
                {selectedPatientForView.emergencyContact?.relation}) —{' '}
                {formatPhone(selectedPatientForView.emergencyContact?.phone || '')}
              </p>
            </div>

            {selectedPatientForView.allergies && selectedPatientForView.allergies.length > 0 && (
              <div className="space-y-2 text-xs">
                <h4 className="font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider text-[11px]">
                  Allergies
                </h4>
                <div className="p-3 rounded-xl bg-red-50/70 dark:bg-red-950/40 border border-red-200/80 dark:border-red-800 text-red-800 dark:text-red-300 font-medium">
                  {selectedPatientForView.allergies.join(', ')}
                </div>
              </div>
            )}

            {/* Scheduled Appointments */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Appointment History ({patientApts.length})
              </h4>
              <div className="space-y-2">
                {patientApts.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-zinc-500">No scheduled appointments recorded.</p>
                ) : (
                  patientApts.map(a => (
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
            </div>

            {/* Payments */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Billing Receipts ({patientPayments.length})
              </h4>
              <div className="space-y-2">
                {patientPayments.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-zinc-500">No payment records yet.</p>
                ) : (
                  patientPayments.map(p => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-900/60 hover:bg-blue-50/40 dark:hover:bg-zinc-800/70 hover:border-blue-200/80 dark:hover:border-zinc-700 transition-all text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {formatETB(p.amountETB)} ·{' '}
                          <span className="uppercase text-blue-600 dark:text-[#60A5FA] font-bold">{p.paymentMethod}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                          Receipt {p.receiptNumber} · Ref: {p.referenceNumber}
                        </div>
                      </div>
                      <StatusBadge status={p.status} type="payment" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Notes */}
            {selectedPatientForView.notes && (
              <div className="space-y-2 text-xs">
                <h4 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Clinic Notes
                </h4>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 leading-relaxed">
                  {selectedPatientForView.notes}
                </div>
              </div>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
};
