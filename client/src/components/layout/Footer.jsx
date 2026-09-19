import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Sparkles, 
  Command, 
  HardDrive, 
  ShieldCheck, 
  Heart,
  Terminal,
  Cpu
} from 'lucide-react';
import { APP_NAME, APP_CONFIG } from '../../constants/app';

export const Footer = () => {
  return (
    <footer className="w-full mt-20 pb-16 px-4 sm:px-6 lg:px-8 text-zinc-500 text-xs select-none">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Sleek Floating Glass Status Ribbon */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/70 backdrop-blur-xl border border-zinc-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-sm text-zinc-950 tracking-tight">
                  {APP_NAME}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  v1.0.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                {APP_CONFIG.TAGLINE}
              </p>
            </div>
          </div>

          {/* Quick Keyboard Shortcut Pills */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100/80 border border-zinc-200/70 text-[11px] text-zinc-600 font-mono">
              <kbd className="px-1 py-0.5 rounded bg-white text-zinc-800 text-[10px] font-bold shadow-2xs border border-zinc-200">⌘K</kbd>
              <span>Search</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100/80 border border-zinc-200/70 text-[11px] text-zinc-600 font-mono">
              <kbd className="px-1 py-0.5 rounded bg-white text-zinc-800 text-[10px] font-bold shadow-2xs border border-zinc-200">⌘S</kbd>
              <span>Save</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100/80 border border-zinc-200/70 text-[11px] text-zinc-600 font-mono">
              <kbd className="px-1 py-0.5 rounded bg-white text-zinc-800 text-[10px] font-bold shadow-2xs border border-zinc-200">ESC</kbd>
              <span>Close</span>
            </div>
          </div>

          {/* Live Cloud Status */}
          <div className="flex items-center gap-2 text-[11px] text-zinc-600 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-zinc-700 font-semibold">Vault Online</span>
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-400 font-mono">Google Drive Synced</span>
          </div>
        </div>

        {/* Bottom Micro Copy */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-2 text-[11px] text-zinc-400">
          <p>
            Designed for engineers, students &amp; researchers
          </p>
          <p className="flex items-center gap-1 font-mono">
            <span>Built with React + Vite + Express</span>
          </p>
        </div>

      </div>
    </footer>
  );
};
