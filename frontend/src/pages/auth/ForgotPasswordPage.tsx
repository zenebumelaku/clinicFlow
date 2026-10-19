import React from 'react';
import { ArrowLeft, Hospital } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const ForgotPasswordPage: React.FC<{
  onNavigate: (path: string) => void;
}> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 transition-colors dark:bg-[#09090b]">
      <section className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/[0.06] dark:border-zinc-800 dark:bg-[#121214] sm:p-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1D5BD8] text-white">
            <Hospital className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">ClinicFlow</span>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D5BD8] dark:text-blue-400">
            Account recovery
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Forgot your password?</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-zinc-400">
            For your account's security, password recovery is handled by your clinic administrator.
            Contact your clinic to request a password reset.
          </p>
        </div>

        <Button className="w-full" onClick={() => onNavigate('/login')}>
          Return to sign in
        </Button>

        <div className="border-t border-slate-100 pt-4 text-center dark:border-zinc-800">
          <button
            type="button"
            onClick={() => onNavigate('/login')}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </button>
        </div>
      </section>
    </div>
  );
};
