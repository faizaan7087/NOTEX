import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
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
import { Sparkles } from 'lucide-react';
import { cn } from './utils/cn';

// Pages
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { NotesPage } from './pages/NotesPage';
import { NoteFormPage } from './pages/NoteFormPage';
import { XMLDemoPage } from './pages/XMLDemoPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { RemindersPage } from './pages/RemindersPage';
import { ArexPage } from './pages/ArexPage';

// Modals
import { Modal } from './components/ui/modal';
import { NoteViewer } from './components/notes/NoteViewer';
import { XMLModal } from './components/notes/XMLModal';
import { SearchModal } from './components/notes/SearchModal';
import { DeleteModal } from './components/notes/DeleteModal';
import { CreateFolderModal } from './components/folders/CreateFolderModal';
import { ShareFolderModal } from './components/folders/ShareFolderModal';
import { ImportSharedModal } from './components/folders/ImportSharedModal';

// Wrapper to support /notes/edit/:id direct routing
function NoteFormRouteWrapper({
  editingNote,
  notes,
  folders,
  onSave,
  onCancel,
  onRequestCreateFolder,
  loading
}) {
  const { id } = useParams();
  const noteData = editingNote || (id ? notes.find((n) => String(n._id || n.id) === String(id)) : null);

  return (
    <NoteFormPage
      initialData={noteData}
      folders={folders}
      onSave={onSave}
      onCancel={onCancel}
      onRequestCreateFolder={onRequestCreateFolder}
      loading={loading}
    />
  );
}

