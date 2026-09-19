import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedTabs = ({
  tabs = [],
  activeTab,
  onChange,
  className = '',
  size = 'default'
}) => {
  return (
    <div className={`inline-flex items-center p-1 rounded-2xl bg-zinc-100/90 border border-zinc-200/80 backdrop-blur-md ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors z-10 select-none ${
              isActive ? 'text-black' : 'text-zinc-600 hover:text-black'
            } ${size === 'sm' ? 'px-2.5 py-1 text-[11px]' : ''}`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 rounded-xl bg-white shadow-xs border border-zinc-200/80"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-zinc-100 text-zinc-900 font-bold' : 'bg-zinc-200/60 text-zinc-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};
