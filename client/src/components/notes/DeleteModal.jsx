import React from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';

export const DeleteModal = ({
  isOpen,
  onClose,
  note,
  onConfirm,
  loading = false
}) => {
  if (!note) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Academic Note"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-rose-900">This action cannot be undone.</p>
            <p className="text-rose-700">
              Are you sure you want to permanently delete <strong className="text-rose-950 font-bold">"{note.title}"</strong> from your database?
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            loading={loading}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold border-rose-600 shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Permanently</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
