import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'navy';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D5BD8] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none select-none whitespace-nowrap shrink-0 rounded-xl cursor-pointer group';

    const variants = {
      primary: 'bg-[#1D5BD8] text-white hover:bg-[#1548B0] active:bg-[#0F3280] shadow-xs border border-[#1D5BD8] dark:bg-[#1D5BD8] dark:hover:bg-[#2563EB]',
      secondary: 'bg-[#EFF4FF] dark:bg-[#1D5BD8]/20 text-[#1D5BD8] dark:text-[#93C5FD] hover:bg-[#DBEAFE] dark:hover:bg-[#1D5BD8]/30 active:bg-[#BFDBFE] border border-[#BFDBFE] dark:border-[#1D5BD8]/40',
      outline: 'border border-[#E6EAF0] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[#172033] dark:text-zinc-100 hover:bg-[#F7FAFC] dark:hover:bg-zinc-800 hover:border-[#1D5BD8]/50 hover:text-[#1D5BD8] dark:hover:text-[#93C5FD] active:bg-[#EFF4FF] dark:active:bg-[#1D5BD8]/20 shadow-2xs',
      ghost: 'text-[#172033] dark:text-zinc-200 hover:text-[#1D5BD8] dark:hover:text-[#93C5FD] hover:bg-[#EFF4FF] dark:hover:bg-zinc-800',
      danger: 'bg-[#DC3545] text-white hover:bg-[#c82333] active:bg-[#b01e2e] shadow-xs border border-[#DC3545]',
      navy: 'bg-[#172033] text-white hover:bg-[#25324d] active:bg-[#0e1420] shadow-xs border border-[#172033] dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-700'
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-9.5',
      lg: 'text-base px-5 py-2.5 gap-2.5 h-11'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="shrink-0 transition-transform duration-200 group-hover:translate-x-1">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
