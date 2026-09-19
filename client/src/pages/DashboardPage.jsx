import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NoteCard } from '../components/notes/NoteCard';
import { Button } from '../components/ui/button';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { Meteors } from '../components/ui/Meteors';
import { 
  BookOpen, 
  Layers, 
  Tag as TagIcon, 
  Star, 
  Plus, 
  ArrowRight, 
  FolderOpen,
  DownloadCloud,
  Folder,
  Sparkles,
  Flame,
  Clock,
  HardDrive,
  CheckCircle2,
  FileCode2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Dynamic gradients tailored for academic subjects
const SUBJECT_GRADIENTS = [
  'from-emerald-500 to-teal-700',
  'from-indigo-500 to-violet-700',
  'from-blue-500 to-cyan-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-purple-500 to-indigo-600',
  'from-teal-500 to-emerald-700',
  'from-fuchsia-500 to-purple-600',
];

export const DashboardPage = ({
  stats,
  notes = [],
  subjects = [],
  folders = [],
  loading = false,
  onViewNote,
  onEditNote,
  onDeleteNote,
  onExportXML,
  onToggleFavorite,
  onNavigate,
  onNavigateFolder,
  onShareFolder,
  onOpenImportShared
}) => {
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';
  const recentNotes = notes.slice(0, 6);

  // Live time state
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isDriveConnected = user?.driveConnected || !!user?.driveRootFolderId || !!user?.googleId;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20">
      
      {/* 1. Sleek Compact Hero Banner with Meteors */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white shadow-xl border border-white/10 overflow-hidden flex flex-col justify-between"
      >
        {/* Aceternity Meteors Effect */}
        <Meteors number={12} />

        {/* Top Pill Badges */}
        <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-zinc-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Academic Workspace</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{currentTime}</span>
          </div>
        </div>

        {/* Hero Title & Description */}
        <div className="relative z-10 my-2 space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-display tracking-tight text-white">
            Welcome back, {firstName} ⚡
          </h1>
          <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
            Store notes like a variable. Your unit summaries, formulas, and attachments are organized and structured.
          </p>
        </div>

        {/* Bottom Actions Row */}
        <div className="relative z-10 flex items-center gap-3 pt-2 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('new-note')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold shadow-md hover:bg-zinc-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Note</span>
          </motion.button>

          {onOpenImportShared && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenImportShared}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-semibold backdrop-blur-md transition-colors"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-zinc-300" />
              <span>Import Repo Code</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* 2. Sleek KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Notes */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => onNavigate('notes')}
          className="group p-4 sm:p-5 rounded-2xl bg-white/85 backdrop-blur-md border border-zinc-200/90 shadow-2xs hover:shadow-sm hover:border-black/20 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-500">Total Notes</span>
            <div className="p-1.5 rounded-xl bg-zinc-100 text-zinc-800">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-zinc-950 font-display tracking-tight">
            <AnimatedCounter value={stats?.totalNotes || notes.length || 0} />
          </div>
        </motion.div>

        {/* Subjects */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => onNavigate('notes')}
          className="group p-4 sm:p-5 rounded-2xl bg-white/85 backdrop-blur-md border border-zinc-200/90 shadow-2xs hover:shadow-sm hover:border-black/20 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-500">Subjects &amp; Units</span>
            <div className="p-1.5 rounded-xl bg-zinc-100 text-zinc-800">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-zinc-950 font-display tracking-tight">
            <AnimatedCounter value={stats?.totalSubjects || subjects.length || 0} />
          </div>
        </motion.div>

        {/* Topics & Tags */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => onNavigate('notes')}
          className="group p-4 sm:p-5 rounded-2xl bg-white/85 backdrop-blur-md border border-zinc-200/90 shadow-2xs hover:shadow-sm hover:border-black/20 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-500">Topics &amp; Tags</span>
            <div className="p-1.5 rounded-xl bg-zinc-100 text-zinc-800">
              <TagIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-zinc-950 font-display tracking-tight">
            <AnimatedCounter value={stats?.totalTags || 0} />
          </div>
        </motion.div>

        {/* Starred */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => onNavigate('notes')}
          className="group p-4 sm:p-5 rounded-2xl bg-white/85 backdrop-blur-md border border-zinc-200/90 shadow-2xs hover:shadow-sm hover:border-amber-400/40 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-500">Starred Notes</span>
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-500 border border-amber-200">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-zinc-950 font-display tracking-tight">
            <AnimatedCounter value={stats?.favoritesCount || 0} />
          </div>
        </motion.div>

      </div>

      {/* 3. Subjects & Courses with Vibrant Gradient Badges */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-display flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-zinc-600" />
            <span>Subjects &amp; Courses ({subjects.length})</span>
          </h3>
          {subjects.length > 0 && (
            <button
              onClick={() => onNavigate('notes')}
              className="text-xs font-semibold text-zinc-600 hover:text-black flex items-center gap-1 transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {subjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {subjects.map((sub, idx) => {
              const gradient = SUBJECT_GRADIENTS[idx % SUBJECT_GRADIENTS.length];

              return (
                <motion.div
                  key={sub.name}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                  whileHover={{ y: -3 }}
                  onClick={() => onNavigate('notes', sub.name)}
                  className="group relative flex items-center justify-between p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-zinc-200/90 hover:border-black/25 shadow-2xs hover:shadow-md transition-all cursor-pointer overflow-hidden"
                >
                  <div className="flex items-center gap-3 truncate pr-2">
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-sm font-bold text-zinc-950 truncate group-hover:text-black">
                        {sub.name}
                      </h4>
                      <p className="text-[11px] text-zinc-400 font-mono">
                        {sub.count} {sub.count === 1 ? 'note' : 'notes'}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-black group-hover:translate-x-1 transition-all shrink-0" />
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-white/80 border border-zinc-200/80 text-center">
            <p className="text-xs text-zinc-500">No course subjects created yet.</p>
          </div>
        )}
      </div>

      {/* 4. Recent Notes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-display flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
            <span>Recent Notes</span>
          </h3>
          {notes.length > 0 && (
            <button
              onClick={() => onNavigate('notes')}
              className="text-xs font-semibold text-zinc-600 hover:text-black flex items-center gap-1 transition-colors"
            >
              <span>Explore all ({notes.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {recentNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentNotes.map((note, idx) => (
              <NoteCard
                key={note._id || note.id}
                index={idx}
                note={note}
                onView={onViewNote}
                onEdit={onEditNote}
                onDelete={onDeleteNote}
                onExportXML={onExportXML}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="p-10 rounded-3xl bg-white/80 border border-zinc-200/80 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900">Your vault is clean and empty</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Create a note, organize into folders, or drag &amp; drop study PDFs and diagrams.
              </p>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => onNavigate('new-note')}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Note</span>
            </Button>
          </div>
        )}
      </div>

    </div>
  );
};
