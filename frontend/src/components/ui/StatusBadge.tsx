import React from 'react';
import { cn } from '../../lib/utils';
import {
  AppointmentStatus,
  QueueStatus,
  PaymentStatus,
  DoctorAvailability,
  PriorityLevel
} from '../../types';

interface StatusBadgeProps {
  status: AppointmentStatus | QueueStatus | PaymentStatus | DoctorAvailability | PriorityLevel | string;
  type?: 'appointment' | 'queue' | 'payment' | 'availability' | 'priority' | 'generic';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'generic',
  className
}) => {
  let label = status;
  let dotColor = 'bg-[#667085] dark:bg-zinc-400';
  let textColor = 'text-[#667085] dark:text-zinc-300';
  let bgColor = 'bg-[#F7FAFC] border-[#E6EAF0] dark:bg-zinc-800/70 dark:border-zinc-700';

  if (type === 'queue' || status === 'waiting' || status === 'called' || status === 'in_consultation' || status === 'completed') {
    switch (status) {
      case 'waiting':
        label = 'Waiting';
        dotColor = 'bg-[#F59E0B] dark:bg-amber-400';
        textColor = 'text-[#B45309] dark:text-amber-300';
        bgColor = 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/60';
        break;
      case 'called':
        label = 'Called to Room';
        dotColor = 'bg-[#1D5BD8] dark:bg-[#60A5FA] animate-pulse';
        textColor = 'text-[#1D5BD8] dark:text-[#93C5FD]';
        bgColor = 'bg-[#EFF4FF] border-[#BFDBFE] dark:bg-blue-950/40 dark:border-blue-800/60';
        break;
      case 'in_consultation':
        label = 'In Consultation';
        dotColor = 'bg-[#1548B0] dark:bg-blue-400';
        textColor = 'text-[#1D5BD8] dark:text-[#93C5FD]';
        bgColor = 'bg-[#EFF4FF] border-[#BFDBFE] dark:bg-blue-950/40 dark:border-blue-800/60';
        break;
      case 'completed':
        label = 'Completed';
        dotColor = 'bg-[#22A06B] dark:bg-emerald-400';
        textColor = 'text-[#15803D] dark:text-emerald-300';
        bgColor = 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/60';
        break;
      case 'skipped':
        label = 'Recalled';
        dotColor = 'bg-[#667085] dark:bg-zinc-400';
        textColor = 'text-[#667085] dark:text-zinc-300';
        bgColor = 'bg-[#F7FAFC] border-[#E6EAF0] dark:bg-zinc-800/70 dark:border-zinc-700';
        break;
    }
  } else if (type === 'appointment') {
    switch (status) {
      case 'scheduled':
        label = 'Scheduled';
        dotColor = 'bg-[#667085] dark:bg-zinc-400';
        textColor = 'text-[#172033] dark:text-zinc-200';
        bgColor = 'bg-[#F7FAFC] border-[#E6EAF0] dark:bg-zinc-800/70 dark:border-zinc-700';
        break;
      case 'confirmed':
        label = 'Confirmed';
        dotColor = 'bg-[#1D5BD8] dark:bg-[#60A5FA]';
        textColor = 'text-[#1D5BD8] dark:text-[#93C5FD]';
        bgColor = 'bg-[#EFF4FF] border-[#BFDBFE] dark:bg-blue-950/40 dark:border-blue-800/60';
        break;
      case 'checked_in':
        label = 'Checked In';
        dotColor = 'bg-[#1548B0] dark:bg-blue-400';
        textColor = 'text-[#1D5BD8] dark:text-[#93C5FD]';
        bgColor = 'bg-[#EFF4FF] border-[#BFDBFE] dark:bg-blue-950/40 dark:border-blue-800/60';
        break;
      case 'in_consultation':
        label = 'In Consultation';
        dotColor = 'bg-[#1548B0] dark:bg-blue-400';
        textColor = 'text-[#1D5BD8] dark:text-[#93C5FD]';
        bgColor = 'bg-[#EFF4FF] border-[#BFDBFE] dark:bg-blue-950/40 dark:border-blue-800/60';
        break;
      case 'completed':
        label = 'Completed';
        dotColor = 'bg-[#22A06B] dark:bg-emerald-400';
        textColor = 'text-[#15803D] dark:text-emerald-300';
        bgColor = 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/60';
        break;
      case 'cancelled':
        label = 'Cancelled';
        dotColor = 'bg-[#DC3545] dark:bg-rose-400';
        textColor = 'text-[#B91C1C] dark:text-rose-300';
        bgColor = 'bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800/60';
        break;
      case 'no_show':
        label = 'No Show';
        dotColor = 'bg-[#F59E0B] dark:bg-amber-400';
        textColor = 'text-[#B45309] dark:text-amber-300';
        bgColor = 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/60';
        break;
    }
  } else if (type === 'payment') {
    switch (status) {
      case 'confirmed':
        label = 'Confirmed';
        dotColor = 'bg-[#22A06B] dark:bg-emerald-400';
        textColor = 'text-[#15803D] dark:text-emerald-300';
        bgColor = 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/60';
        break;
      case 'pending':
        label = 'Pending';
        dotColor = 'bg-[#F59E0B] dark:bg-amber-400';
        textColor = 'text-[#B45309] dark:text-amber-300';
        bgColor = 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/60';
        break;
      case 'cancelled':
        label = 'Cancelled';
        dotColor = 'bg-[#DC3545] dark:bg-rose-400';
        textColor = 'text-[#B91C1C] dark:text-rose-300';
        bgColor = 'bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800/60';
        break;
      case 'refunded':
        label = 'Refunded';
        dotColor = 'bg-[#667085] dark:bg-zinc-400';
        textColor = 'text-[#667085] dark:text-zinc-300';
        bgColor = 'bg-[#F7FAFC] border-[#E6EAF0] dark:bg-zinc-800/70 dark:border-zinc-700';
        break;
    }
  } else if (type === 'availability') {
    switch (status) {
      case 'available':
        label = 'Available';
        dotColor = 'bg-[#22A06B] dark:bg-emerald-400';
        textColor = 'text-[#15803D] dark:text-emerald-300';
        bgColor = 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/60';
        break;
      case 'busy':
        label = 'With Patient';
        dotColor = 'bg-[#F59E0B] dark:bg-amber-400';
        textColor = 'text-[#B45309] dark:text-amber-300';
        bgColor = 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/60';
        break;
      case 'off_duty':
        label = 'Off Duty';
        dotColor = 'bg-[#667085] dark:bg-zinc-400';
        textColor = 'text-[#667085] dark:text-zinc-300';
        bgColor = 'bg-[#F7FAFC] border-[#E6EAF0] dark:bg-zinc-800/70 dark:border-zinc-700';
        break;
    }
  } else if (type === 'priority') {
    switch (status) {
      case 'urgent':
        label = 'Urgent Priority';
        dotColor = 'bg-[#DC3545] dark:bg-rose-400 animate-pulse';
        textColor = 'text-[#B91C1C] dark:text-rose-300 font-semibold';
        bgColor = 'bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800/60';
        break;
      case 'elderly_child':
        label = 'Child / Elderly';
        dotColor = 'bg-purple-500 dark:bg-purple-400';
        textColor = 'text-purple-700 dark:text-purple-300';
        bgColor = 'bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800/60';
        break;
      case 'follow_up':
        label = 'Follow Up';
        dotColor = 'bg-[#1D5BD8] dark:bg-[#60A5FA]';
        textColor = 'text-[#1D5BD8] dark:text-[#93C5FD]';
        bgColor = 'bg-[#EFF4FF] border-[#BFDBFE] dark:bg-blue-950/40 dark:border-blue-800/60';
        break;
      case 'normal':
      default:
        label = 'Normal Priority';
        dotColor = 'bg-[#667085] dark:bg-zinc-400';
        textColor = 'text-[#667085] dark:text-zinc-300';
        bgColor = 'bg-[#F7FAFC] border-[#E6EAF0] dark:bg-zinc-800/70 dark:border-zinc-700';
        break;
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tabular-nums',
        bgColor,
        textColor,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
