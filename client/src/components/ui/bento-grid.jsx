import React from 'react';
import { cn } from '../../utils/cn';

export const BentoGrid = ({ className, children }) => {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[auto]',
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoCard = ({
  className,
  title,
  value,
  description,
  icon: Icon,
  trend,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative group overflow-hidden rounded-2xl glass-card p-5 cursor-default',
        onClick && 'cursor-pointer hover:border-black/30',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 font-display">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-950 tracking-tight font-display">
              {value}
            </span>
            {trend && (
              <span className="text-xs font-medium text-black bg-white/80 px-2 py-0.5 rounded-full border border-zinc-200 shadow-2xs">
                {trend}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-zinc-500 font-medium pt-1">
              {description}
            </p>
          )}
        </div>

        {Icon && (
          <div className="p-3 rounded-xl bg-black/5 border border-black/5 text-zinc-900 group-hover:bg-black group-hover:text-white transition-all duration-300">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};
