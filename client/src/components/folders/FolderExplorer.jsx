import React from 'react';
import { motion } from 'framer-motion';
import { NoteCard } from '../notes/NoteCard';
import { Button } from '../ui/button';
import { 
  Folder, 
  FolderPlus, 
  ChevronRight, 
  Home, 
  Plus, 
  Edit3, 
  Trash2, 
  FileText, 
  Layers, 
  Share2,
  DownloadCloud,
  Sparkles
} from 'lucide-react';

const FOLDER_COLOR_CLASSES = {
  indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white',
  emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white',
  amber: 'text-amber-600 bg-amber-50 border-amber-200 group-hover:bg-amber-600 group-hover:text-white',
  rose: 'text-rose-600 bg-rose-50 border-rose-200 group-hover:bg-rose-600 group-hover:text-white',
  sky: 'text-sky-600 bg-sky-50 border-sky-200 group-hover:bg-sky-600 group-hover:text-white',
  purple: 'text-purple-600 bg-purple-50 border-purple-200 group-hover:bg-purple-600 group-hover:text-white',
  zinc: 'text-zinc-700 bg-zinc-100 border-zinc-200 group-hover:bg-zinc-800 group-hover:text-white'
};

export const FolderExplorer = ({
  folders = [],
  notes = [],
  currentFolderId = null,
  onNavigateFolder,
  onCreateSubfolder,
  onEditFolder,
  onDeleteFolder,
  onShareFolder,
  onOpenImportShared,
  onCreateNoteInFolder,
  onViewNote,
  onEditNote,
  onDeleteNote,
  onExportXML,
  onToggleFavorite
}) => {
  // Find current folder object
  const currentFolder = folders.find(f => (f._id || f.id) === currentFolderId) || null;

  // Build breadcrumb trail from current folder up to root
  const getBreadcrumbs = () => {
    const trail = [];
    let curr = currentFolder;
    while (curr) {
      trail.unshift(curr);
      curr = folders.find(f => (f._id || f.id) === curr.parentId);
    }
    return trail;
  };

  const breadcrumbs = getBreadcrumbs();

  // Child subfolders of the current folder (or root folders if currentFolderId is null)
  const childFolders = folders.filter(f => {
    if (currentFolderId === null) {
      return !f.parentId;
    }
    return f.parentId === currentFolderId;
  });

  // Notes inside the current folder
  const currentNotes = notes.filter(n => {
    if (currentFolderId === null) {
      return !n.folderId;
    }
    return n.folderId === currentFolderId;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-3xl glass-panel">
        <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm font-medium text-zinc-600">
          <button
            onClick={() => onNavigateFolder(null)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all ${
              currentFolderId === null
                ? 'bg-black text-white font-bold shadow-xs'
                : 'hover:text-black hover:bg-white/80'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Root Workspace</span>
          </button>

          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb._id || crumb.id}>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <button
                  onClick={() => onNavigateFolder(crumb._id || crumb.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all ${
                    isLast
                      ? 'bg-black text-white font-bold shadow-xs'
                      : 'hover:text-black hover:bg-white/80 text-zinc-700'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[180px]">{crumb.name}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Share Repo Button */}
          {onShareFolder && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShareFolder(currentFolder || null)}
              className="text-xs bg-white border-zinc-200 hover:bg-black hover:text-white transition-all shadow-2xs font-semibold"
              title={currentFolder ? `Share ${currentFolder.name}` : "Share folder repository"}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </Button>
          )}

          {/* Import Repo Button */}
          {onOpenImportShared && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenImportShared}
              className="text-xs bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-800 shadow-2xs font-medium"
              title="Import shared repository"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-black" />
              <span>Import</span>
            </Button>
          )}

          {currentFolder && (
            <>
              <button
                onClick={() => onEditFolder(currentFolder)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-700 hover:text-black bg-white hover:bg-zinc-100 border border-zinc-200 rounded-xl transition-colors shadow-2xs font-medium"
                title="Rename folder"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Rename</span>
              </button>

              <button
                onClick={() => onDeleteFolder(currentFolder)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors shadow-2xs font-semibold"
                title="Delete this folder"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Folder</span>
              </button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onCreateSubfolder(currentFolderId)}
            className="text-xs bg-white border-zinc-200 hover:bg-zinc-100"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>{currentFolderId ? '+ Subfolder' : '+ Folder'}</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => onCreateNoteInFolder(currentFolderId, currentFolder?.name)}
            className="text-xs font-semibold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </Button>
        </div>
      </div>

      {/* 1. Subfolders Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-display flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-zinc-600" />
            <span>
              {currentFolderId ? `Folders in "${currentFolder?.name}"` : 'Top-Level Folders'} ({childFolders.length})
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {childFolders.map((folder, idx) => {
            const colorClass = FOLDER_COLOR_CLASSES[folder.color] || FOLDER_COLOR_CLASSES.indigo;
            return (
              <motion.div
                key={folder._id || folder.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                whileHover={{ y: -3 }}
                onClick={() => onNavigateFolder(folder._id || folder.id)}
                className="group relative flex flex-col justify-between p-4 rounded-2xl bg-white/85 backdrop-blur-md border border-zinc-200/80 cursor-pointer hover:border-black/30 transition-all shadow-2xs hover:shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${colorClass}`}>
                      <Folder className="w-4 h-4" />
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {onShareFolder && (
                        <button
                          onClick={() => onShareFolder(folder)}
                          className="p-1.5 bg-white border border-zinc-200 hover:bg-black hover:text-white rounded-lg text-zinc-600 transition-all shadow-2xs"
                          title={`Share ${folder.name}`}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onEditFolder(folder)}
                        className="p-1.5 bg-white border border-zinc-200 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors shadow-2xs"
                        title="Rename"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteFolder(folder)}
                        className="p-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors shadow-2xs"
                        title="Delete folder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-zinc-950 truncate group-hover:text-black">
                      {folder.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1">
                      <span>{folder.noteCount || 0} {folder.noteCount === 1 ? 'note' : 'notes'}</span>
                      {folder.subfolderCount > 0 && (
                        <>
                          <span>•</span>
                          <span>{folder.subfolderCount} subfolders</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Quick Create Folder Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCreateSubfolder(currentFolderId)}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed border-zinc-300 hover:border-black/30 hover:bg-white bg-zinc-50/50 cursor-pointer transition-all min-h-[90px] text-center"
          >
            <FolderPlus className="w-5 h-5 text-zinc-400 mb-1" />
            <p className="text-xs font-bold text-zinc-700">
              {currentFolderId ? '+ Add Subfolder' : '+ Add Folder'}
            </p>
          </motion.div>
        </div>
      </div>

      {/* 2. Notes Section inside this Folder */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-display flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-black" />
            <span>
              Notes in {currentFolder ? `"${currentFolder.name}"` : 'Root'} ({currentNotes.length})
            </span>
          </p>
        </div>

        {currentNotes.length === 0 ? (
          <div className="glass-card rounded-3xl border border-dashed border-zinc-300 p-8 text-center">
            <FileText className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-800">
              No notes in this folder yet
            </p>
            <p className="text-xs text-zinc-500 mb-4">
              Add lecture notes, formulas, or study files specifically for {currentFolder?.name || 'this location'}.
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={() => onCreateNoteInFolder(currentFolderId, currentFolder?.name)}
              className="font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Note Here</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentNotes.map((note) => (
              <NoteCard
                key={note._id || note.id}
                note={note}
                onView={onViewNote}
                onEdit={onEditNote}
                onDelete={onDeleteNote}
                onExportXML={onExportXML}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
