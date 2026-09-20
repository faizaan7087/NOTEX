import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../../context/ToastContext';
import { 
  Bot, 
  ExternalLink, 
  Folder, 
  Sparkles, 
  ClipboardPaste, 
  CheckCircle2, 
  BookOpen, 
  Tag as TagIcon,
  HelpCircle
} from 'lucide-react';

export const BookmarkChatModal = ({
  isOpen,
  onClose,
  onSave,
  folders = [],
  subjects = [],
  currentFolderId = null,
  initialSubject = ''
}) => {
  const toast = useToast();
  const [chatGptUrl, setChatGptUrl] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(initialSubject || (subjects[0]?.name || ''));
  const [folderId, setFolderId] = useState(currentFolderId || '');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('chatgpt, ai-answers');
  const [loading, setLoading] = useState(false);

  // Validate if input looks like a valid ChatGPT or AI chat link
  const isGptLink = chatGptUrl.includes('chatgpt.com') || 
                    chatGptUrl.includes('openai.com') || 
                    chatGptUrl.includes('claude.ai') || 
                    chatGptUrl.includes('gemini.google.com') ||
                    chatGptUrl.startsWith('http://') ||
                    chatGptUrl.startsWith('https://');

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setChatGptUrl(text.trim());
        toast.success('Pasted link from clipboard!');
      }
    } catch (err) {
      toast.error('Clipboard access not granted. Please paste manually.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!chatGptUrl.trim()) {
      toast.error('Please paste your ChatGPT share link.');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a question or topic title.');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter or select a course subject.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        title: title.trim(),
        subject: subject.trim(),
        folderId: folderId || null,
        chatGptUrl: chatGptUrl.trim(),
        content: content.trim() || `ChatGPT Shared Chat: ${chatGptUrl.trim()}\n\nQuestion / Topic: ${title.trim()}`,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        color: 'emerald'
      });

      toast.success('ChatGPT link bookmarked into your vault!');
      // Reset form
      setChatGptUrl('');
      setTitle('');
      setContent('');
      onClose();
    } catch (err) {
      console.error('[Bookmark Error]:', err);
      toast.error(err.message || 'Failed to save ChatGPT bookmark.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bookmark ChatGPT Link"
      description="Save and categorize AI question answers so you can find them in 1 second during exams."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-zinc-900">
        
        {/* ChatGPT Link Input with Fast Paste Button */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-emerald-600" />
              <span>ChatGPT Share Link *</span>
            </label>
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-black bg-zinc-100 hover:bg-zinc-200/80 px-2 py-0.5 rounded-md transition-colors"
            >
              <ClipboardPaste className="w-3 h-3" />
              <span>Paste from Clipboard</span>
            </button>
          </div>

          <div className="relative">
            <input
              type="url"
              required
              value={chatGptUrl}
              onChange={(e) => setChatGptUrl(e.target.value)}
              placeholder="https://chatgpt.com/share/67df..."
              className="w-full h-11 pl-3.5 pr-10 text-xs sm:text-sm bg-white border border-zinc-300 rounded-xl font-mono text-zinc-900 focus:outline-none focus:border-black shadow-2xs placeholder:text-zinc-400 placeholder:font-sans"
            />
            {chatGptUrl && (
              <a
                href={chatGptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-emerald-600 p-1"
                title="Open link in new tab to test"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          {chatGptUrl && isGptLink && (
            <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Valid AI share link detected</span>
            </p>
          )}
        </div>

        {/* Question / Topic Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
            Question or Topic Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Banker's Algorithm Step-by-Step with 3 Processes"
            className="w-full h-11 px-3.5 text-sm bg-white border border-zinc-300 rounded-xl text-zinc-900 font-semibold focus:outline-none focus:border-black shadow-2xs placeholder:font-normal placeholder:text-zinc-400"
          />
        </div>

        {/* Subject & Folder Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Subject Selector / Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
              <span>Subject / Course *</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., OS, DBMS, CN"
              list="suggested-subjects"
              className="w-full h-10 px-3.5 text-xs sm:text-sm bg-white border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-black shadow-2xs"
            />
            <datalist id="suggested-subjects">
              {subjects.map(s => (
                <option key={s.name} value={s.name} />
              ))}
            </datalist>
          </div>

          {/* Unit / Folder Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-zinc-500" />
              <span>Unit Folder (Optional)</span>
            </label>
            <select
              value={folderId || ''}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-white border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-black shadow-2xs"
            >
              <option value="">Root / All Notes</option>
              {folders.map((f) => {
                const isSub = !!f.parentId;
                return (
                  <option key={f._id || f.id} value={f._id || f.id}>
                    {isSub ? '   └── ' : ''}{f.name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Key Summary / Answer Preview (Optional) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
            Quick Key Points or Question Prompt (Optional)
          </label>
          <textarea
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste a quick 2-line summary or formula if you want to view without opening the link..."
            className="w-full p-3 text-xs bg-white border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-black shadow-2xs resize-none"
          />
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
            <TagIcon className="w-3.5 h-3.5 text-zinc-500" />
            <span>Tags (comma separated)</span>
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="chatgpt, assignment, viva, 5mark"
            className="w-full h-9 px-3 text-xs bg-white border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-black shadow-2xs"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            size="sm"
            loading={loading}
            className="bg-black hover:bg-zinc-800 text-white font-bold"
          >
            <Bot className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            <span>Save ChatGPT Link</span>
          </Button>
        </div>

      </form>
    </Modal>
  );
};
