import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-[#172033] dark:text-slate-200">
            {label}
            {props.required && <span className="text-[#DC3545] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-[#667085] dark:text-slate-400 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full h-11 rounded-xl border border-[#E6EAF0] dark:border-zinc-700 bg-white dark:bg-[#18181b] px-3.5 text-sm text-[#172033] dark:text-zinc-100 placeholder:text-[#667085] dark:placeholder:text-zinc-500 focus:border-[#1D5BD8] focus:outline-none focus:ring-2 focus:ring-[#1D5BD8]/20 disabled:cursor-not-allowed disabled:bg-[#F7FAFC] dark:disabled:bg-zinc-900 disabled:text-[#667085] transition-all',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-[#DC3545] focus:border-[#DC3545] focus:ring-[#DC3545]/20',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-[#667085] dark:text-slate-400 pointer-events-none flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-[#DC3545] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#667085] dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, children, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-[#172033] dark:text-slate-200">
            {label}
            {props.required && <span className="text-[#DC3545] ml-0.5">*</span>}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'w-full h-11 rounded-xl border border-[#E6EAF0] dark:border-zinc-700 bg-white dark:bg-[#18181b] px-3.5 text-sm text-[#172033] dark:text-zinc-100 focus:border-[#1D5BD8] focus:outline-none focus:ring-2 focus:ring-[#1D5BD8]/20 disabled:cursor-not-allowed disabled:bg-[#F7FAFC] dark:disabled:bg-zinc-900 transition-all [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-[#18181b] dark:[&>option]:text-zinc-100',
            error && 'border-[#DC3545] focus:border-[#DC3545] focus:ring-[#DC3545]/20',
            className
          )}
          {...props}
        >
          {options
            ? options.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#18181b] text-[#172033] dark:text-zinc-100">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error ? (
          <p className="text-xs text-[#DC3545] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#667085] dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = 'Select';
