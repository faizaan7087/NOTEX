import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  Terminal, 
  Cpu, 
  ExternalLink, 
  Lock, 
  CheckCircle2, 
  FileText, 
  Globe, 
  HelpCircle, 
  Layers, 
  Activity, 
  Command,
  Heart,
  ChevronRight,
  Code2
} from 'lucide-react';
import { Modal } from '../ui/modal';
import { APP_NAME, APP_CONFIG } from '../../constants/app';
import notexLogoTransparent from '../../assets/notex-logo-transparent.png';

export const Footer = ({ navigateTo, isAIPage = false }) => {
  const [activeModal, setActiveModal] = useState(null);

  const handleNavigate = (page) => {
    if (navigateTo) {
      navigateTo(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <footer className="w-full mt-24 border-t border-zinc-200/90 bg-white/70 backdrop-blur-xl pt-14 pb-12 px-4 sm:px-6 lg:px-8 text-zinc-600 text-xs select-none">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Top Multi-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
            
            {/* Column 1 & 2: Brand, Identity, Status */}
            <div className="lg:col-span-2 space-y-4 pr-0 lg:pr-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center p-1 border border-zinc-200/80 shadow-2xs shrink-0">
                  <img src={notexLogoTransparent} alt="NOTEX Logo" className="w-full h-full object-contain" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-base tracking-tight text-zinc-950">
                    {APP_NAME}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                    v1.0.0
                  </span>
                </div>
              </div>

              <p className="font-mono text-xs font-semibold text-zinc-700">
                {APP_CONFIG.TAGLINE}
              </p>

              <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
                The intelligent academic vault and real-time AI whiteboard. Built with speed and local-first architecture for engineering students and researchers to organize coursework and master complex algorithms.
              </p>
            </div>

            {/* Column 3: Platform & Vault */}
            <div className="space-y-3">
              <h4 className="font-mono text-[11px] font-bold text-zinc-900 uppercase tracking-wider">
                Platform
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button 
                    onClick={() => handleNavigate('dashboard')} 
                    className="text-zinc-600 hover:text-zinc-950 transition-colors text-left"
                  >
                    Dashboard Overview
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleNavigate('notes')} 
                    className="text-zinc-600 hover:text-zinc-950 transition-colors text-left"
                  >
                    Academic Notes & Units
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleNavigate('arex')} 
                    className="text-zinc-600 hover:text-zinc-950 transition-colors text-left"
                  >
                    Arex AI Whiteboard
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleNavigate('reminders')} 
                    className="text-zinc-600 hover:text-zinc-950 transition-colors text-left"
                  >
                    Study Reminders
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleNavigate('settings')} 
                    className="text-zinc-600 hover:text-zinc-950 transition-colors text-left"
                  >
                    Vault & Settings
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Resources & Guides */}
            <div className="space-y-3">
              <h4 className="font-mono text-[11px] font-bold text-zinc-900 uppercase tracking-wider">
                Resources
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button 
                    onClick={() => setActiveModal('shortcuts')} 
                    className="text-zinc-600 hover:text-zinc-950 transition-colors text-left flex items-center gap-1"
                  >
                    <span>Keyboard Shortcuts</span>
                    <Command className="w-3 h-3 text-zinc-400" />
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveModal('markdown')} 
                    className="text-zinc-600 hover:text-zinc-950 transition-colors text-left"
                  >
                    Markdown & KaTeX Guide
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveModal('sync')} 
                    className="text-zinc-600 hover:text-zinc-950 transition-colors text-left"
                  >
                    Google Drive Syncing
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveModal('architecture')} 
                    className="text-zinc-600 hover:text-zinc-950 transition-colors text-left"
                  >
                    System Architecture
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleNavigate('settings')} 
                    className="text-zinc-600 hover:text-zinc-950 transition-colors text-left"
                  >
                    Account & Profile
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 5: Legal & Security */}
            <div className="space-y-3">
              <h4 className="font-mono text-[11px] font-bold text-zinc-900 uppercase tracking-wider">
                Legal & Trust
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button 
                    onClick={() => setActiveModal('privacy')} 
                    className="text-zinc-600 hover:text-zinc-950 transition-colors text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveModal('terms')} 
                    className="text-zinc-600 hover:text-zinc-950 transition-colors text-left"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveModal('security')} 
                    className="text-zinc-600 hover:text-zinc-950 transition-colors text-left"
                  >
                    Security & Data Governance
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveModal('cookies')} 
                    className="text-zinc-600 hover:text-zinc-950 transition-colors text-left"
                  >
                    Cookie Preferences
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveModal('licenses')} 
                    className="text-zinc-600 hover:text-zinc-950 transition-colors text-left"
                  >
                    Open Source Licenses
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* Quick Shortcuts Floating Ribbon */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-600 text-xs font-medium">
              <Command className="w-3.5 h-3.5 text-zinc-500" />
              <span>Keyboard Navigation:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono bg-white border border-zinc-200 text-zinc-700 shadow-2xs">
                <kbd className="px-1 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">⌘K</kbd>
                <span>Search</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono bg-white border border-zinc-200 text-zinc-700 shadow-2xs">
                <kbd className="px-1 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">⌘S</kbd>
                <span>Save</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono bg-white border border-zinc-200 text-zinc-700 shadow-2xs">
                <kbd className="px-1 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">ESC</kbd>
                <span>Close</span>
              </div>
              <button 
                onClick={() => setActiveModal('shortcuts')}
                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 underline ml-1"
              >
                View all shortcuts
              </button>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Rights Reserved */}
          <div className="pt-6 border-t border-zinc-200/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            
            {/* Copyright Statement */}
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center sm:text-left">
              <span className="font-semibold text-zinc-800">
                © {new Date().getFullYear()} {APP_NAME} Inc.
              </span>
              <span className="hidden sm:inline text-zinc-300">•</span>
              <span>All rights reserved.</span>
            </div>

            {/* University & Engineering Note */}
            <div className="text-center text-[11px] text-zinc-400">
              Engineered with precision for modern computer science &amp; engineering students.
            </div>

            {/* Quick Legal Links */}
            <div className="flex items-center gap-4 text-[11px]">
              <button 
                onClick={() => setActiveModal('privacy')} 
                className="hover:text-zinc-900 transition-colors"
              >
                Privacy
              </button>
              <button 
                onClick={() => setActiveModal('terms')} 
                className="hover:text-zinc-900 transition-colors"
              >
                Terms
              </button>
              <button 
                onClick={() => setActiveModal('security')} 
                className="hover:text-zinc-900 transition-colors"
              >
                Security
              </button>
              <button 
                onClick={() => setActiveModal('licenses')} 
                className="hover:text-zinc-900 transition-colors"
              >
                Licenses
              </button>
            </div>

          </div>

        </div>
      </footer>

      {/* Interactive Legal & Resource Modals */}
      <Modal
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
        title="Privacy Policy"
        description="Last updated: November 2026 • Transparent, local-first academic data governance"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs text-zinc-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <section className="space-y-1.5">
            <h4 className="font-bold text-zinc-900 text-sm">1. Data Ownership & Local-First Philosophy</h4>
            <p>
              Your academic notes, study guides, diagrams, and folder structures are your intellectual property. NOTEX operates on a local-first architecture. All content you author remains stored in your private browser storage and your synchronized Google Drive vault.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-zinc-900 text-sm">2. Google Drive Permissions Boundary</h4>
            <p>
              NOTEX requests the restrictive <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded border border-zinc-200">drive.file</code> OAuth permission scope. This explicitly prevents NOTEX from viewing, modifying, or reading any existing files or folders in your Google Drive outside the isolated <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded border border-zinc-200">NOTEX_Vault</code> folder.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-zinc-900 text-sm">3. Zero Third-Party Telemetry</h4>
            <p>
              We do not sell student data, track browsing activity across the web, or embed third-party advertising scripts. Telemetry is restricted strictly to critical application error reporting.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-zinc-900 text-sm">4. Data Deletion & Export</h4>
            <p>
              You have the permanent right to export your complete academic vault in standard Markdown and JSON formats at any time. Deleting your account immediately expunges all stored credentials and records from our database.
            </p>
          </section>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'terms'}
        onClose={() => setActiveModal(null)}
        title="Terms of Service"
        description="Standard academic terms governing the use of NOTEX and Arex Studio"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs text-zinc-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <section className="space-y-1.5">
            <h4 className="font-bold text-zinc-900 text-sm">1. Acceptance of Terms</h4>
            <p>
              By accessing NOTEX, you agree to comply with these terms, our community guidelines, and all applicable laws. The platform is designed to assist educational research, academic revision, and collaborative note-taking.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-zinc-900 text-sm">2. Academic Integrity</h4>
            <p>
              NOTEX and Arex Studio are educational companions intended to clarify concepts, explain algorithms, and assist in structured learning. Users must uphold the academic integrity policies of their respective universities and institutions.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-zinc-900 text-sm">3. Availability & Service Guarantees</h4>
            <p>
              We strive for 99.9% uptime across all vault services and real-time WebRTC media servers. Offline note-taking remains available locally in your browser even during intermittent network disruptions.
            </p>
          </section>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'security'}
        onClose={() => setActiveModal(null)}
        title="Security & Data Governance"
        description="How we protect student vaults and real-time whiteboard sessions"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs text-zinc-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>AES-256 Storage</span>
              </span>
              <p className="text-[11px] text-zinc-500 mt-1">
                Data saved across client and server stores uses state-of-the-art encryption algorithms.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>WebRTC SRTP/DTLS</span>
              </span>
              <p className="text-[11px] text-zinc-500 mt-1">
                Audio and canvas data streams to Agent Arex are end-to-end encrypted with WebRTC security standards.
              </p>
            </div>
          </div>

          <section className="space-y-1.5">
            <h4 className="font-bold text-zinc-900 text-sm">Authentication Security</h4>
            <p>
              User passwords are salted and hashed using standard bcrypt rounds before persistence. Authentication utilizes secure HTTP-only session tokens and JWT authorization headers.
            </p>
          </section>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'shortcuts'}
        onClose={() => setActiveModal(null)}
        title="Keyboard Shortcuts Reference"
        description="Speed up your academic workflow with keyboard accelerators"
        maxWidth="max-w-2xl"
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

      <Modal
        isOpen={activeModal === 'markdown'}
        onClose={() => setActiveModal(null)}
        title="Markdown & KaTeX Math Guide"
        description="Syntax reference for writing clean academic notes and scientific formulas"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs text-zinc-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <section className="space-y-2">
            <h4 className="font-bold text-zinc-900 text-sm">Mathematical Formulas (KaTeX)</h4>
            <p>
              Use single dollar signs for inline math: <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded">$E = mc^2$</code>. Use double dollar signs for centered display equations:
            </p>
            <pre className="p-3 rounded-xl bg-zinc-950 text-zinc-200 font-mono text-[11px] overflow-x-auto">
              {"$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$"}
            </pre>
          </section>

          <section className="space-y-2">
            <h4 className="font-bold text-zinc-900 text-sm">Code Blocks & Syntax Highlighting</h4>
            <p>
              Use triple backticks followed by the language tag (e.g. cpp, python, javascript, sql):
            </p>
            <pre className="p-3 rounded-xl bg-zinc-950 text-zinc-200 font-mono text-[11px] overflow-x-auto">
              {"```python\ndef binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n```"}
            </pre>
          </section>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'sync'}
        onClose={() => setActiveModal(null)}
        title="Google Drive Syncing"
        description="How NOTEX backs up and syncs your coursework automatically"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs text-zinc-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <p>
            When connected, NOTEX maintains a mirror of your notes and folders in your Google Drive under a dedicated folder named <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded border border-zinc-200">NOTEX_Vault</code>.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-700">
            <li>Automatic real-time background sync when editing notes.</li>
            <li>Zero interference with personal files due to strict drive.file scoping.</li>
            <li>Seamless recovery if you sign in on another computer or browser.</li>
          </ul>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'architecture'}
        onClose={() => setActiveModal(null)}
        title="System Architecture"
        description="The technical foundation powering NOTEX"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs text-zinc-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <h4 className="font-bold text-zinc-900 text-sm">Client Layer</h4>
            <p>
              React 18 + Vite with Tailwind CSS, Lucide icons, KaTeX math formatting, and Framer Motion smooth micro-interactions.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-zinc-900 text-sm">Server & Storage Layer</h4>
            <p>
              Node.js + Express with MongoDB Atlas database storage and Google Drive API v3 sync engine.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-zinc-900 text-sm">AI Whiteboard Layer (Agent Arex)</h4>
            <p>
              Next.js 15, LiveKit WebRTC real-time voice and SVG canvas orchestration for interactive diagrammatic teaching.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'cookies'}
        onClose={() => setActiveModal(null)}
        title="Cookie & Storage Preferences"
        description="Essential local preferences used by NOTEX"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs text-zinc-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <p>
            NOTEX only stores strictly necessary cookies and local storage tokens for user authentication session management and language preferences. No marketing or tracking cookies are utilized.
          </p>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 font-medium">
            Strictly Essential Cookies Only: Active
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'licenses'}
        onClose={() => setActiveModal(null)}
        title="Open Source Licenses"
        description="Third-party open-source software libraries powering NOTEX"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3 text-xs text-zinc-600 max-h-[60vh] overflow-y-auto pr-1 font-mono text-[11px]">
          <p className="text-zinc-500 font-sans text-xs">
            NOTEX is built using open-source software under MIT and Apache 2.0 licenses:
          </p>
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
            <span className="font-bold text-zinc-900">React & Vite</span>
            <p className="text-zinc-500">MIT License • Copyright (c) Meta Platforms, Inc. and Vite contributors</p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
            <span className="font-bold text-zinc-900">Tailwind CSS & Lucide Icons</span>
            <p className="text-zinc-500">MIT License • Copyright (c) Tailwind Labs, Inc. & Lucide Project</p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
            <span className="font-bold text-zinc-900">KaTeX & Framer Motion</span>
            <p className="text-zinc-500">MIT License • Copyright (c) Khan Academy and Framer B.V.</p>
          </div>
        </div>
      </Modal>
    </>
  );
};
