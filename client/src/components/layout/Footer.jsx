import React, { useState } from 'react';
import { Modal } from '../ui/modal';
import { APP_NAME, APP_CONFIG } from '../../constants/app';
import notexLogoTransparent from '../../assets/notex-logo-transparent.png';

export const Footer = () => {
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  return (
    <>
      <footer className="w-full mt-10 sm:mt-14 border-t border-zinc-200/80 bg-white/60 backdrop-blur-md py-4 px-4 sm:px-6 lg:px-8 text-zinc-500 text-xs select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          
          {/* Left: Brand, Tagline & Copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center p-0.5 border border-zinc-200/80 shadow-2xs shrink-0">
                <img src={notexLogoTransparent} alt="NOTEX Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-display font-extrabold text-sm tracking-tight text-zinc-950">
                {APP_NAME}
              </span>
              <span className="text-zinc-300">•</span>
              <span className="font-mono text-[11px] font-semibold text-zinc-600">
                {APP_CONFIG.TAGLINE}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <span className="hidden sm:inline text-zinc-300">•</span>
              <span>© {new Date().getFullYear()} {APP_NAME} Inc.</span>
            </div>
          </div>

          {/* Right: Quick Shortcuts Pill (Desktop / Tablet) */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-50 border border-zinc-200/80 text-[11px] font-mono text-zinc-700 shadow-2xs">
              <kbd className="px-1 py-0.2 rounded text-[10px] font-bold bg-white text-zinc-800 border border-zinc-200">⌘K</kbd>
              <span className="text-zinc-400">Search</span>
              <span className="text-zinc-300">/</span>
              <kbd className="px-1 py-0.2 rounded text-[10px] font-bold bg-white text-zinc-800 border border-zinc-200">⌘S</kbd>
              <span className="text-zinc-400">Save</span>
              <span className="text-zinc-300">/</span>
              <kbd className="px-1 py-0.2 rounded text-[10px] font-bold bg-white text-zinc-800 border border-zinc-200">ESC</kbd>
              <span className="text-zinc-400">Close</span>
            </div>
            <button 
              onClick={() => setShowShortcutsModal(true)}
              className="text-[11px] font-medium text-zinc-400 hover:text-zinc-900 transition-colors ml-1 cursor-pointer underline"
            >
              Shortcuts
            </button>
          </div>

        </div>
      </footer>

      {/* Keyboard Shortcuts Reference Modal */}
      <Modal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        title="Keyboard Shortcuts Reference"
        description="Speed up your academic workflow with keyboard accelerators"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-xs text-zinc-700 max-h-[60vh] overflow-y-auto pr-1">
          <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-xl overflow-hidden">
            <div className="p-3 bg-zinc-50 font-bold text-zinc-900 flex items-center justify-between text-xs">
              <span>Action</span>
              <span>Key Shortcut</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span>Global Notes Search</span>
              <kbd className="px-2 py-1 rounded bg-zinc-100 border border-zinc-200 font-mono text-[11px] font-bold">⌘K / Ctrl+K</kbd>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span>Quick Save Note</span>
              <kbd className="px-2 py-1 rounded bg-zinc-100 border border-zinc-200 font-mono text-[11px] font-bold">⌘S / Ctrl+S</kbd>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span>Close Active Modal / Reader</span>
              <kbd className="px-2 py-1 rounded bg-zinc-100 border border-zinc-200 font-mono text-[11px] font-bold">ESC</kbd>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span>Bold Text in Markdown</span>
              <kbd className="px-2 py-1 rounded bg-zinc-100 border border-zinc-200 font-mono text-[11px] font-bold">⌘B / Ctrl+B</kbd>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span>Italicize Text</span>
              <kbd className="px-2 py-1 rounded bg-zinc-100 border border-zinc-200 font-mono text-[11px] font-bold">⌘I / Ctrl+I</kbd>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span>Insert Inline Code Block</span>
              <kbd className="px-2 py-1 rounded bg-zinc-100 border border-zinc-200 font-mono text-[11px] font-bold">`code`</kbd>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
