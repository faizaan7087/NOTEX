import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      disabled = false,
      loading = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none';

    const variants = {
      default:
        'bg-black hover:bg-zinc-800 text-white font-semibold shadow-xs border border-black hover:shadow-md',
      glow:
        'bg-black hover:bg-zinc-800 text-white font-bold shadow-md hover:shadow-lg border border-black',
      outline:
        'border border-zinc-200/90 bg-white hover:bg-zinc-100 text-zinc-900 shadow-2xs hover:border-zinc-300',
      secondary:
        'bg-zinc-100 hover:bg-zinc-200/90 text-zinc-900 border border-zinc-200/80',
      ghost:
        'hover:bg-zinc-100 text-zinc-600 hover:text-black',
      glass:
        'bg-white/80 hover:bg-white text-zinc-900 border border-zinc-200/90 shadow-2xs backdrop-blur-md',
      danger:
        'bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-xl',
      default: 'text-sm px-4 py-2.5 gap-2 rounded-xl',
      lg: 'text-base px-6 py-3 gap-2.5 rounded-2xl font-semibold',
      icon: 'p-2 rounded-xl',
    };

    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        whileHover={!disabled && !loading ? { scale: 1.015 } : {}}
        whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
