import React, { useState } from "react";
import { Hospital, Phone, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";

export const ForgotPasswordPage: React.FC<{
  onNavigate: (path: string) => void;
}> = ({ onNavigate }) => {
  const { success } = useToast();
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    success("Reset instructions sent via SMS to " + phone);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#09090b] px-4 py-12 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#121214] p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#1D5BD8] flex items-center justify-center text-white">
            <Hospital className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            ClinicFlow
          </span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Reset Staff PIN / Password
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Enter the Ethiopian mobile number linked to your clinic account.
          </p>
        </div>

        {sent ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed font-medium">
              A temporary PIN has been dispatched via SMS. Use it to sign in and
              update your security code.
            </p>
            <Button size="sm" onClick={() => onNavigate("/login")}>
              Return to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Registered Mobile Number"
              required
              placeholder="+251 9... or 09..."
              leftIcon={<Phone className="w-4 h-4" />}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <Button type="submit" size="md" className="w-full">
              Send Reset Code via SMS
            </Button>
          </form>
        )}

        <div className="pt-2 text-center">
          <button
            onClick={() => onNavigate("/login")}
            className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
