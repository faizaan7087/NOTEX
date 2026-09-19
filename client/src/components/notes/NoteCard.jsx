import React from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Badge } from '../ui/badge';
import { 
  Edit3, 
  Trash2, 
  Eye, 
  FileCode2, 
  Star, 
  Clock,
  Paperclip,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

export const NoteCard = ({
  note,
  onView,
  onEdit,
  onDelete,
  onExportXML,
  onToggleFavorite,
  index = 0
}) => {
  const formattedDate = new Date(note.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const attachmentsCount = Array.isArray(note.attachments) ? note.attachments.length : 0;
  const hasImages = note.attachments?.some(
    (a) => a.type?.startsWith('image/') || a.data?.startsWith('data:image/')
  );
  const hasPdfs = note.attachments?.some(
    (a) => a.type === 'application/pdf' || a.name?.toLowerCase().endsWith('.pdf')
  );

  const excerpt = note.content && note.content.trim()
    ? note.content.length > 150
      ? note.content.substring(0, 150) + '...'
      : note.content
    : attachmentsCount > 0
      ? `Attached: ${attachmentsCount} study material${attachmentsCount === 1 ? '' : 's'} (${hasImages ? 'Images/Diagrams' : ''}${hasImages && hasPdfs ? ' & ' : ''}${hasPdfs ? 'PDF Documents' : ''})`
      : 'No text description provided.';

  const handleStarClick = (e) => {
    e.stopPropagation();
    if (!note.isFavorite) {
      try {
        confetti({
          particleCount: 20,
          spread: 45,
          origin: {
            x: e.clientX / window.innerWidth,
            y: e.clientY / window.innerHeight
          },
          colors: ['#000000', '#f59e0b', '#a1a1aa'],
          ticks: 100,
          gravity: 1.2,
          scalar: 0.8
        });
      } catch (err) {
        // Safe fallback
      }
    }
    onToggleFavorite?.(note);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3), ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative flex flex-col justify-between rounded-2xl bg-white/85 backdrop-blur-md border border-zinc-200/80 p-5 shadow-xs hover:shadow-md hover:border-black/25 transition-all overflow-hidden cursor-pointer"
      onClick={() => onView(note)}
    >
      {/* Top Bar: Subject Badge + Attachments indicator + Favorite Star */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge subject={note.subject}>
              {note.subject}
            </Badge>

            {attachmentsCount > 0 && (
              <span 
                className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200"
                title={`${attachmentsCount} attachment(s)`}
              >
                {hasImages && <ImageIcon className="w-3 h-3 text-zinc-600" />}
                {hasPdfs && <FileText className="w-3 h-3 text-rose-600" />}
                {!hasImages && !hasPdfs && <Paperclip className="w-3 h-3 text-zinc-500" />}
                <span>{attachmentsCount}</span>
              </span>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.1 }}
            onClick={handleStarClick}
            className={`p-1.5 rounded-xl transition-all ${
              note.isFavorite
                ? 'text-amber-500 bg-amber-50 border border-amber-200 shadow-2xs'
                : 'text-zinc-400 hover:text-black hover:bg-zinc-100'
            }`}
            title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`w-4 h-4 ${note.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
          </motion.button>
        </div>

        {/* Note Title */}
        <h4 className="text-base font-bold text-zinc-950 group-hover:text-black transition-colors font-display line-clamp-1 mb-2">
          {note.title}
        </h4>

        {/* Content Excerpt */}
        <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3 mb-4 font-sans whitespace-pre-line">
          {excerpt}
        </p>
      </div>

      {/* Bottom Section: Tags & Actions */}
      <div className="space-y-3 pt-3 border-t border-zinc-100 mt-auto">
        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100/90 text-zinc-700 border border-zinc-200/70 hover:border-zinc-300"
              >
                #{tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-lg text-zinc-500 bg-zinc-100 border border-zinc-200/60">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Date and Quick Action Buttons */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{formattedDate}</span>
          </div>

          <div 
            className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onView(note)}
              className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
              title="View Note"
            >
              <Eye className="w-3.5 h-3.5" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onExportXML(note)}
              className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
              title="Export as XML"
            >
              <FileCode2 className="w-3.5 h-3.5" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onEdit(note)}
              className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
              title="Edit Note"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(note)}
              className="p-1.5 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete Note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
