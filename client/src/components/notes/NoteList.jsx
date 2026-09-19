import React from 'react';
import { NoteCard } from './NoteCard';
import { Button } from '../ui/button';
import { BookOpen, SearchX, Plus } from 'lucide-react';

export const NoteList = ({
  notes = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onExportXML,
  onToggleFavorite,
  onCreateNew,
  searchQuery = '',
  selectedSubject = 'all',
  onClearFilters
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div
            key={idx}
            className="h-56 rounded-2xl border border-zinc-200 bg-white animate-pulse p-5 space-y-4 shadow-sm"
          >
            <div className="flex justify-between items-center">
              <div className="h-5 w-20 bg-zinc-200 rounded-full" />
              <div className="h-5 w-5 bg-zinc-200 rounded-lg" />
            </div>
            <div className="h-6 w-3/4 bg-zinc-200 rounded-lg" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-zinc-100 rounded" />
              <div className="h-3 w-5/6 bg-zinc-100 rounded" />
              <div className="h-3 w-4/6 bg-zinc-100 rounded" />
            </div>
            <div className="pt-4 flex justify-between">
              <div className="h-4 w-24 bg-zinc-200 rounded" />
              <div className="h-4 w-16 bg-zinc-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // If no notes exist matching search/filter
  if (notes.length === 0) {
    const isFiltered = searchQuery || (selectedSubject && selectedSubject !== 'all');
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-zinc-300 bg-white shadow-sm">
        <div className="p-4 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-900 mb-4">
          {isFiltered ? <SearchX className="w-8 h-8" /> : <BookOpen className="w-8 h-8" />}
        </div>

        <h3 className="text-lg font-bold text-zinc-950 font-display mb-1">
          {isFiltered ? 'No matching notes found' : 'No notes created yet'}
        </h3>

        <p className="text-sm text-zinc-500 max-w-sm mb-6 leading-relaxed">
          {isFiltered
            ? `We couldn't find any notes matching "${searchQuery || selectedSubject}". Try adjusting your filters or search terms.`
            : 'Start organizing your semester topics, lecture notes, and exam formulas in one clean place.'}
        </p>

        {isFiltered ? (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear Search &amp; Filters
          </Button>
        ) : (
          <Button variant="default" onClick={onCreateNew}>
            <Plus className="w-4 h-4" />
            <span>Create Your First Note</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {notes.map((note) => (
        <NoteCard
          key={note._id || note.id}
          note={note}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onExportXML={onExportXML}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
};
