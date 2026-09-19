import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, Tag as TagIcon, ArrowRight } from 'lucide-react';
import { GooeyInput } from '../ui/GooeyInput';
import { Badge } from '../ui/badge';

export const SearchModal = ({
  isOpen,
  onClose,
  notes = [],
  onSelectNote
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotes = query.trim()
    ? notes.filter((n) => {
        const q = query.toLowerCase();
        return (
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.subject && n.subject.toLowerCase().includes(q)) ||
          (n.content && n.content.toLowerCase().includes(q)) ||
          (n.tags && n.tags.some((t) => t.toLowerCase().includes(q)))
        );
      })
    : notes.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-2xl rounded-3xl bg-white border border-zinc-200/90 shadow-2xl z-10 overflow-hidden text-zinc-900 p-4 space-y-3"
      >
        {/* Gooey Animated Search Input */}
        <GooeyInput
          value={query}
          onChange={setQuery}
          onClear={() => setQuery('')}
          autoFocus
        />

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto space-y-1 pt-1">
          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              No notes matching "{query}"
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note._id || note.id}
                onClick={() => {
                  onSelectNote(note);
                  onClose();
                }}
                className="group flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200/80 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 group-hover:bg-black group-hover:text-white transition-colors shrink-0 shadow-2xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-zinc-900 group-hover:text-black truncate">
                      {note.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge subject={note.subject}>
                        {note.subject}
                      </Badge>
                      {note.tags && note.tags.length > 0 && (
                        <span className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
                          <TagIcon className="w-3 h-3" />
                          #{note.tags[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                    {new Date(note.createdAt || Date.now()).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer Key Hint */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-[11px] text-zinc-400 px-1">
          <span>Navigate with mouse or keyboard</span>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-mono">
            ESC to close
          </kbd>
        </div>
      </motion.div>
    </div>
  );
};
