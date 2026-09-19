import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(
  ({ className, type = 'text', label, error, helperText, icon: Icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
            {label} {props.required && <span className="text-black">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-3.5 text-zinc-400 pointer-events-none">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm transition-all duration-200 focus:border-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 disabled:cursor-not-allowed disabled:opacity-50',
              Icon && 'pl-10',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="text-xs font-medium text-rose-600 mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-zinc-500 mt-1">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef(
  ({ className, label, error, helperText, rows = 5, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
            {label} {props.required && <span className="text-black">*</span>}
          </label>
        )}
        <textarea
          rows={rows}
          className={cn(
            'flex w-full rounded-xl border border-zinc-300 bg-white p-4 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm transition-all duration-200 focus:border-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 disabled:cursor-not-allowed disabled:opacity-50 font-sans leading-relaxed resize-y',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs font-medium text-rose-600 mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-zinc-500 mt-1">{helperText}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
