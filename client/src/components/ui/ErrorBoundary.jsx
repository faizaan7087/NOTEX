import React from 'react';
import { AlertTriangle, RefreshCw, Home, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[NOTEX ErrorBoundary Caught Exception]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('notex_token');
      localStorage.removeItem('notex_ai_study_chat_history');
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
    window.location.href = '/';
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#0a0a0c] text-white flex items-center justify-center p-4 select-none">
          {/* Ambient glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-950/30 via-black to-black -z-10" />

          <div className="max-w-md w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-white font-display">
                Something interrupted NOTEX
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                An unexpected interface error occurred. Don't worry, your notes and data are safely saved.
              </p>
            </div>

            {/* Error Message Box */}
            {this.state.error && (
              <div className="bg-black/60 border border-zinc-800/80 rounded-xl p-3 text-left overflow-hidden">
                <p className="text-[11px] font-mono text-rose-300 break-words line-clamp-3">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Application
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-800 text-zinc-300 font-medium text-xs hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer border border-zinc-700/60"
                >
                  <Home className="w-3.5 h-3.5" />
                  Dashboard
                </button>

                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-800 text-zinc-300 font-medium text-xs hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-900/50 transition-colors cursor-pointer border border-zinc-700/60"
                  title="Clears local cache and reloads login"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Session
                </button>
              </div>
            </div>

            <p className="text-[10px] text-zinc-500 font-mono">
              NOTEX Study Platform • Auto Recovery Mode
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
