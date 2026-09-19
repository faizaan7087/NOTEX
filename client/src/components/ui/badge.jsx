import React from 'react';
import { cn } from '../../utils/cn';

// Minimalist monochrome badge palette for clean light aesthetic
export const getSubjectColor = (subject = '') => {
  return 'bg-zinc-100 text-zinc-900 border-zinc-200';
};

export const Badge = ({
  className,
  variant = 'default',
  subject = null,
  children,
  ...props
}) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all';

  let variantStyle = 'bg-zinc-100 text-zinc-800 border-zinc-200';

  if (subject) {
    variantStyle = 'bg-zinc-100 text-zinc-900 border-zinc-300 font-semibold shadow-sm';
  } else if (variant === 'primary') {
    variantStyle = 'bg-black text-white font-semibold border-black shadow-sm';
  } else if (variant === 'outline') {
    variantStyle = 'bg-transparent text-zinc-700 border-zinc-300 hover:border-zinc-400';
  } else if (variant === 'tag') {
    variantStyle = 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:text-zinc-900';
  } else if (variant === 'shimmer') {
    variantStyle = 'bg-zinc-100 text-zinc-900 border-zinc-300';
  }

  return (
    <span className={cn(base, variantStyle, className)} {...props}>
      {children}
    </span>
  );
};
