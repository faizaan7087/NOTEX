import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { api } from './services/api';
import { APP_NAME } from './constants/app';

// Layout & Navigation
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { BackgroundGrid } from './components/ui/BackgroundGrid';
import { FloatingDock } from './components/ui/FloatingDock';
import { motion, AnimatePresence } from 'framer-motion';

// Pages
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { NotesPage } from './pages/NotesPage';
import { NoteFormPage } from './pages/NoteFormPage';
import { XMLDemoPage } from './pages/XMLDemoPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

// Modals
import { Modal } from './components/ui/modal';
import { NoteViewer } from './components/notes/NoteViewer';
import { XMLModal } from './components/notes/XMLModal';
import { SearchModal } from './components/notes/SearchModal';
import { DeleteModal } from './components/notes/DeleteModal';
import { CreateFolderModal } from './components/folders/CreateFolderModal';
import { ShareFolderModal } from './components/folders/ShareFolderModal';
import { ImportSharedModal } from './components/folders/ImportSharedModal';

export function MainApp() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const toast = useToast();

  // Navigation State
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Data State
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Modals & Active Items
  const [viewingNote, setViewingNote] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [deletingNote, setDeletingNote] = useState(null);
  const [xmlModalOpen, setXmlModalOpen] = useState(false);
  const [xmlTargetNote, setXmlTargetNote] = useState(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Folder Modals
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderModalParentId, setFolderModalParentId] = useState(null);
  const [folderModalTarget, setFolderModalTarget] = useState(null);

  // Share & Clone Modals
  const [shareFolderModalOpen, setShareFolderModalOpen] = useState(false);
  const [sharingFolder, setSharingFolder] = useState(null);
  const [importSharedModalOpen, setImportSharedModalOpen] = useState(false);
  const [initialShareCode, setInitialShareCode] = useState('');

  // Fetch all notes with search and filters from backend
  const fetchNotes = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.getNotes({
        search: searchQuery,
        subject: selectedSubject,
        favorite: showFavoritesOnly,
        sort: sortBy
      });
      if (res.success) {
        setNotes(res.notes || []);
      }
    } catch (err) {
      console.error('[Fetch Notes Error]:', err);
      toast.error('Failed to load notes from server');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, searchQuery, selectedSubject, showFavoritesOnly, sortBy]);

  // Fetch all folders
  const fetchFolders = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getFolders();
      if (res.success) {
        setFolders(res.folders || []);
      }
    } catch (err) {
      console.error('[Fetch Folders Error]:', err);
    }
  }, [isAuthenticated]);

  // Fetch dashboard stats & subjects list
  const fetchStatsAndSubjects = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [statsRes, subjectsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getSubjects()
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
      }
      if (subjectsRes.success) {
        setSubjects(subjectsRes.subjects || []);
      }
    } catch (err) {
      console.error('[Fetch Stats Error]:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotes();
      fetchFolders();
      fetchStatsAndSubjects();
      if (user && user.isProfileCompleted === false) {
        setActivePage('profile');
      }
    }
  }, [isAuthenticated, user?.isProfileCompleted, fetchNotes, fetchFolders, fetchStatsAndSubjects]);

  // Check URL query parameters for ?share=... on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareParam = urlParams.get('share');
    if (shareParam) {
      setInitialShareCode(shareParam);
      setImportSharedModalOpen(true);
      // Clean query parameter without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Keyboard shortcut listener for Command/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- CRUD Handlers for Notes ---
  const handleSaveNote = async (noteData) => {
    setActionLoading(true);
    try {
      if (editingNote && editingNote._id) {
        const noteId = editingNote._id || editingNote.id;
        const res = await api.updateNote(noteId, noteData);
        if (res.success) {
          toast.success('Note updated successfully!');
          setEditingNote(null);
          setActivePage('notes');
          fetchNotes();
          fetchFolders();
          fetchStatsAndSubjects();
        }
      } else {
        const res = await api.createNote(noteData);
        if (res.success) {
          toast.success('Note created and saved to folder!');
          setActivePage('notes');
          fetchNotes();
          fetchFolders();
          fetchStatsAndSubjects();
        }
      }
    } catch (err) {
      console.error('[Save Note Error]:', err);
      toast.error(err.message || 'Failed to save note');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingNote) return;
    setActionLoading(true);
    try {
      const noteId = deletingNote._id || deletingNote.id;
      const res = await api.deleteNote(noteId);
      if (res.success) {
        toast.success('Note permanently deleted.');
        setDeletingNote(null);
        if (viewingNote && (viewingNote._id === noteId || viewingNote.id === noteId)) {
          setViewingNote(null);
        }
        fetchNotes();
        fetchFolders();
        fetchStatsAndSubjects();
      }
    } catch (err) {
      console.error('[Delete Note Error]:', err);
      toast.error('Failed to delete note');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFavorite = async (note) => {
    try {
      const noteId = note._id || note.id;
      const newStatus = !note.isFavorite;
      await api.updateNote(noteId, { isFavorite: newStatus });
      toast.success(newStatus ? 'Added to Starred Notes' : 'Removed from Starred Notes');
      
      setNotes((prev) =>
        prev.map((n) => (n._id === noteId || n.id === noteId ? { ...n, isFavorite: newStatus } : n))
      );
      if (viewingNote && (viewingNote._id === noteId || viewingNote.id === noteId)) {
        setViewingNote((prev) => ({ ...prev, isFavorite: newStatus }));
      }
      fetchStatsAndSubjects();
    } catch (err) {
      console.error('[Toggle Favorite Error]:', err);
      toast.error('Failed to update favorite status');
    }
  };

  // --- CRUD Handlers for Folders ---
  const handleOpenCreateFolderModal = (parentId = null, folderToEdit = null) => {
    setFolderModalParentId(parentId);
    setFolderModalTarget(folderToEdit);
    setFolderModalOpen(true);
  };

  const handleSaveFolder = async (folderData) => {
    setActionLoading(true);
    try {
      if (folderModalTarget) {
        const folderId = folderModalTarget._id || folderModalTarget.id;
        const res = await api.updateFolder(folderId, folderData);
        if (res.success) {
          toast.success('Folder updated successfully!');
          setFolderModalOpen(false);
          setFolderModalTarget(null);
          fetchFolders();
        }
      } else {
        const res = await api.createFolder(folderData);
        if (res.success) {
          toast.success('Folder created successfully!');
          setFolderModalOpen(false);
          fetchFolders();
        }
      }
    } catch (err) {
      console.error('[Save Folder Error]:', err);
      toast.error(err.message || 'Failed to save folder');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(`Delete folder "${folder.name}"? Subfolders will also be deleted, and notes will be moved to root.`)) {
      return;
    }
    try {
      const folderId = folder._id || folder.id;
      const res = await api.deleteFolder(folderId);
      if (res.success) {
        toast.success(`Folder "${folder.name}" deleted.`);
        if (currentFolderId === folderId) {
          setCurrentFolderId(folder.parentId || null);
        }
        fetchFolders();
        fetchNotes();
      }
    } catch (err) {
      console.error('[Delete Folder Error]:', err);
      toast.error('Failed to delete folder');
    }
  };

  // --- Share & Clone Handlers ---
  const handleOpenShareFolder = (folder) => {
    setSharingFolder(folder);
    setShareFolderModalOpen(true);
  };

  const handleOpenImportShared = (code = '') => {
    setInitialShareCode(code);
    setImportSharedModalOpen(true);
  };

  const handleClonedSuccess = (newFolderId) => {
    fetchFolders();
    fetchNotes();
    fetchStatsAndSubjects();
    if (newFolderId) {
      setCurrentFolderId(newFolderId);
    }
    setActivePage('notes');
  };

  const handleCreateNoteInFolder = (folderId, subjectName = '') => {
    setEditingNote({
      folderId: folderId || '',
      subject: subjectName || ''
    });
    setActivePage('new-note');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // XML Export Trigger
  const handleOpenXMLModal = (note = null, subject = null) => {
    setXmlTargetNote(note);
    if (subject) setSelectedSubject(subject);
    setXmlModalOpen(true);
  };

  // Navigation Helper
  const navigateTo = (page, subject = null) => {
    setActivePage(page);
    if (subject) {
      setSelectedSubject(subject);
    }
    if (page === 'new-note') {
      setEditingNote(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setActivePage('edit-note');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedSubject('all');
    setShowFavoritesOnly(false);
    setSortBy('newest');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-zinc-500">Loading {APP_NAME} Platform...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#fafafa] text-zinc-950">
      {/* Ambient Grid & Lighting Background */}
      <BackgroundGrid />

      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activePage={activePage}
        navigateTo={navigateTo}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex-1 flex">
        {/* Left Sidebar with Expandable Nested Folders */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activePage={activePage}
          navigateTo={navigateTo}
          folders={folders}
          currentFolderId={currentFolderId}
          onNavigateFolder={(fId) => setCurrentFolderId(fId)}
          onRequestCreateFolder={(parentId) => handleOpenCreateFolderModal(parentId)}
          onEditFolder={(folder) => handleOpenCreateFolderModal(folder.parentId, folder)}
          onDeleteFolder={handleDeleteFolder}
          onShareFolder={handleOpenShareFolder}
          subjects={subjects}
          selectedSubject={selectedSubject}
          onSelectSubject={(sub) => {
            setSelectedSubject(sub);
            if (activePage !== 'notes') setActivePage('notes');
          }}
          stats={stats}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content Area */}
        <main className={`flex-1 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'} flex flex-col justify-between relative z-10`}>
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {activePage === 'dashboard' && (
                  <DashboardPage
                    stats={stats}
                    notes={notes}
                    subjects={subjects}
                    folders={folders}
                    loading={loading}
                    onViewNote={(n) => setViewingNote(n)}
                    onEditNote={handleEditNote}
                    onDeleteNote={(n) => setDeletingNote(n)}
                    onExportXML={handleOpenXMLModal}
                    onToggleFavorite={handleToggleFavorite}
                    onNavigate={navigateTo}
                    onNavigateFolder={(fId) => {
                      setCurrentFolderId(fId);
                      setActivePage('notes');
                    }}
                    onShareFolder={handleOpenShareFolder}
                    onOpenImportShared={() => handleOpenImportShared()}
                  />
                )}

                {activePage === 'notes' && (
                  <NotesPage
                    notes={notes}
                    subjects={subjects}
                    folders={folders}
                    currentFolderId={currentFolderId}
                    onNavigateFolder={(fId) => setCurrentFolderId(fId)}
                    onCreateSubfolder={(parentId) => handleOpenCreateFolderModal(parentId)}
                    onEditFolder={(folder) => handleOpenCreateFolderModal(folder.parentId, folder)}
                    onDeleteFolder={handleDeleteFolder}
                    onShareFolder={handleOpenShareFolder}
                    onOpenImportShared={() => handleOpenImportShared()}
                    onCreateNoteInFolder={handleCreateNoteInFolder}
                    loading={loading}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    selectedSubject={selectedSubject}
                    onSelectSubject={setSelectedSubject}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    showFavoritesOnly={showFavoritesOnly}
                    onToggleFavoritesOnly={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    onViewNote={(n) => setViewingNote(n)}
                    onEditNote={handleEditNote}
                    onDeleteNote={(n) => setDeletingNote(n)}
                    onExportXML={handleOpenXMLModal}
                    onToggleFavorite={handleToggleFavorite}
                    onNavigate={navigateTo}
                    onClearFilters={handleClearFilters}
                  />
                )}

                {(activePage === 'new-note' || activePage === 'edit-note') && (
                  <NoteFormPage
                    initialData={editingNote}
                    folders={folders}
                    onSave={handleSaveNote}
                    onCancel={() => navigateTo('notes')}
                    onRequestCreateFolder={(parentId) => handleOpenCreateFolderModal(parentId)}
                    loading={actionLoading}
                  />
                )}

                {activePage === 'settings' && (
                  <SettingsPage
                    onNavigate={navigateTo}
                  />
                )}

                {activePage === 'xml-demo' && (
                  <XMLDemoPage
                    subjects={subjects}
                    onNavigate={navigateTo}
                  />
                )}

                {activePage === 'profile' && (
                  <ProfilePage
                    onCompleteOnboarding={() => setActivePage('dashboard')}
                    isFirstTime={user && user.isProfileCompleted === false}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <Footer />
        </main>
      </div>

      {/* Raycast/macOS Style Floating Command Dock */}
      <FloatingDock
        activePage={activePage}
        navigateTo={navigateTo}
        onOpenCreateFolder={() => handleOpenCreateFolderModal(null)}
        onOpenSearch={() => setSearchModalOpen(true)}
        onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
        showFavoritesOnly={showFavoritesOnly}
      />

      {/* Note Reader Modal (NoteViewer) */}
      <Modal
        isOpen={!!viewingNote}
        onClose={() => setViewingNote(null)}
        title="Note Details"
        maxWidth="max-w-3xl"
      >
        <NoteViewer
          note={viewingNote}
          onEdit={handleEditNote}
          onDelete={(n) => {
            setViewingNote(null);
            setDeletingNote(n);
          }}
          onExportXML={(n) => {
            setViewingNote(null);
            handleOpenXMLModal(n);
          }}
          onClose={() => setViewingNote(null)}
        />
      </Modal>

      {/* Create / Edit Folder Modal */}
      <CreateFolderModal
        isOpen={folderModalOpen}
        onClose={() => {
          setFolderModalOpen(false);
          setFolderModalTarget(null);
        }}
        onSaveFolder={handleSaveFolder}
        folders={folders}
        defaultParentId={folderModalParentId}
        initialFolder={folderModalTarget}
        loading={actionLoading}
      />

      {/* Share Folder Modal */}
      <ShareFolderModal
        isOpen={shareFolderModalOpen}
        onClose={() => {
          setShareFolderModalOpen(false);
          setSharingFolder(null);
        }}
        folder={sharingFolder}
        allFolders={folders}
      />

      {/* Import / Clone Shared Repo Modal */}
      <ImportSharedModal
        isOpen={importSharedModalOpen}
        onClose={() => {
          setImportSharedModalOpen(false);
          setInitialShareCode('');
        }}
        initialShareCode={initialShareCode}
        onClonedSuccess={handleClonedSuccess}
      />

      {/* XML Exporter Modal */}
      <XMLModal
        isOpen={xmlModalOpen}
        onClose={() => {
          setXmlModalOpen(false);
          setXmlTargetNote(null);
        }}
        targetNote={xmlTargetNote}
        subjects={subjects}
      />

      {/* Spotlight Command Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        notes={notes}
        onSelectNote={(note) => setViewingNote(note)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deletingNote}
        onClose={() => setDeletingNote(null)}
        note={deletingNote}
        onConfirm={handleConfirmDelete}
        loading={actionLoading}
      />
    </div>
  );
}

export default function App() {
  return <MainApp />;
}
