import React, { useState } from 'react';
import { Modal } from '../ui/modal';
import { Bell, Calendar, Clock, Flag, BookOpen, AlertCircle } from 'lucide-react';

export const CreateReminderModal = ({
  isOpen,
  onClose,
  onSave,
  subjects = [],
  notes = [],
  loading = false
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Default due date: tomorrow at 09:00 AM
  const getDefaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };
  const [dueDate, setDueDate] = useState(getDefaultDueDate);
  const [priority, setPriority] = useState('medium');
  const [subject, setSubject] = useState('');
  const [noteId, setNoteId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onSave({
      title: title.trim(),
      description: description.trim(),
      dueDate: new Date(dueDate).toISOString(),
      priority,
      subject: subject || '',
      noteId: noteId || null
    });

    // Reset & close
    setTitle('');
    setDescription('');
    setDueDate(getDefaultDueDate());
    setPriority('medium');
    setSubject('');
    setNoteId('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Study Reminder"
      description="Get notified in your browser when it is time to review or complete assignments."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
            Reminder Title *
          </label>
          <div className="relative">
            <Bell className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Revise Fourier Transform Formulae, Submit Lab 3"
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/80 pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black"
              autoFocus
            />
          </div>
        </div>

        {/* Due Date & Time */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
            Due Date &amp; Time *
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="datetime-local"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/80 pl-10 pr-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-black font-mono"
            />
          </div>
        </div>

        {/* Priority Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
            Priority Level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'low', label: 'Low', color: 'border-emerald-200 text-emerald-700 bg-emerald-50/50' },
              { id: 'medium', label: 'Medium', color: 'border-amber-200 text-amber-700 bg-amber-50/50' },
              { id: 'high', label: 'High', color: 'border-rose-200 text-rose-700 bg-rose-50/50' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPriority(p.id)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  priority === p.id 
                    ? `${p.color} ring-2 ring-black font-bold` 
                    : 'border-zinc-200 text-zinc-600 bg-white hover:bg-zinc-50'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Subject & Linked Note in 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
              Course Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="">No Subject Linked</option>
              {subjects.map((s, idx) => {
                const name = typeof s === 'string' ? s : s?.name || '';
                if (!name) return null;
                return (
                  <option key={idx} value={name}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Linked Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
              Link to Note
            </label>
            <select
              value={noteId}
              onChange={(e) => setNoteId(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-black truncate"
            >
              <option value="">No Note Linked</option>
              {notes.map((n) => (
                <option key={n._id || n.id} value={n._id || n.id}>
                  {n.title || 'Untitled Note'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes / Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
            Notes / Details (Optional)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional context, equations to remember, or checklist..."
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/80 px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{loading ? 'Scheduling...' : 'Set Reminder'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
