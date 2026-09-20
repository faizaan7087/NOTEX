import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-2xl',
  className,
  hideHeader = false
}) => {
  const contentRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      // Reset inner scroll position to top whenever modal opens
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        className={cn(
          'relative w-full max-h-[90vh] flex flex-col rounded-3xl bg-white/95 backdrop-blur-xl border border-zinc-200/90 shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200 text-zinc-900',
          maxWidth,
          className
        )}
      >
        {/* Header */}
        {!hideHeader && (
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-zinc-200/80 bg-white/60 shrink-0">
            <div>
              {title && <h3 className="text-xl font-bold text-zinc-950 font-display">{title}</h3>}
              {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors shadow-2xs"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body Content with independent scroll starting at top */}
        <div 
          ref={contentRef}
          className="p-5 sm:p-6 overflow-y-auto flex-1 overscroll-contain"
        >
          {children}
        </div>
      </div>
    </div>
  );
};

