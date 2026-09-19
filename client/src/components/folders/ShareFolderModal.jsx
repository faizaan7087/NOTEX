import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { 
  Share2, 
  Copy, 
  Check, 
  Clock, 
  Folder, 
  ShieldCheck, 
  Sparkles,
  Layers,
  FileText,
  UserCheck
} from 'lucide-react';

const EXPIRY_OPTIONS = [
  { value: 1, label: '1 Hour (Temporary Cloud Relay)' },
  { value: 24, label: '24 Hours (1 Day)' },
  { value: 72, label: '3 Days' },
  { value: 168, label: '7 Days' }
];

export const ShareFolderModal = ({
  isOpen,
  onClose,
  folder = null,
  allFolders = []
}) => {
  const toast = useToast();
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [expiryHours, setExpiryHours] = useState(1);
  const [loading, setLoading] = useState(false);
  const [shareResult, setShareResult] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync selected folder
  useEffect(() => {
    if (isOpen) {
      setShareResult(null);
      setCopiedLink(false);
      setCopiedCode(false);
      if (folder) {
        setSelectedFolderId(folder._id || folder.id);
      } else if (allFolders.length > 0) {
        setSelectedFolderId(allFolders[0]._id || allFolders[0].id);
      } else {
        setSelectedFolderId(null);
      }
    }
  }, [isOpen, folder, allFolders]);

  const activeFolder = allFolders.find(f => (f._id || f.id) === selectedFolderId) || folder;

  if (!isOpen) return null;

  const folderId = activeFolder ? (activeFolder._id || activeFolder.id) : null;

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const res = await api.createShareLink(folderId, expiryHours);
      if (res.success) {
        const origin = window.location.origin;
        const fullUrl = `${origin}/?share=${res.shareCode}`;
        setShareResult({
          ...res,
          fullUrl
        });
        toast.success('Time-limited share link generated!');
      }
    } catch (err) {
      console.error('[Generate Share Error]:', err);
      toast.error(err.message || 'Failed to generate share link.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareResult?.fullUrl) return;
    navigator.clipboard.writeText(shareResult.fullUrl);
    setCopiedLink(true);
    toast.success('Share link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    if (!shareResult?.shareCode) return;
    navigator.clipboard.writeText(shareResult.shareCode);
    setCopiedCode(true);
    toast.success('Share code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activeFolder ? `Share Repository: "${activeFolder.name}"` : 'Share Subject Repository'}
      description="Create a time-limited share link for classmates to clone all unit folders, notes, and visual study files."
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        
        {/* Repository Selection / Summary Card */}
        {allFolders.length > 1 && !shareResult ? (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-black" />
              <span>Select Subject Folder to Share</span>
            </label>
            <select
              value={selectedFolderId || ''}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full h-11 px-3.5 text-sm bg-white border border-zinc-300 rounded-xl text-zinc-900 font-semibold focus:outline-none focus:border-black shadow-2xs"
            >
              {allFolders.map((f) => (
                <option key={f._id || f.id} value={f._id || f.id}>
                  📁 {f.name} ({f.noteCount || 0} notes)
                </option>
              ))}
            </select>
          </div>
        ) : activeFolder ? (
          <div className="flex items-center justify-between p-4 rounded-2xl glass-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-sm">
                <Folder className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-950 font-display">
                  {activeFolder.name}
                </h4>
                <p className="text-xs text-zinc-500">
                  Complete syllabus repository with all nested units &amp; notes
                </p>
              </div>
            </div>
            {allFolders.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedFolderId(null)}
                className="text-xs text-zinc-600 hover:text-black underline"
              >
                Change
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <p className="font-semibold">No Subject Folder Created Yet</p>
            <p className="mt-0.5 text-amber-700">Please create a folder (like BDA, DBMS, or CN) first before generating a repository share link.</p>
          </div>
        )}

        {/* Expiry Selector */}
        {!shareResult && activeFolder && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>Link Validity &amp; Expiration Duration</span>
              </label>
              <select
                value={expiryHours}
                onChange={(e) => setExpiryHours(parseInt(e.target.value, 10))}
                className="w-full h-11 px-3.5 text-sm bg-white/80 border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-black shadow-2xs font-sans"
              >
                {EXPIRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    ⏳ Valid for {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-zinc-500">
                After this period expires, the link will automatically deactivate to protect your study materials.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1 text-xs text-zinc-600">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Author Attribution &amp; Clone Protection</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                When recipients clone this repository, you will be credited as the original author with your college details.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleGenerateLink}
                loading={loading}
                className="shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                <span>Generate Share Link</span>
              </Button>
            </div>
          </div>
        )}

        {/* Share Link Result Card */}
        {shareResult && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Metadata Pill Banner */}
            <div className="p-4 rounded-2xl bg-zinc-900 text-white space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-zinc-100">{shareResult.authorName}</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
                  Expires: {new Date(shareResult.expiresAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-zinc-300 pt-1 border-t border-zinc-800">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{shareResult.totalSubfolders} Unit Folders</span>
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{shareResult.totalNotes} Notes &amp; Visuals</span>
                </span>
              </div>
            </div>

            {/* Full Share Link Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Shareable Web Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareResult.fullUrl}
                  className="flex-1 h-11 px-3.5 text-xs font-mono bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 select-all"
                />
                <Button
                  type="button"
                  variant="default"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Link</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Share Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Or Share Code (to paste in "Import Repo")
              </label>
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                <code className="text-xs font-bold font-mono text-zinc-900 select-all">
                  {shareResult.shareCode}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className="text-xs h-8"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-200/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};
