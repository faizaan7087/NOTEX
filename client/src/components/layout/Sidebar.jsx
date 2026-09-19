import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  BookOpen, 
  PlusCircle, 
  Folder, 
  FolderPlus,
  ChevronRight, 
  ChevronDown,
  ChevronLeft,
  X,
  Layers,
  Share2,
  MoreVertical,
  Edit3,
  Trash2,
  Plus,
  Settings as SettingsIcon,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export const Sidebar = ({
  isOpen,
  onClose,
  activePage,
  navigateTo,
  folders = [],
  currentFolderId,
  onNavigateFolder,
  onRequestCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onShareFolder,
  subjects = [],
  selectedSubject,
  onSelectSubject,
  stats,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [expandedFolders, setExpandedFolders] = useState({});
  const [activeMenuFolderId, setActiveMenuFolderId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuFolderId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFolderExpand = (folderId, e) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'notes',
      label: 'All Notes',
      icon: BookOpen,
      badge: stats?.totalNotes || null,
    },
    {
      id: 'new-note',
      label: 'New Note',
      icon: PlusCircle,
      badge: null,
    },
  ];

  const rootFolders = folders.filter(f => !f.parentId);
  const getSubfolders = (parentId) => folders.filter(f => f.parentId === parentId);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 glass-sidebar p-3 flex flex-col justify-between transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-[72px]' : 'w-64'}`}
      >
        <div className="space-y-4 overflow-y-auto overflow-x-hidden pr-0.5 scrollbar-none">
          
          {/* Top Header: Collapse Toggle on Desktop & Close on Mobile */}
          <div className={`flex items-center pb-2 border-b border-zinc-200/60 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isCollapsed ? (
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-display">
                Workspace
              </span>
            ) : null}

            {/* Desktop Collapse / Expand Toggle Button */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-xl text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors"
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Main Navigation Items */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigateTo(item.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`w-full flex items-center rounded-2xl transition-all select-none ${
                    isCollapsed 
                      ? 'justify-center p-2.5' 
                      : 'justify-between px-3 py-2 text-xs font-semibold'
                  } ${
                    isActive
                      ? 'bg-black text-white shadow-xs'
                      : 'text-zinc-600 hover:text-black hover:bg-white/80'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} min-w-0`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>
                  {!isCollapsed && item.badge !== null && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Folders & Units Section (Rendered only when expanded, or icon when collapsed) */}
          {!isCollapsed ? (
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-display">
                  Folders &amp; Units
                </span>
                {onRequestCreateFolder && (
                  <button
                    onClick={() => onRequestCreateFolder(null)}
                    className="p-1 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
                    title="New Top-Level Folder"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Folders Tree */}
              <div className="space-y-0.5">
                {rootFolders.map((rf) => {
                  const subfolders = getSubfolders(rf._id || rf.id);
                  const isExpanded = expandedFolders[rf._id || rf.id];
                  const isSelected = currentFolderId === (rf._id || rf.id);
                  const isMenuOpen = activeMenuFolderId === (rf._id || rf.id);

                  return (
                    <div key={rf._id || rf.id} className="space-y-0.5">
                      <div
                        onClick={() => {
                          onNavigateFolder(rf._id || rf.id);
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-zinc-200/80 text-black font-bold'
                            : 'text-zinc-700 hover:bg-white/80 hover:text-black'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          {subfolders.length > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => toggleFolderExpand(rf._id || rf.id, e)}
                              className="p-0.5 text-zinc-400 hover:text-black rounded"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ) : (
                            <span className="w-3.5" />
                          )}
                          <Folder className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate">{rf.name}</span>
                        </div>

                        {/* Right Actions: Note count & 3-dots */}
                        <div className="flex items-center gap-1 shrink-0">
                          {rf.noteCount > 0 && (
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {rf.noteCount}
                            </span>
                          )}

                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuFolderId(isMenuOpen ? null : (rf._id || rf.id));
                              }}
                              className="p-1 rounded text-zinc-400 hover:text-black hover:bg-zinc-200/70 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </button>

                            {isMenuOpen && (
                              <div 
                                ref={menuRef}
                                className="absolute right-0 top-5 w-40 rounded-2xl glass-modal p-1.5 z-50 shadow-xl text-zinc-800 border border-zinc-200 animate-in fade-in zoom-in-95 duration-100"
                              >
                                {onRequestCreateFolder && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuFolderId(null);
                                      onRequestCreateFolder(rf._id || rf.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-700 hover:text-black hover:bg-white rounded-xl"
                                  >
                                    <FolderPlus className="w-3.5 h-3.5" />
                                    <span>Add Subfolder</span>
                                  </button>
                                )}
                                {onEditFolder && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuFolderId(null);
                                      onEditFolder(rf);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-700 hover:text-black hover:bg-white rounded-xl"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Rename Folder</span>
                                  </button>
                                )}
                                {onDeleteFolder && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuFolderId(null);
                                      onDeleteFolder(rf);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-semibold"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete Folder</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Subfolders List */}
                      {isExpanded && subfolders.length > 0 && (
                        <div className="pl-6 space-y-0.5 border-l border-zinc-200/80 ml-4">
                          {subfolders.map((sf) => {
                            const isSfSelected = currentFolderId === (sf._id || sf.id);
                            return (
                              <div
                                key={sf._id || sf.id}
                                onClick={() => {
                                  onNavigateFolder(sf._id || sf.id);
                                  if (window.innerWidth < 1024) onClose();
                                }}
                                className={`flex items-center justify-between px-2.5 py-1 rounded-xl text-xs cursor-pointer transition-all ${
                                  isSfSelected
                                    ? 'bg-zinc-200/80 text-black font-bold'
                                    : 'text-zinc-600 hover:bg-white/80 hover:text-black'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <Folder className="w-3 h-3 text-zinc-400 shrink-0" />
                                  <span className="truncate">{sf.name}</span>
                                </div>
                                {sf.noteCount > 0 && (
                                  <span className="text-[10px] text-zinc-400 font-mono">
                                    {sf.noteCount}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {rootFolders.length === 0 && (
                  <div className="px-2.5 py-2 text-[11px] text-zinc-400 italic">
                    No folders created.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Collapsed Folder Shortcut Icon */
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => {
                  navigateTo('notes');
                  if (window.innerWidth < 1024) onClose();
                }}
                className="p-2.5 rounded-2xl text-zinc-500 hover:text-black hover:bg-white/80 transition-colors"
                title="Explore Folders & Units"
              >
                <Folder className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

        {/* Sidebar Footer with Settings & Collapse */}
        <div className="pt-2 border-t border-zinc-200/60 space-y-2">
          <button
            onClick={() => {
              navigateTo('settings');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center rounded-2xl transition-all ${
              isCollapsed 
                ? 'justify-center p-2.5' 
                : 'gap-2.5 px-3 py-2 text-xs font-semibold'
            } ${
              activePage === 'settings'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-black hover:bg-white/80'
            }`}
            title={isCollapsed ? 'Settings & Vault' : undefined}
          >
            <SettingsIcon className="w-4 h-4 text-zinc-500 shrink-0" />
            {!isCollapsed && <span>Settings &amp; Vault</span>}
          </button>

          {!isCollapsed && (
            <div className="px-1 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>NOTEX v1.0</span>
              <span>Google Drive</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
