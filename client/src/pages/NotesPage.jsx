import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchBar } from '../components/notes/SearchBar';
import { SubjectFilter } from '../components/notes/SubjectFilter';
import { NoteList } from '../components/notes/NoteList';
import { FolderExplorer } from '../components/folders/FolderExplorer';
import { Button } from '../components/ui/button';
import { AnimatedTabs } from '../components/ui/AnimatedTabs';
import { useToast } from '../context/ToastContext';
import { 
  FolderTree, 
  LayoutGrid
} from 'lucide-react';

export const NotesPage = ({
  notes = [],
  subjects = [],
  folders = [],
  currentFolderId = null,
  onNavigateFolder,
  onCreateSubfolder,
  onEditFolder,
  onDeleteFolder,
  onCreateNoteInFolder,
  onShareFolder,
  onOpenImportShared,
  onOpenBookmarkChat,
  loading = false,
  searchQuery,
  onSearchChange,
  selectedSubject,
  onSelectSubject,
  sortBy,
  onSortChange,
  showFavoritesOnly,
  onToggleFavoritesOnly,
  onViewNote,
  onEditNote,
  onDeleteNote,
  onExportXML,
  onToggleFavorite,
  onNavigate,
  onClearFilters
}) => {
  const toast = useToast();
  const [viewMode, setViewMode] = useState('folders'); // 'folders' | 'grid'
  const [showGptOnly, setShowGptOnly] = useState(false);

  const isSearching = !!searchQuery.trim();

  // Filter notes by ChatGPT links if toggle is active
  const displayedNotes = showGptOnly
    ? notes.filter(n => !!n.chatGptUrl)
    : notes;

  const gptLinksCount = notes.filter(n => !!n.chatGptUrl).length;

  const handleShareWhatsAppLinks = () => {
    const gptNotes = notes.filter(n => !!n.chatGptUrl);
    if (gptNotes.length === 0) {
      toast.error('No ChatGPT links saved yet to share.');
      return;
    }
    const subjectName = selectedSubject && selectedSubject !== 'all' ? selectedSubject : 'Study Notes';
    let message = `*NOTEX — ${subjectName} ChatGPT Study Links*\n\n`;
    gptNotes.forEach((n, idx) => {
      message += `${idx + 1}. *${n.title}* (${n.subject})\n🔗 ${n.chatGptUrl}\n\n`;
    });
    message += `_Organized in NOTEX Vault_`;
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const viewTabs = [
    { id: 'folders', label: 'Folders', icon: FolderTree },
    { id: 'grid', label: 'All Notes', icon: LayoutGrid, count: displayedNotes.length }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 font-display tracking-tight">
            Notes &amp; Folders
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Organize course units, formulas, and attachments in your vault
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <AnimatedTabs
            tabs={viewTabs}
            activeTab={isSearching ? 'grid' : viewMode}
            onChange={(tabId) => setViewMode(tabId)}
          />
        </div>
      </div>

      {/* Global Search Bar (available in both views) */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavoritesOnly={onToggleFavoritesOnly}
        showGptOnly={showGptOnly}
        onToggleGptOnly={() => setShowGptOnly(!showGptOnly)}
        totalResults={displayedNotes.length}
      />

      {/* Main View with smooth transition */}
      <AnimatePresence mode="wait">
        {viewMode === 'folders' && !isSearching ? (
          <motion.div
            key="folders-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <FolderExplorer
              folders={folders}
              notes={displayedNotes}
              currentFolderId={currentFolderId}
              onNavigateFolder={onNavigateFolder}
              onCreateSubfolder={onCreateSubfolder}
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
              onShareFolder={onShareFolder}
              onOpenImportShared={onOpenImportShared}
              onCreateNoteInFolder={onCreateNoteInFolder}
              onViewNote={onViewNote}
              onEditNote={onEditNote}
              onDeleteNote={onDeleteNote}
              onExportXML={onExportXML}
              onToggleFavorite={onToggleFavorite}
            />
          </motion.div>
        ) : (
          <motion.div
            key="grid-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Subject Filter Bar */}
            <SubjectFilter
              subjects={subjects}
              selectedSubject={selectedSubject}
              onSelectSubject={onSelectSubject}
              totalNotes={displayedNotes.length}
            />

            {/* Notes Grid List */}
            <NoteList
              notes={displayedNotes}
              loading={loading}
              onView={onViewNote}
              onEdit={onEditNote}
              onDelete={onDeleteNote}
              onExportXML={onExportXML}
              onToggleFavorite={onToggleFavorite}
              onCreateNew={() => onNavigate('new-note')}
              searchQuery={searchQuery}
              selectedSubject={selectedSubject}
              onClearFilters={onClearFilters}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
