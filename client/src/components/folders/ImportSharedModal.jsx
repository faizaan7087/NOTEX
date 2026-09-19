import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { 
  DownloadCloud, 
  User, 
  GraduationCap, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Folder, 
  Layers, 
  FileText,
  Search,
  Sparkles,
  Paperclip
} from 'lucide-react';

export const ImportSharedModal = ({
  isOpen,
  onClose,
  initialShareCode = '',
  onClonedSuccess
}) => {
  const toast = useToast();
  const [inputUrlOrCode, setInputUrlOrCode] = useState(initialShareCode || '');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [sharedRepo, setSharedRepo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialShareCode) {
      setInputUrlOrCode(initialShareCode);
      fetchPreview(initialShareCode);
    } else if (isOpen) {
      setSharedRepo(null);
      setErrorMsg('');
    }
  }, [isOpen, initialShareCode]);

  const extractCode = (str) => {
    if (!str) return '';
    const clean = str.trim();
    if (clean.includes('?share=')) {
      const parts = clean.split('?share=');
      return parts[1]?.split('&')[0] || '';
    }
    return clean;
  };

  const fetchPreview = async (rawInput) => {
    const code = extractCode(rawInput || inputUrlOrCode);
    if (!code) {
      setErrorMsg('Please enter a valid share link or share code.');
      return;
    }

    setLoadingPreview(true);
    setErrorMsg('');
    try {
      const res = await api.getSharedRepo(code);
      if (res.success) {
        setSharedRepo(res);
      }
    } catch (err) {
      console.error('[Preview Shared Error]:', err);
      if (err.data?.expired) {
        setErrorMsg(err.data.message || 'This share link has expired and is no longer accessible.');
      } else {
        setErrorMsg(err.message || 'Invalid or non-existent share link/code.');
      }
      setSharedRepo(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleClone = async () => {
    if (!sharedRepo?.shareCode) return;
    setCloning(true);
    try {
      const res = await api.cloneSharedRepo(sharedRepo.shareCode);
      if (res.success) {
        toast.success(res.message);
        onClose();
        if (onClonedSuccess) {
          onClonedSuccess(res.clonedFolderId);
        }
      }
    } catch (err) {
      console.error('[Clone Error]:', err);
      toast.error(err.message || 'Failed to clone shared repository.');
    } finally {
      setCloning(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clone Shared Notes Repository"
      description="Paste a classmate or professor's share link to copy their complete folder hierarchy and study notes into your workspace."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        
        {/* Input Bar */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
            Paste Share Link or Share Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. http://localhost:5173/?share=notex_bda_abc123 or notex_bda_abc123"
              value={inputUrlOrCode}
              onChange={(e) => {
                setInputUrlOrCode(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  fetchPreview(inputUrlOrCode);
                }
              }}
              className="flex-1 h-11 px-3.5 text-xs font-mono bg-white border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-black shadow-2xs placeholder:font-sans placeholder:text-zinc-400"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => fetchPreview(inputUrlOrCode)}
              loading={loadingPreview}
              disabled={!inputUrlOrCode.trim()}
              className="shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Inspect</span>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Repository Preview Card */}
        {sharedRepo && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header: Author & Course Details */}
            <div className="p-5 rounded-3xl bg-zinc-950 text-white space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center font-bold text-sm shadow-sm">
                    {sharedRepo.authorName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-zinc-100">{sharedRepo.authorName}</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Author
                      </span>
                    </div>
                    {sharedRepo.authorCollege && (
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>{sharedRepo.authorCollege}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-300 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Valid until: {new Date(sharedRepo.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              {/* Course Title & Counts */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Folder className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-extrabold text-white font-display">
                    {sharedRepo.folderName}
                  </h3>
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-300">
                  <span className="bg-zinc-800/80 px-2.5 py-1 rounded-xl border border-zinc-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{sharedRepo.totalSubfolders} Unit Folders</span>
                  </span>
                  <span className="bg-zinc-800/80 px-2.5 py-1 rounded-xl border border-zinc-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{sharedRepo.totalNotes} Notes</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Nested Units & Notes Preview */}
            <div className="p-4 rounded-2xl glass-card space-y-3 max-h-56 overflow-y-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-display">
                Included Units &amp; Topics:
              </p>

              {sharedRepo.subfolders && sharedRepo.subfolders.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sharedRepo.subfolders.map((sf, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl bg-white border border-zinc-200 font-medium text-zinc-800 shadow-2xs"
                    >
                      <Folder className="w-3 h-3 text-zinc-500" />
                      <span>{sf}</span>
                    </span>
                  ))}
                </div>
              )}

              {sharedRepo.notePreviews && sharedRepo.notePreviews.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-zinc-200/60">
                  <p className="text-[11px] font-semibold text-zinc-400">Sample Notes:</p>
                  {sharedRepo.notePreviews.slice(0, 4).map((n, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-zinc-700 py-0.5">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                        <span className="truncate font-medium">{n.title}</span>
                      </div>
                      {n.hasAttachments && (
                        <span className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200 flex items-center gap-1 shrink-0">
                          <Paperclip className="w-2.5 h-2.5" />
                          <span>{n.attachmentCount}</span>
                        </span>
                      )}
                    </div>
                  ))}
                  {sharedRepo.notePreviews.length > 4 && (
                    <p className="text-[11px] text-zinc-400 italic">
                      + {sharedRepo.notePreviews.length - 4} more notes inside
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60">
              <p className="text-xs text-zinc-500">
                Cloning creates an editable, private copy in your workspace.
              </p>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={cloning}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  onClick={handleClone}
                  loading={cloning}
                  className="font-semibold shadow-md"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Clone into My Account</span>
                </Button>
              </div>
            </div>

          </div>
        )}

      </div>
    </Modal>
  );
};
