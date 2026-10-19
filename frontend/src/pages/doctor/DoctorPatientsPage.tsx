import React, { useState } from 'react';
import {
  Users,
  Search,
  Phone,
  Calendar,
  FileText,
  UserCheck,
  ChevronRight,
  HeartPulse,
  Clock,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useClinicData, usePatientsPage } from '../../lib/hooks/useClinic';
import { formatDateSafe } from '../../lib/utils';
import { Patient } from '../../types';

interface DoctorPatientsPageProps {
  onNavigate: (path: string) => void;
}

export const DoctorPatientsPage: React.FC<DoctorPatientsPageProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const patientsQuery = usePatientsPage(search.trim() || undefined, page, undefined, 20);
  const patients = patientsQuery.data?.data || [];
  const meta = patientsQuery.data?.meta;

  const { appointments } = useClinicData({ includePatientList: false });

  const patientAppointments = selectedPatient
    ? appointments.filter(a => a.patientId === selectedPatient.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-violet-50/60 via-white to-white dark:from-violet-950/20 dark:via-[#121214] dark:to-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Patient Clinical Directory
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Review patient medical records, contact information, and visit histories.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => onNavigate('/doctor/overview')}>
            Consultation Desk
          </Button>
        </div>
      </div>

      {/* Directory Card */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, MRN, or phone..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-zinc-400">
            {meta?.total || patients.length} registered patient{meta?.total === 1 ? '' : 's'}
          </span>
        </div>

        {/* Patients Grid / List */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {patientsQuery.isLoading ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400">Loading patients...</div>
          ) : patients.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400">No patients found.</div>
          ) : (
            patients.map(patient => (
              <div
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#121214] hover:border-violet-300 dark:hover:border-violet-800 hover:shadow-sm transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{patient.name}</p>
                      <p className="text-[11px] font-mono text-violet-600 dark:text-violet-400 font-bold mt-0.5">
                        MRN: {patient.mrn}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 capitalize">
                      {patient.gender} · {patient.age ? `${patient.age}y` : 'Adult'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-zinc-400">
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{patient.phone}</span>
                    </p>
                    {patient.emergencyContact?.name && (
                      <p className="text-[11px] text-slate-400">
                        Emergency: {patient.emergencyContact.name} ({patient.emergencyContact.phone})
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-violet-700 dark:text-violet-300 font-semibold">
                  <span>View clinical record</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-500">
            <span>Page {meta.page} of {meta.totalPages}</span>
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

      {/* Patient Record Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#121214] p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-zinc-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Patient Medical Record
                </span>
                <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedPatient.name}
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  MRN: {selectedPatient.mrn} · Tel: {selectedPatient.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {/* Demographics Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Gender</span>
                  <p className="text-xs font-bold capitalize text-slate-800 dark:text-white">{selectedPatient.gender}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Age</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">{selectedPatient.age || '—'} years</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Registered</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">{formatDateSafe(selectedPatient.registeredDate)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Emergency</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    {selectedPatient.emergencyContact?.name || 'None listed'}
                  </p>
                </div>
              </div>

              {/* Consultation History */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Clinic Consultation History ({patientAppointments.length})
                </h3>
                {patientAppointments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">No prior visit records found for this patient.</p>
                ) : (
                  <div className="space-y-3">
                    {patientAppointments.map(apt => (
                      <div
                        key={apt.id}
                        className="p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatDateSafe(apt.date)}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                            {apt.doctorName}
                          </span>
                        </div>
                        {apt.reason && (
                          <p className="mt-1 text-slate-600 dark:text-zinc-300">
                            Reason: <span className="font-medium">{apt.reason}</span>
                          </p>
                        )}
                        {apt.notes && (
                          <p className="mt-1 text-slate-500 dark:text-zinc-400 italic">
                            Clinical Notes: {apt.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedPatient(null)}>Close Record</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
