import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Hospital, LockKeyhole, Phone } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { authService } from '../../lib/services/authService';

export const ForgotPasswordPage: React.FC<{
  onNavigate: (path: string) => void;
}> = ({ onNavigate }) => {
  const { success, error } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSending, setIsSending] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds === 0) return;
    const timer = window.setTimeout(
      () => setCooldownSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  const sendCode = async () => {
    setIsSending(true);
    try {
      const result = await authService.sendPasswordResetOtp(identifier);
      setCooldownSeconds(result.cooldownSeconds);
      setStep(2);
      success('If an account matches, a password reset code has been sent.');
    } catch (sendError) {
      error(sendError instanceof Error ? sendError.message : 'Unable to send a reset code.');
    } finally {
      setIsSending(false);
    }
  };

  const handleRequestCode = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendCode();
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      error('The passwords do not match.');
      return;
    }
    setIsResetting(true);
    try {
      await authService.resetPassword(identifier, code, password);
      setStep(3);
      success('Password reset complete. Sign in with your new password.');
    } catch (resetError) {
      error(resetError instanceof Error ? resetError.message : 'Unable to reset your password.');
    } finally {
      setIsResetting(false);
    }
  };

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
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {step === 1
              ? 'Reset your password'
              : step === 2
                ? 'Choose a new password'
                : 'Password updated'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-zinc-400">
            {step === 1
              ? 'We’ll send a one-time code to your registered phone or email.'
              : step === 2
                ? `Enter the verification code sent to ${identifier}.`
                : 'You can now sign in using your new password.'}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <Input
              label="Phone number or email"
              type="text"
              autoComplete="username"
              required
              minLength={6}
              maxLength={254}
              placeholder="+251 911 234567 or you@example.com"
              leftIcon={<Phone className="h-4 w-4" />}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />
            <Button type="submit" className="w-full" isLoading={isSending}>
              Send reset code
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={(event) => void handleResetPassword(event)} className="space-y-4">
            <Input
              label="Verification code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              minLength={6}
              maxLength={6}
              pattern="[0-9]{6}"
              placeholder="6-digit code"
              helperText="In local development, check the backend terminal for the code."
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-medium text-[#1D5BD8] hover:underline"
              >
                Edit phone or email
              </button>
              <button
                type="button"
                disabled={isSending || cooldownSeconds > 0}
                onClick={() => void sendCode()}
                className="text-xs font-medium text-[#1D5BD8] hover:underline disabled:text-slate-400 disabled:no-underline"
              >
                {cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : 'Resend code'}
              </button>
            </div>
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              leftIcon={<LockKeyhole className="h-4 w-4" />}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              error={
                confirmPassword && password !== confirmPassword
                  ? 'Passwords do not match.'
                  : undefined
              }
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <Button type="submit" className="w-full" isLoading={isResetting}>
              Reset password
            </Button>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-900/70 dark:bg-emerald-950/30">
            <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
              Your password has been updated. Other active sessions have been signed out.
            </p>
            <Button className="w-full" onClick={() => onNavigate('/login')}>
              Return to sign in
            </Button>
          </div>
        )}

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
