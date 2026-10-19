import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Receipt,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Building,
  Calendar,
  X,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import { useClinicData } from '../../lib/hooks/useClinic';
import { authService } from '../../lib/services/authService';
import { formatDateSafe } from '../../lib/utils';
import { PaymentRecord } from '../../types';

interface PatientPaymentsPageProps {
  onNavigate: (path: string) => void;
}

export const PatientPaymentsPage: React.FC<PatientPaymentsPageProps> = ({ onNavigate }) => {
  const { payments, patients, clinicProfile, initializeChapaPayment, verifyChapaPayment } = useClinicData();
  const { success, error, info } = useToast();
  const currentUser = authService.getUser();
  const patient = patients.find(p => p.phone === currentUser?.phone || p.id === currentUser?.id) || patients[0];

  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);
  const [isInitializingChapa, setIsInitializingChapa] = useState(false);
  const [isVerifyingChapa, setIsVerifyingChapa] = useState(false);
  const [activeChapaModal, setActiveChapaModal] = useState<{ checkoutUrl: string; txRef: string; amount: number } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txRef = params.get('tx_ref');
    if (txRef) {
      setIsVerifyingChapa(true);
      info(`Verifying Chapa transaction (${txRef})...`);
      verifyChapaPayment(txRef)
        .then(rec => {
          success(`Payment verified and confirmed! Receipt: ${rec.receiptNumber}`);
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(err => {
          error(err instanceof Error ? err.message : 'Verification failed');
        })
        .finally(() => setIsVerifyingChapa(false));
    }
  }, []);

  const handlePayWithChapa = async (amount: number = 850) => {
    if (!patient) {
      error('Patient profile not available');
      return;
    }
    setIsInitializingChapa(true);
    try {
      const res = await initializeChapaPayment({
        patientId: patient.id,
        amount,
        returnUrl: `${window.location.origin}/patient/payments`,
        description: 'Clinic Consultation Fee Payment',
      });
      setActiveChapaModal({
        checkoutUrl: res.checkoutUrl,
        txRef: res.txRef,
        amount: res.amount,
      });
      info(`Chapa checkout initialized (${res.txRef}).`);
    } catch (err) {
      error(err instanceof Error ? err.message : 'Could not initialize Chapa payment');
    } finally {
      setIsInitializingChapa(false);
    }
  };

  const handleConfirmVerification = async (txRef: string) => {
    setIsVerifyingChapa(true);
    try {
      const rec = await verifyChapaPayment(txRef);
      success(`Payment confirmed by Chapa server! Receipt: ${rec.receiptNumber}`);
      setActiveChapaModal(null);
      setSelectedReceipt(rec);
    } catch (err) {
      error(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifyingChapa(false);
    }
  };

  // Filter payments for this patient or show demo records
  const myPayments = patient
    ? payments.filter(p => p.patientId === patient.id || p.patientPhone === patient.phone || p.patientName === patient.name)
    : payments;

  const totalPaid = myPayments
    .filter(p => p.status === 'confirmed')
    .reduce((sum, p) => sum + p.amountETB, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-violet-50/60 via-white to-white dark:from-violet-950/20 dark:via-[#121214] dark:to-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Billing & Payment Receipts
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Official consultation invoices and receipts issued for {patient?.name || 'your care profile'}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => onNavigate('/patient/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-[#121214]">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Total Payments</span>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
            {totalPaid.toLocaleString()} <span className="text-sm font-bold text-slate-500">ETB</span>
          </p>
          <p className="mt-1 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Settled consultations
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-[#121214]">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Receipts Issued</span>
          <p className="mt-2 text-3xl font-black text-violet-600 dark:text-violet-400">
            {myPayments.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Electronic verification enabled</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-[#121214]">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Payment Gateway</span>
          <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">Chapa</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800">Cash</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Hosted checkout in Ethiopian Birr (ETB)</p>
        </div>
      </div>

      {/* Chapa Checkout Action Card */}
      <div className="p-5 sm:p-6 rounded-2xl border border-emerald-200/90 dark:border-emerald-800/60 bg-gradient-to-r from-emerald-50/70 via-white to-white dark:from-emerald-950/30 dark:via-[#121214] dark:to-[#121214] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              Chapa Checkout
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">Hosted payment</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Settle Clinical Consultation Fee (850 ETB)
          </h2>
          <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-xl">
            Start a hosted Chapa checkout. The backend verifies the transaction directly with Chapa before confirming payment.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => handlePayWithChapa(850)}
            isLoading={isInitializingChapa}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
            leftIcon={<CreditCard className="h-4 w-4" />}
          >
            Pay with Chapa
          </Button>
        </div>
      </div>

      {/* Receipts Table */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Receipt Records ({myPayments.length})
          </h2>
          <span className="text-xs text-slate-500">MRN: {patient?.mrn || 'ET-2026-0104'}</span>
        </div>

        {myPayments.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No payment receipts on record yet.
          </div>
        ) : (
          <div className="space-y-3">
            {myPayments.map(payment => (
              <div
                key={payment.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#121214] hover:border-violet-300 dark:hover:border-violet-800 transition"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 flex items-center justify-center shrink-0">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                        {payment.receiptNumber}
                      </p>
                      <StatusBadge status={payment.status} type="payment" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      {payment.description || 'Clinical Consultation Fee'} · Method: <span className="capitalize font-semibold">{payment.paymentMethod.replace('_', ' ')}</span>
                      {payment.referenceNumber && <span> · Ref: {payment.referenceNumber}</span>}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Date: {formatDateSafe(payment.date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {payment.amountETB.toLocaleString()} ETB
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedReceipt(payment)}
                    leftIcon={<Printer className="h-3.5 w-3.5" />}
                  >
                    View Receipt
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 dark:bg-[#121214]">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1D5BD8] flex items-center justify-center text-white">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">MediFlow Addis Clinic</h3>
                  <p className="text-[10px] text-slate-400">Official Payment Receipt</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-zinc-800">
                <span className="text-slate-500">Receipt No:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-zinc-800">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900 dark:text-white">{patient?.name || 'Patient'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-zinc-800">
                <span className="text-slate-500">MRN:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{patient?.mrn || 'ET-2026-0104'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-zinc-800">
                <span className="text-slate-500">Service:</span>
                <span className="text-slate-800 dark:text-zinc-200">{selectedReceipt.description || 'General Consultation'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-zinc-800">
                <span className="text-slate-500">Payment Channel:</span>
                <span className="capitalize font-bold text-slate-900 dark:text-white">{selectedReceipt.paymentMethod.replace('_', ' ')}</span>
              </div>
              {selectedReceipt.referenceNumber && (
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-zinc-800">
                  <span className="text-slate-500">Txn Reference:</span>
                  <span className="font-mono text-slate-900 dark:text-white">{selectedReceipt.referenceNumber}</span>
                </div>
              )}
              <div className="flex justify-between py-2 text-sm font-bold border-t border-slate-200 dark:border-zinc-700">
                <span>Amount Paid:</span>
                <span className="text-base text-emerald-600 dark:text-emerald-400 font-black">
                  {selectedReceipt.amountETB.toLocaleString()} ETB
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handlePrint}
                leftIcon={<Printer className="h-4 w-4" />}
              >
                Print Receipt
              </Button>
              <Button
                className="flex-1"
                onClick={() => setSelectedReceipt(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chapa Checkout Modal */}
      {activeChapaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-emerald-200 dark:border-zinc-800 dark:bg-[#121214]">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
                  C
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Chapa Payment Gateway</h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                      Hosted Checkout
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">Official Ethiopian Birr (ETB) Hosted Checkout</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveChapaModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs">Server-verified checkout</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                    This transaction is tracked on the ClinicFlow backend. Verification happens server-to-server directly against Chapa's official API.
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-xl bg-slate-50 dark:bg-zinc-900/60 p-4 border border-slate-200/60 dark:border-zinc-800">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Transaction Ref:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{activeChapaModal.txRef}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Amount Due:</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{activeChapaModal.amount} ETB</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Customer:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{patient?.name || 'Patient'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Hosted URL:</span>
                  <a
                    href={activeChapaModal.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-[#1D5BD8] hover:underline flex items-center gap-1"
                  >
                    <span>Open Checkout</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setActiveChapaModal(null)}
              >
                Close
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                isLoading={isVerifyingChapa}
                onClick={() => handleConfirmVerification(activeChapaModal.txRef)}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              >
                Verify Payment on Server
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
