import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReminders } from '../context/RemindersContext';
import { CreateReminderModal } from '../components/reminders/CreateReminderModal';
import { 
  Bell, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Flag, 
  Trash2, 
  ExternalLink, 
  Volume2, 
  AlertTriangle, 
  BookOpen,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';

export const RemindersPage = ({
  subjects = [],
  notes = [],
  onViewNote,
  onNavigate
}) => {
  const { 
    reminders, 
    activeReminders, 
    completedReminders, 
    overdueReminders, 
    permission, 
    requestPermission, 
    createReminder, 
    toggleComplete, 
    deleteReminder,
    loading 
  } = useReminders();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'today' | 'high' | 'completed'
  const [modalOpen, setModalOpen] = useState(false);

  // Format Due relative badge
  const getDueStatus = (dueDateStr, isCompleted) => {
    if (isCompleted) return { label: 'Completed', color: 'text-zinc-400 bg-zinc-100 border-zinc-200' };
    const dueTime = new Date(dueDateStr).getTime();
    const now = Date.now();
    const diff = dueTime - now;

    if (diff < 0) {
      const hoursAgo = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
      return { 
        label: hoursAgo < 24 ? `Overdue by ${hoursAgo || 1}h` : `Overdue by ${Math.floor(hoursAgo / 24)}d`, 
        color: 'text-rose-700 bg-rose-50 border-rose-200 font-bold' 
      };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) {
      const mins = Math.floor(diff / (1000 * 60));
      return { label: `Due in ${mins || 1} min`, color: 'text-amber-700 bg-amber-50 border-amber-200 font-bold animate-pulse' };
    }
    if (hours < 24) {
      return { label: `Due in ${hours}h`, color: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
    const days = Math.floor(hours / 24);
    if (days === 1) {
      return { label: 'Due tomorrow', color: 'text-zinc-700 bg-zinc-100 border-zinc-200' };
    }
    return { label: `Due in ${days} days`, color: 'text-zinc-600 bg-zinc-100 border-zinc-200' };
  };

  // Filtered lists
  const isToday = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const getFilteredReminders = () => {
    switch (activeTab) {
      case 'today':
        return activeReminders.filter(r => isToday(r.dueDate));
      case 'high':
        return activeReminders.filter(r => r.priority === 'high');
      case 'completed':
        return completedReminders;
      case 'active':
      default:
        return activeReminders;
    }
  };

  const displayedReminders = getFilteredReminders();

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-zinc-950 text-white border border-zinc-800 shadow-xl relative overflow-hidden">
        {/* Subtle Ambient Light Cone */}
        <div 
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.8) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-zinc-300 shadow-2xs">
            <Bell className="w-3.5 h-3.5 text-zinc-300" />
            <span>Browser Revision Reminders</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
            Study Reminders &amp; Deadlines
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-normal max-w-xl">
            Never miss a formula revision, lab submission, or viva prep. NOTEX delivers popups and audio chimes directly to your browser.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-zinc-950 text-xs font-bold shadow-md hover:bg-zinc-100 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-zinc-950" />
            <span>Schedule Reminder</span>
          </motion.button>
        </div>
      </div>

      {/* 2. Browser Notification Permission Status Banner */}
      {permission !== 'granted' && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Browser Notifications are currently disabled.</span> Enable notifications to receive sound chimes and OS banner alerts even when NOTEX is running in another tab.
            </div>
          </div>
          <button
            onClick={requestPermission}
            className="px-3.5 py-1.5 rounded-xl bg-amber-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-2xs cursor-pointer shrink-0 self-start sm:self-auto"
          >
            Enable Notifications
          </button>
        </motion.div>
      )}

      {/* 3. KPI Quick Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Active</p>
          <p className="text-2xl font-black font-display text-zinc-950 mt-1">{activeReminders.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Due Today</p>
          <p className="text-2xl font-black font-display text-amber-700 mt-1">
            {activeReminders.filter(r => isToday(r.dueDate)).length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">Overdue</p>
          <p className="text-2xl font-black font-display text-rose-700 mt-1">{overdueReminders.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Completed</p>
          <p className="text-2xl font-black font-display text-emerald-700 mt-1">{completedReminders.length}</p>
        </div>
      </div>

      {/* 4. Tab Navigation */}
      <div className="flex items-center gap-1.5 border-b border-zinc-200 pb-2">
        {[
          { id: 'active', label: `Active (${activeReminders.length})` },
          { id: 'today', label: 'Due Today' },
          { id: 'high', label: 'High Priority' },
          { id: 'completed', label: `Completed (${completedReminders.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-zinc-950 text-white shadow-2xs'
                : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 5. Reminders List */}
      <div className="space-y-3">
        {displayedReminders.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-zinc-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 font-display">
              {activeTab === 'completed' ? 'No completed reminders yet' : 'All caught up! No reminders due.'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {activeTab === 'completed' 
                ? 'Check off tasks as you finish study sessions to see them here.'
                : 'Schedule a revision reminder for upcoming exams or assignments.'}
            </p>
            {activeTab !== 'completed' && (
              <button
                onClick={() => setModalOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-950 text-white text-xs font-semibold shadow-xs hover:bg-black cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Reminder</span>
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {displayedReminders.map((reminder) => {
              const due = getDueStatus(reminder.dueDate, reminder.isCompleted);
              const formattedDate = new Date(reminder.dueDate).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              const linkedNote = reminder.noteId 
                ? notes.find(n => (n._id === reminder.noteId || n.id === reminder.noteId))
                : null;

              return (
                <motion.div
                  key={reminder._id || reminder.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all shadow-2xs hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    reminder.isCompleted ? 'border-zinc-200/60 opacity-60' : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Completion Toggle */}
                    <button
                      onClick={() => toggleComplete(reminder)}
                      className={`mt-0.5 p-1 rounded-full transition-all cursor-pointer shrink-0 ${
                        reminder.isCompleted 
                          ? 'text-emerald-600 bg-emerald-50' 
                          : 'text-zinc-300 hover:text-black hover:bg-zinc-100'
                      }`}
                      title={reminder.isCompleted ? "Mark incomplete" : "Mark as done"}
                    >
                      {reminder.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 fill-emerald-600 text-white" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-bold font-display ${reminder.isCompleted ? 'line-through text-zinc-400' : 'text-zinc-950'}`}>
                          {reminder.title}
                        </h4>

                        {/* Priority Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                          reminder.priority === 'high' 
                            ? 'bg-rose-50 border-rose-200 text-rose-700' 
                            : reminder.priority === 'medium'
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}>
                          {reminder.priority}
                        </span>

                        {/* Subject Badge */}
                        {reminder.subject && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700">
                            {reminder.subject}
                          </span>
                        )}
                      </div>

                      {reminder.description && (
                        <p className="text-xs text-zinc-500 font-sans leading-relaxed line-clamp-2">
                          {reminder.description}
                        </p>
                      )}

                      {/* Due Time & Linked Note */}
                      <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap pt-0.5">
                        <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-600">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{formattedDate}</span>
                        </span>

                        <span className={`text-[11px] px-2 py-0.5 rounded-md border ${due.color}`}>
                          {due.label}
                        </span>

                        {/* Linked Note jump button */}
                        {linkedNote && (
                          <button
                            onClick={() => onViewNote?.(linkedNote)}
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-200 cursor-pointer"
                            title={`Open note: ${linkedNote.title}`}
                          >
                            <BookOpen className="w-3 h-3 text-indigo-600" />
                            <span className="truncate max-w-[150px]">{linkedNote.title}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => deleteReminder(reminder._id || reminder.id)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete reminder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Schedule Modal */}
      <CreateReminderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={createReminder}
        subjects={subjects}
        notes={notes}
        loading={loading}
      />

    </div>
  );
};
