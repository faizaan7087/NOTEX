import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight } from 'lucide-react';

const DEFAULT_PLACEHOLDERS = [
  'Search Database Normalization & 3NF...',
  'Search Operating Systems & Semaphores...',
  'Search Data Structures & Algorithms...',
  'Search Unit-1, Lecture notes, formulas...',
  'Search Machine Learning & Neural Networks...',
  'Search by #tag (e.g., #midterm, #viva)...'
];

export const GooeyInput = ({
  value = '',
  onChange,
  onSubmit,
  onClear,
  placeholders = DEFAULT_PLACEHOLDERS,
  className = '',
  autoFocus = false
}) => {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Cycle placeholder text when input is empty and not actively typing
  useEffect(() => {
    if (value) return;
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [value, placeholders.length]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(value);
  };

  const handleClear = () => {
    onChange?.('');
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      {/* SVG Gooey Filter Definition */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="gooey-search-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <form
        onSubmit={handleSubmit}
        className="relative w-full flex items-center"
      >
        {/* Animated Gooey Pill Container */}
        <motion.div
          animate={{
            boxShadow: isFocused
              ? '0 0 0 2px rgba(0,0,0,0.1), 0 8px 24px -4px rgba(0,0,0,0.08)'
              : '0 1px 3px 0 rgba(0,0,0,0.03)',
            borderColor: isFocused ? '#18181b' : 'rgba(228, 228, 231, 0.9)'
          }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative w-full flex items-center h-11 px-3.5 bg-white/95 backdrop-blur-md border rounded-2xl transition-colors overflow-hidden"
        >
          {/* Search Icon with subtle pulse on focus */}
          <motion.div
            animate={{ scale: isFocused ? 1.08 : 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center text-zinc-400 mr-2.5 shrink-0"
          >
            <Search className={`w-4 h-4 transition-colors ${isFocused ? 'text-black' : 'text-zinc-400'}`} />
          </motion.div>

          {/* Text Input */}
          <div className="relative flex-1 flex items-center h-full min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoFocus={autoFocus}
              className="w-full h-full bg-transparent border-none outline-none text-xs sm:text-sm text-zinc-950 font-medium placeholder-transparent focus:ring-0 z-10 pr-2"
            />

            {/* Rotating Animated Placeholder */}
            {!value && (
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none select-none overflow-hidden max-w-full">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentPlaceholder}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    className="text-xs sm:text-sm text-zinc-400 truncate"
                  >
                    {placeholders[currentPlaceholder]}
                  </motion.p>
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Action Buttons: Clear (X) and Submit Arrow */}
          <div className="flex items-center gap-1 shrink-0 ml-1 z-10">
            {value && (
              <motion.button
                type="button"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClear}
                className="p-1 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            )}

            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              className={`p-1.5 rounded-xl transition-all ${
                value.trim()
                  ? 'bg-black text-white shadow-2xs'
                  : 'text-zinc-300 hover:text-zinc-600'
              }`}
              title="Search"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </motion.div>
      </form>
    </div>
  );
};
