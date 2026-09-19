import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-2xl',
  className
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        className={cn(
          'relative w-full rounded-3xl glass-modal z-10 overflow-hidden animate-in zoom-in-95 duration-200 text-zinc-900',
          maxWidth,
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200/60 bg-white/40">
          <div>
            {title && <h3 className="text-xl font-bold text-zinc-950 font-display">{title}</h3>}
            {description && <p className="text-sm text-zinc-500 mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white/80 transition-colors shadow-2xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
