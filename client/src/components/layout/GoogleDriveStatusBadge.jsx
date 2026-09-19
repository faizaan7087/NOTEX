import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { HardDrive, CheckCircle2, RefreshCw, ExternalLink } from 'lucide-react';

export const GoogleDriveStatusBadge = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [syncing, setSyncing] = useState(false);

  const isDriveConnected = user?.driveConnected || !!user?.driveRootFolderId || !!user?.googleId;

  const handleManualSync = async (e) => {
    e.stopPropagation();
    if (!isDriveConnected) {
      toast.info('Sign in with Google to automatically backup notes to your Google Drive.');
      return;
    }

    setSyncing(true);
    try {
      const res = await api.syncDriveVault();
      if (res.success) {
        toast.success(res.message || 'Notes and folders synced to Google Drive!');
      }
    } catch (err) {
      console.error('[Manual Sync Error]:', err);
      toast.error(err.message || 'Failed to sync to Google Drive.');
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenDrive = (e) => {
    e.stopPropagation();
    if (user?.driveRootFolderId) {
      window.open(`https://drive.google.com/drive/folders/${user.driveRootFolderId}`, '_blank');
    } else {
      window.open('https://drive.google.com/drive/my-drive', '_blank');
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5 p-1 rounded-full bg-white/90 border border-zinc-200/90 shadow-2xs backdrop-blur-md text-xs transition-all hover:border-black/30">
      <button
        onClick={handleOpenDrive}
        className="flex items-center gap-2 px-2.5 py-1 rounded-full hover:bg-zinc-100/80 transition-colors"
        title="Open NOTEX_Vault in Google Drive"
      >
        <div className="relative flex items-center justify-center">
          {isDriveConnected ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          ) : (
            <span className="h-2 w-2 rounded-full bg-zinc-400"></span>
          )}
        </div>

        <div className="flex items-center gap-1.5 font-medium text-zinc-800">
          <HardDrive className="w-3.5 h-3.5 text-zinc-600" />
          <span>{isDriveConnected ? 'Drive: NOTEX_Vault' : 'Local Workspace'}</span>
        </div>
      </button>

      {isDriveConnected && (
        <button
          onClick={handleManualSync}
          disabled={syncing}
          className="p-1.5 rounded-full hover:bg-zinc-200/70 text-zinc-600 hover:text-black transition-all"
          title="Force Sync all notes & folders to Google Drive"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-black' : ''}`} />
        </button>
      )}
    </div>
  );
};
