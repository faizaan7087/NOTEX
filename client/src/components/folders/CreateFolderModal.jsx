import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Folder, FolderPlus, Palette } from 'lucide-react';

const FOLDER_COLORS = [
  { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-500' },
  { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-500' },
  { id: 'amber', name: 'Amber', bg: 'bg-amber-500' },
  { id: 'rose', name: 'Rose', bg: 'bg-rose-500' },
  { id: 'sky', name: 'Sky', bg: 'bg-sky-500' },
  { id: 'purple', name: 'Purple', bg: 'bg-purple-500' },
  { id: 'zinc', name: 'Slate', bg: 'bg-zinc-700' }
];

export const CreateFolderModal = ({
  isOpen,
  onClose,
  onSaveFolder,
  folders = [],
  defaultParentId = null,
  initialFolder = null,
  loading = false
}) => {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState(defaultParentId || '');
  const [color, setColor] = useState('indigo');
  const [error, setError] = useState('');

  const isEditing = !!initialFolder;

  useEffect(() => {
    if (initialFolder) {
      setName(initialFolder.name || '');
      setParentId(initialFolder.parentId || '');
      setColor(initialFolder.color || 'indigo');
    } else {
      setName('');
      setParentId(defaultParentId || '');
      setColor('indigo');
    }
    setError('');
  }, [initialFolder, defaultParentId, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a folder name');
      return;
    }

    onSaveFolder({
      name: name.trim(),
      parentId: parentId ? parentId : null,
      color
    });
  };

  // Find parent folder name for context
  const selectedParent = folders.find(f => (f._id || f.id) === parentId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Rename / Edit Folder' : parentId ? `Create Subfolder in "${selectedParent?.name || 'Parent'}"` : 'Create New Folder'}
      description={
        parentId 
          ? 'Organize syllabus units, lecture series, or assignment topics inside this folder.' 
          : 'Create a top-level subject or course folder to group your notes.'
      }
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Folder Name Input */}
        <Input
          label="Folder Name"
          placeholder="e.g. Unit 1: Introduction, DBMS, Lab Manuals"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          error={error}
          autoFocus
          required
        />

        {/* Parent Folder Selector (Hierarchy) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
            Parent Location
          </label>
          <select
            value={parentId || ''}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full h-11 px-3.5 text-sm bg-white/80 border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-black shadow-2xs font-sans"
          >
            <option value="">📁 Root (Top-Level Subject Folder)</option>
            {folders
              .filter(f => !initialFolder || (f._id !== initialFolder._id && f.id !== initialFolder.id))
              .map((f) => {
                const isSub = !!f.parentId;
                return (
                  <option key={f._id || f.id} value={f._id || f.id}>
                    {isSub ? '   └── 📁 ' : '📁 '} {f.name}
                  </option>
                );
              })}
          </select>
          <p className="text-[11px] text-zinc-500">
            Choose Root for main subjects, or select a folder to nest as a Subfolder (e.g., Unit 1).
          </p>
        </div>

        {/* Color Theme Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-zinc-500" />
            <span>Folder Color Accent</span>
          </label>
          <div className="flex items-center gap-2">
            {FOLDER_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.id)}
                className={`w-7 h-7 rounded-full ${c.bg} transition-all ${
                  color === c.id
                    ? 'ring-2 ring-black ring-offset-2 scale-110 shadow-sm'
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            size="sm"
            loading={loading}
            className="shadow-sm min-w-[110px]"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{isEditing ? 'Save Changes' : 'Create Folder'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
