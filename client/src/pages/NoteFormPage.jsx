import React from 'react';
import { NoteForm } from '../components/notes/NoteForm';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const NoteFormPage = ({
  initialData = null,
  folders = [],
  onSave,
  onCancel,
  onRequestCreateFolder,
  loading = false
}) => {
  const isEditing = !!initialData?._id || !!initialData?.id;

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-300 pb-12">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Notes</span>
        </button>

        <span className="text-xs text-zinc-400 font-medium">
          {isEditing ? 'Editing Note' : 'New Note'}
        </span>
      </div>

      {/* Editor Canvas Container */}
      <div className="rounded-3xl bg-white border border-zinc-200/80 shadow-xs p-6 sm:p-10 transition-all">
        <NoteForm
          initialData={initialData}
          folders={folders}
          onSave={onSave}
          onCancel={onCancel}
          onRequestCreateFolder={onRequestCreateFolder}
          loading={loading}
        />
      </div>

    </div>
  );
};
