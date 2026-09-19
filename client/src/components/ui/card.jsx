import React from 'react';
import { cn } from '../../utils/cn';

export const Card = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:border-zinc-300 hover:shadow-md text-zinc-950',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
Card.displayName = 'Card';

export const CardHeader = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6 border-b border-zinc-100 bg-zinc-50/50', className)}
    {...props}
  >
    {children}
  </div>
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-bold leading-none tracking-tight text-zinc-950 font-display', className)}
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-zinc-500', className)}
    {...props}
  >
    {children}
  </p>
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('p-6', className)} {...props}>
    {children}
  </div>
));
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0 border-t border-zinc-100 mt-4', className)}
    {...props}
  >
    {children}
  </div>
));
CardFooter.displayName = 'CardFooter';
