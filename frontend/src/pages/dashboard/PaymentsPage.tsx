import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  DollarSign,
  Smartphone,
  Building,
  CheckCircle2,
  Clock,
  Printer,
  Receipt,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useClinicData } from '../../lib/hooks/useClinic';
import { useToast } from '../../components/ui/Toast';
import { PaymentRecord, PaymentMethod, PaymentStatus } from '../../types';
import { formatETB, formatDateSafe, formatTimeSafe, formatPhone } from '../../lib/utils';

export const PaymentsPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { payments, patients, appointments, recordPayment, isLoading, errors, clinicProfile } = useClinicData();
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [isRecordDrawerOpen, setIsRecordDrawerOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  const [newPayment, setNewPayment] = useState({
    patientId: '',
    appointmentId: '',
    amountETB: 0,
    paymentMethod: 'chapa' as PaymentMethod,
    referenceNumber: '',
    status: 'confirmed' as PaymentStatus,
    description: ''
  });

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === newPayment.patientId);
    if (!patient || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const recorded = await recordPayment({
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        appointmentId: newPayment.appointmentId || undefined,
        amountETB: Number(newPayment.amountETB),
        paymentMethod: newPayment.paymentMethod,
        referenceNumber: newPayment.referenceNumber.trim(),
        status: newPayment.status,
        description: newPayment.description,
        cashierName: '',
      });
      setSelectedReceipt(recorded);
      success(
        newPayment.status === 'confirmed'
          ? `Payment recorded as received (Receipt: ${recorded.receiptNumber}).`
          : `Payment recorded as pending (Receipt: ${recorded.receiptNumber}).`,
      );
      setIsRecordDrawerOpen(false);
      setNewPayment({
        patientId: '', appointmentId: '', amountETB: 0, paymentMethod: 'chapa',
        referenceNumber: '', status: 'confirmed', description: '',
      });
    } catch (paymentError) {
      error(paymentError instanceof Error ? paymentError.message : 'Could not record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations
  const confirmedPayments = payments.filter(p => p.status === 'confirmed' && p.date.slice(0, 10) === today);
  const totalRevenue = confirmedPayments.reduce((s, p) => s + p.amountETB, 0);
  const cashTotal = confirmedPayments
    .filter(p => p.paymentMethod === 'cash')
    .reduce((s, p) => s + p.amountETB, 0);
  const digitalTotal = confirmedPayments
    .filter(p => p.paymentMethod !== 'cash')
    .reduce((s, p) => s + p.amountETB, 0);
  const pendingTotal = payments
    .filter(p => p.status === 'pending' && p.date.slice(0, 10) === today)
    .reduce((s, p) => s + p.amountETB, 0);

  const filteredPayments = payments.filter(pay => {
    if (filterMethod !== 'all' && pay.paymentMethod !== filterMethod) return false;
    if (filterStatus !== 'all' && pay.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        pay.patientName.toLowerCase().includes(q) ||
        pay.receiptNumber.toLowerCase().includes(q) ||
        pay.referenceNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-gradient-to-r from-white via-white to-blue-50/40 dark:from-[#121214] dark:to-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Clinic Billing & Payment Records
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Collect Chapa digital payments and cash in Ethiopian Birr (ETB) with instant receipts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="md"
            variant="primary"
            onClick={() => setIsRecordDrawerOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Record Payment
          </Button>
        </div>
      </div>

      {isLoading && <p role="status" className="text-sm text-slate-500">Loading payments…</p>}
      {errors.map(message => <p role="alert" key={message} className="text-sm text-red-600">{message}</p>)}

      {/* 2. Financial Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Today's Total Revenue</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
            {formatETB(totalRevenue)}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Reconciled today</span>
        </Card>

        <Card>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Digital (Chapa Gateway)</span>
          <div className="text-2xl font-bold text-blue-700 dark:text-[#93C5FD] tabular-nums mt-1">
            {formatETB(digitalTotal)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {Math.round((digitalTotal / Math.max(1, totalRevenue)) * 100)}% of total collections
          </span>
        </Card>

        <Card>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cash Collections</span>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 tabular-nums mt-1">
            {formatETB(cashTotal)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Safe drawer cash</span>
        </Card>

        <Card>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Outstanding / Pending</span>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 tabular-nums mt-1">
            {formatETB(pendingTotal)}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            {payments.filter(p => p.status === 'pending').length} pending settlement
          </span>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex-1 min-w-[220px]">
          <Input
            placeholder="Search by patient, receipt number, or Chapa reference..."
            leftIcon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500 dark:text-zinc-400 font-medium">Method:</label>
          <select
            value={filterMethod}
            onChange={e => setFilterMethod(e.target.value)}
            className="rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 px-3 py-2 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="all" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">All Methods</option>
            <option value="chapa" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Chapa Digital Gateway</option>
            <option value="cash" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Cash</option>
            <option value="bank_transfer" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Bank Transfer</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500 dark:text-zinc-400 font-medium">Status:</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 px-3 py-2 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="all" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">All Statuses</option>
            <option value="confirmed" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Confirmed</option>
            <option value="pending" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Pending</option>
            <option value="cancelled" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Cancelled</option>
          </select>
        </div>
      </div>

      {/* 4. Payments Table */}
      <div className="bg-white dark:bg-[#121214] rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] dark:bg-zinc-900/60 border-b border-slate-200/80 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Payment ID</th>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Method & Ref</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(pay => (
                  <tr key={pay.id} className="hover:bg-blue-50/40 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                        {pay.receiptNumber}
                      </span>
                      <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                        {formatDateSafe(pay.date)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{pay.patientName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">{pay.patientPhone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatETB(pay.amountETB)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold uppercase text-blue-700 dark:text-[#93C5FD] bg-blue-50 dark:bg-[#1D5BD8]/20 px-2 py-0.5 rounded text-[11px] border border-blue-200 dark:border-[#1D5BD8]/30">
                        {pay.paymentMethod.replace('_', ' ')}
                      </span>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                        {pay.referenceNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-300 max-w-xs truncate">
                      {pay.description}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={pay.status} type="payment" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedReceipt(pay)}
                        leftIcon={<Receipt className="w-3.5 h-3.5" />}
                      >
                        View Record
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. RECORD PAYMENT DRAWER */}
      <Drawer
        isOpen={isRecordDrawerOpen}
        onClose={() => setIsRecordDrawerOpen(false)}
        title="Record Outpatient Payment"
        description="Record a payment already received or leave it pending verification. This app does not process external payments."
        width="lg"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <Select
            label="Patient"
            required
            value={newPayment.patientId}
            onChange={e => setNewPayment({ ...newPayment, patientId: e.target.value, appointmentId: '' })}
          >
            <option value="">Select patient...</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.mrn}) — {p.phone}
              </option>
            ))}
          </Select>

          <Select
            label="Related Appointment (optional)"
            value={newPayment.appointmentId}
            onChange={e => setNewPayment({ ...newPayment, appointmentId: e.target.value })}
          >
            <option value="">No appointment selected</option>
            {appointments
              .filter(appointment => appointment.patientId === newPayment.patientId)
              .map(appointment => (
                <option key={appointment.id} value={appointment.id}>
                  {appointment.date} {appointment.time} — {appointment.reason || appointment.status}
                </option>
              ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount in ETB"
              type="number"
              required
              min={0.01}
              step={0.01}
              value={newPayment.amountETB}
              onChange={e => setNewPayment({ ...newPayment, amountETB: Number(e.target.value) })}
            />

            <Select
              label="Payment Method"
              value={newPayment.paymentMethod}
              onChange={e =>
                setNewPayment({ ...newPayment, paymentMethod: e.target.value as PaymentMethod })
              }
            >
              <option value="chapa">Chapa Payment Gateway (Digital Payments)</option>
              <option value="cash">Cash Collection</option>
              <option value="bank_transfer">Direct Bank Transfer</option>
            </Select>
          </div>

          <Input
            label="Transaction Reference / Slip Code"
            placeholder="Enter the actual transaction reference, if available"
            value={newPayment.referenceNumber}
            onChange={e => setNewPayment({ ...newPayment, referenceNumber: e.target.value })}
            helperText="The app does not generate external transaction references."
          />

          <Input
            label="Service Description"
            required
            value={newPayment.description}
            onChange={e => setNewPayment({ ...newPayment, description: e.target.value })}
          />

          <Select
            label="Initial Status"
            value={newPayment.status}
            onChange={e =>
              setNewPayment({ ...newPayment, status: e.target.value as PaymentStatus })
            }
          >
            <option value="confirmed">Confirmed (Received)</option>
            <option value="pending">Pending (Awaiting verification)</option>
          </Select>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRecordDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !newPayment.patientId}>
              {isSubmitting ? 'Recording…' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* 7. RECEIPT MODAL */}
      {selectedReceipt && (
        <Modal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          title="Payment Receipt"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 text-xs space-y-3 font-mono">
              <div className="text-center pb-2 border-b border-slate-200 dark:border-zinc-800">
                <div className="font-bold text-sm text-slate-900 dark:text-white font-sans">
                  {clinicProfile?.name || 'Clinic'}
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Receipt #:</span>
                <strong className="text-slate-900 dark:text-white">{selectedReceipt.receiptNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Date:</span>
                <span className="text-slate-900 dark:text-zinc-200">{formatDateSafe(selectedReceipt.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Patient:</span>
                <strong className="text-slate-900 dark:text-white">{selectedReceipt.patientName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Method:</span>
                <span className="uppercase font-semibold text-blue-600 dark:text-[#60A5FA]">{selectedReceipt.paymentMethod}</span>
              </div>
              {selectedReceipt.referenceNumber && <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Ref Code:</span>
                <span className="text-slate-900 dark:text-zinc-200">{selectedReceipt.referenceNumber}</span>
              </div>}
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-zinc-800 font-bold text-sm text-slate-900 dark:text-white font-sans">
                <span>Total Paid:</span>
                <span>{formatETB(selectedReceipt.amountETB)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                className="w-1/2"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Payment Record
              </Button>
              <Button
                variant="primary"
                size="md"
                className="w-1/2"
                onClick={() => setSelectedReceipt(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