export function MainApp() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Compute activePage dynamically from URL
  const getActivePage = (pathname) => {
    if (pathname.startsWith('/notes/new')) return 'new-note';
    if (pathname.startsWith('/notes/edit')) return 'edit-note';
    if (pathname.startsWith('/notes')) return 'notes';
    if (pathname.startsWith('/reminders')) return 'reminders';
    if (pathname.startsWith('/arex') || pathname.startsWith('/ai-study')) return 'arex';
    if (pathname.startsWith('/settings')) return 'settings';
    if (pathname.startsWith('/xml-demo')) return 'xml-demo';
    if (pathname.startsWith('/profile')) return 'profile';
    return 'dashboard';
  };

  const activePage = getActivePage(location.pathname);
  const isAIPage = location.pathname.startsWith('/arex') || location.pathname.startsWith('/ai-study') || activePage === 'arex';

  // Document body matches active page theme
  useEffect(() => {
    document.body.style.backgroundColor = isAIPage ? '#09090B' : '#f8fafc';
    return () => {
      document.body.style.backgroundColor = '#f8fafc';
    };
  }, [isAIPage]);

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

  // 1. Initial workspace data load on login/session start
  useEffect(() => {
    if (isAuthenticated) {
      fetchFolders();
      fetchStatsAndSubjects();
    }
  }, [isAuthenticated, fetchFolders, fetchStatsAndSubjects]);

  // 2. Fetch notes when search, subject, or filters change (with debounce on typing)
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setTimeout(() => {
      fetchNotes();
    }, searchQuery ? 250 : 0);

    return () => clearTimeout(timer);
  }, [isAuthenticated, fetchNotes, searchQuery]);

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

  // Sync URL search params (?folder=..., ?subject=...) when on /notes
  useEffect(() => {
    if (location.pathname === '/notes') {
      const folderParam = searchParams.get('folder');
      const subjectParam = searchParams.get('subject');
      if (folderParam !== null && folderParam !== currentFolderId) {
        setCurrentFolderId(folderParam || null);
      }
      if (subjectParam && subjectParam !== selectedSubject) {
        setSelectedSubject(subjectParam);
      }
    }
  }, [location.pathname, searchParams]);

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
      const targetNoteId = (editingNote && (editingNote._id || editingNote.id)) || noteData._id || noteData.id;
      if (targetNoteId) {
        const res = await api.updateNote(targetNoteId, noteData);
        if (res.success) {
          toast.success('Note updated successfully!');
          setEditingNote(null);
          navigate('/notes');
          fetchNotes();
          fetchFolders();
          fetchStatsAndSubjects();
        }
      } else {
        const res = await api.createNote(noteData);
        if (res.success) {
          toast.success('Note created and saved to folder!');
          setEditingNote(null);
          navigate('/notes');
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
      navigate(`/notes?folder=${newFolderId}`);
    } else {
      navigate('/notes');
    }
  };

  const handleCreateNoteInFolder = (folderId, subjectName = '') => {
    setEditingNote({
      folderId: folderId || '',
      subject: subjectName || ''
    });
    navigate('/notes/new');
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
    if (page === 'dashboard') {
      navigate('/dashboard');
    } else if (page === 'notes') {
      if (subject) {
        setSelectedSubject(subject);
        navigate(`/notes?subject=${encodeURIComponent(subject)}`);
      } else {
        navigate('/notes');
      }
    } else if (page === 'new-note') {
      setEditingNote(null);
      navigate('/notes/new');
    } else if (page === 'edit-note') {
      navigate('/notes/edit');
    } else if (page === 'reminders') {
      navigate('/reminders');
    } else if (page === 'arex' || page === 'ai-study') {
      navigate('/arex');
    } else if (page === 'settings') {
      navigate('/settings');
    } else if (page === 'xml-demo') {
      navigate('/xml-demo');
    } else if (page === 'profile') {
      navigate('/profile');
    } else {
      navigate(`/${page}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    const noteId = note?._id || note?.id;
    if (noteId) {
      navigate(`/notes/edit/${noteId}`);
    } else {
      navigate('/notes/edit');
    }
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
    <div className={cn("relative min-h-screen flex flex-col transition-colors duration-300", isAIPage ? "bg-[#09090B] text-white" : "bg-[#fafafa] text-zinc-950")}>
      {/* Ambient Grid & Lighting Background */}
      <BackgroundGrid isAIPage={isAIPage} />

      {/* Top Floating Navbar (Aceternity UI) */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activePage={activePage}
        navigateTo={navigateTo}
        onOpenSearch={() => setSearchModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAIDrawer={() => navigateTo('arex')}
        isAIPage={isAIPage}
      />

      <div className="flex-1 flex">
        {/* Left Sidebar with Expandable Nested Folders (hidden during full-screen Arex mode) */}
        {!isAIPage && (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            activePage={activePage}
            navigateTo={navigateTo}
            folders={folders}
            currentFolderId={currentFolderId}
            onNavigateFolder={(fId) => {
              setCurrentFolderId(fId);
              navigate(fId ? `/notes?folder=${fId}` : '/notes');
            }}
            onRequestCreateFolder={(parentId) => handleOpenCreateFolderModal(parentId)}
            onEditFolder={(folder) => handleOpenCreateFolderModal(folder.parentId, folder)}
            onDeleteFolder={handleDeleteFolder}
            onShareFolder={handleOpenShareFolder}
            subjects={subjects}
            selectedSubject={selectedSubject}
            onSelectSubject={(sub) => {
              setSelectedSubject(sub);
              navigate(sub && sub !== 'all' ? `/notes?subject=${encodeURIComponent(sub)}` : '/notes');
            }}
            stats={stats}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            isAIPage={isAIPage}
          />
        )}

        {/* Main Content Area */}
        <main className={cn(
          "flex-1 transition-all duration-300 ease-in-out flex flex-col justify-between relative z-10",
          isAIPage ? "pl-0" : (sidebarCollapsed ? 'lg:pl-[96px]' : 'lg:pl-[288px]')
        )}>
          <div className={cn(
            "w-full mx-auto",
            isAIPage 
              ? "w-full p-0 m-0 max-w-none" 
              : "max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12"
          )}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <Routes location={location}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route
                    path="/dashboard"
                    element={
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
                          navigate(fId ? `/notes?folder=${fId}` : '/notes');
                        }}
                        onShareFolder={handleOpenShareFolder}
                        onOpenImportShared={() => handleOpenImportShared()}
                      />
                    }
                  />

                  <Route
                    path="/notes"
                    element={
                      <NotesPage
                        notes={notes}
                        subjects={subjects}
                        folders={folders}
                        currentFolderId={currentFolderId}
                        onNavigateFolder={(fId) => {
                          setCurrentFolderId(fId);
                          navigate(fId ? `/notes?folder=${fId}` : '/notes');
                        }}
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
                        onSelectSubject={(sub) => {
                          setSelectedSubject(sub);
                          navigate(sub && sub !== 'all' ? `/notes?subject=${encodeURIComponent(sub)}` : '/notes');
                        }}
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
                    }
                  />

                  <Route
                    path="/notes/new"
                    element={
                      <NoteFormPage
                        initialData={editingNote}
                        folders={folders}
                        onSave={handleSaveNote}
                        onCancel={() => navigateTo('notes')}
                        onRequestCreateFolder={(parentId) => handleOpenCreateFolderModal(parentId)}
                        loading={actionLoading}
                      />
                    }
                  />

                  <Route
                    path="/notes/edit/:id"
                    element={
                      <NoteFormRouteWrapper
                        editingNote={editingNote}
                        notes={notes}
                        folders={folders}
                        onSave={handleSaveNote}
                        onCancel={() => navigateTo('notes')}
                        onRequestCreateFolder={(parentId) => handleOpenCreateFolderModal(parentId)}
                        loading={actionLoading}
                      />
                    }
                  />

                  <Route
                    path="/notes/edit"
                    element={
                      <NoteFormPage
                        initialData={editingNote}
                        folders={folders}
                        onSave={handleSaveNote}
                        onCancel={() => navigateTo('notes')}
                        onRequestCreateFolder={(parentId) => handleOpenCreateFolderModal(parentId)}
                        loading={actionLoading}
                      />
                    }
                  />

                  <Route
                    path="/reminders"
                    element={
                      <RemindersPage
                        notes={notes}
                        subjects={subjects}
                        onViewNote={(n) => setViewingNote(n)}
                        onNavigate={navigateTo}
                      />
                    }
                  />

                  <Route
                    path="/arex"
                    element={<ArexPage />}
                  />
                  <Route path="/ai-study" element={<Navigate to="/arex" replace />} />

                  <Route
                    path="/settings"
                    element={<SettingsPage onNavigate={navigateTo} />}
                  />

                  <Route
                    path="/xml-demo"
                    element={<XMLDemoPage subjects={subjects} onNavigate={navigateTo} />}
                  />

                  <Route
                    path="/profile"
                    element={
                      <ProfilePage
                        onCompleteOnboarding={() => navigateTo('dashboard')}
                        isFirstTime={user && user.isProfileCompleted === false}
                      />
                    }
                  />

                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </div>

          {!isAIPage && <Footer navigateTo={navigateTo} isAIPage={isAIPage} />}
        </main>
      </div>

      {/* Raycast/macOS Style Floating Command Dock (Hidden on Arex Whiteboard) */}
      {!isAIPage && (
        <FloatingDock
          activePage={activePage}
          navigateTo={navigateTo}
          onOpenCreateFolder={() => handleOpenCreateFolderModal(null)}
          onOpenSearch={() => setSearchModalOpen(true)}
          onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
          showFavoritesOnly={showFavoritesOnly}
          isAIPage={isAIPage}
        />
      )}

      {/* Note Reader Modal (NoteViewer) */}
      <Modal
        isOpen={!!viewingNote}
        onClose={() => setViewingNote(null)}
        maxWidth="max-w-4xl"
        hideHeader={true}
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
          onOpenAI={(n) => {
            setViewingNote(null);
            const noteId = n?._id || n?.id;
            navigate(noteId ? `/arex?noteId=${noteId}` : '/arex');
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
