import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Check,
  Clock,
  CreditCard,
  UserCheck,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useClinicData } from '../../lib/hooks/useClinic';
import { useToast } from '../../components/ui/Toast';
import { formatTimeSafe, formatDateSafe } from '../../lib/utils';

export const NotificationsPage: React.FC<{ onNavigate: (path: string) => void }> = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useClinicData();
  const { success } = useToast();
  const [filterType, setFilterType] = useState<string>('all');

  const filteredNotifications = notifications.filter(n => {
    if (filterType === 'unread') return !n.read;
    if (filterType !== 'all') return n.type === filterType;
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'queue':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'appointment':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'delay':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-cyan-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-white via-white to-blue-50/40 dark:from-[#121214] dark:to-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Operational broadcast alerts, check-ins, payment receipts, and schedule notices
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            markAllNotificationsAsRead();
            success('All notifications marked as read.');
          }}
          leftIcon={<CheckCheck className="w-4 h-4 text-slate-600 dark:text-zinc-300" />}
        >
          Mark All as Read
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { label: 'All Alerts', val: 'all' },
          { label: 'Unread Only', val: 'unread' },
          { label: 'Queue & Tickets', val: 'queue' },
          { label: 'Appointments', val: 'appointment' },
          { label: 'Payments', val: 'payment' },
          { label: 'Delays', val: 'delay' }
        ].map(tab => (
          <button
            key={tab.val}
            onClick={() => setFilterType(tab.val)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filterType === tab.val
                ? 'bg-[#1D5BD8] text-white shadow-xs'
                : 'bg-white dark:bg-[#121214] border border-slate-200/80 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-[#F8FAFC] dark:hover:bg-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-[#121214] p-12 text-center rounded-2xl border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-400 dark:text-zinc-500">
            No notifications in this category.
          </div>
        ) : (
          filteredNotifications.map(item => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                !item.read
                  ? 'bg-gradient-to-r from-white to-blue-50/40 dark:from-[#121214] dark:to-blue-950/20 border-blue-200/80 dark:border-blue-900 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] ring-1 ring-blue-500/15'
                  : 'bg-white dark:bg-[#121214] border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 shadow-[0_1px_3px_0_rgba(15,23,42,0.02)] hover:border-slate-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-zinc-800 border border-slate-200/70 dark:border-zinc-700 shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{item.title}</span>
                    {!item.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                    {formatDateSafe(item.timestamp)} · {formatTimeSafe(item.timestamp)}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-zinc-300 leading-relaxed text-xs">{item.message}</p>
              </div>

              {!item.read && (
                <button
                  onClick={() => markNotificationAsRead(item.id)}
                  title="Mark as read"
                  className="p-1 rounded text-slate-400 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
