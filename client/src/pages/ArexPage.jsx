import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Settings2, ExternalLink, ArrowRight, ShieldAlert, Globe, Check, RefreshCw } from 'lucide-react';

export const ArexPage = () => {
  const [arexUrl, setArexUrl] = useState(() => {
    return (
      import.meta.env.VITE_AREX_URL ||
      localStorage.getItem('notex_arex_url') ||
      (typeof window !== 'undefined' && window.location.protocol === 'https:'
        ? ''
        : 'http://localhost:3000')
    );
  });

  const [inputUrl, setInputUrl] = useState(arexUrl);
  const [showConfig, setShowConfig] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const iframeRef = useRef(null);

  // Check if we are in production HTTPS but trying to load insecure http://localhost
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isBlockedMixedContent = isHttps && (!arexUrl || arexUrl.startsWith('http://'));

  const handleSaveUrl = (e) => {
    e?.preventDefault();
    let cleaned = inputUrl.trim();
    if (cleaned && !cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = 'https://' + cleaned;
    }
    if (cleaned) {
      localStorage.setItem('notex_arex_url', cleaned);
      setArexUrl(cleaned);
      setInputUrl(cleaned);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setShowConfig(false);
      }, 1200);
    }
  };

  const handleResetToDefault = () => {
    localStorage.removeItem('notex_arex_url');
    const defaultUrl = import.meta.env.VITE_AREX_URL || (isHttps ? '' : 'http://localhost:3000');
    setArexUrl(defaultUrl);
    setInputUrl(defaultUrl);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen z-0 bg-[#09090B] text-white overflow-hidden flex flex-col">
      {/* If blocked by mixed content or no URL configured in production, show setup guide */}
      {isBlockedMixedContent || showConfig || !arexUrl ? (
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 sm:p-6 z-10 pt-20">
          <div className="max-w-xl w-full bg-zinc-950/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-[0_16px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-6">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Agent Arex Studio Setup
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Live Multimodal AI Whiteboard Endpoint
                  </p>
                </div>
              </div>

              {arexUrl && !isBlockedMixedContent && (
                <button
                  onClick={() => setShowConfig(false)}
                  className="px-3 py-1 text-xs text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
                >
                  Close
                </button>
              )}
            </div>

            {/* Insecure / Mixed Content Notice */}
            {isBlockedMixedContent && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-200">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Production Deployment Detected (HTTPS)</span>
                </div>
                <p className="text-[11px] text-amber-300/90">
                  Browsers block insecure <code className="font-mono bg-black/40 px-1 py-0.5 rounded">http://localhost:3000</code> iframes inside production HTTPS sites. To use Arex in production, deploy <code className="font-mono bg-black/40 px-1 py-0.5 rounded">Arex/frontend</code> to Vercel and enter its live URL below.
                </p>
              </div>
            )}

            {/* Endpoint Input Form */}
            <form onSubmit={handleSaveUrl} className="space-y-3">
              <label className="block text-xs font-semibold text-zinc-300">
                Arex Studio Production URL:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://notex-arex.vercel.app"
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputUrl.trim()}
                  className="px-4 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Connected!</span>
                    </>
                  ) : (
                    <>
                      <span>Connect</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-zinc-500">
                Or set <code className="font-mono text-zinc-400">VITE_AREX_URL</code> in your Vercel project environment variables.
              </p>
            </form>

            {/* Quick 2-Minute Deployment Instructions */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3 text-xs">
              <h4 className="font-bold text-zinc-200 text-xs flex items-center gap-1.5">
                <span>Deploy Arex on Vercel (1-Click)</span>
              </h4>
              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-zinc-400">
                <li>Go to <strong className="text-zinc-200">Vercel $\rightarrow$ Add New Project</strong>.</li>
                <li>Select the same repository: <code className="font-mono text-zinc-300">faizaan7087/NOTEX</code>.</li>
                <li>Set <strong className="text-zinc-200">Root Directory</strong> to: <code className="font-mono text-amber-300 bg-black/40 px-1 py-0.2 rounded">Arex/frontend</code>.</li>
                <li>Framework: <strong className="text-zinc-200">Next.js</strong> $\rightarrow$ Click <strong className="text-zinc-200">Deploy</strong>.</li>
                <li>Paste the assigned URL (e.g. <code className="font-mono text-zinc-300">https://notex-arex.vercel.app</code>) above!</li>
              </ol>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-xs">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset to default</span>
              </button>

              {inputUrl && (
                <a
                  href={inputUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>Open in new tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

          </div>
        </div>
      ) : (
        <>
          {/* Live Whiteboard Iframe */}
          <iframe
            ref={iframeRef}
            src={arexUrl}
            title="Agent Arex Live Multimodal AI Whiteboard"
            className="w-full h-full border-0 block"
            allow="camera; microphone; display-capture; autoplay; clipboard-write; clipboard-read"
          />

          {/* Floating Settings Trigger Pill */}
          <button
            onClick={() => setShowConfig(true)}
            title="Configure Arex URL"
            className="fixed bottom-4 right-4 z-50 p-2.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 shadow-xl backdrop-blur-md transition-all active:scale-95"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};
