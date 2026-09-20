import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import { 
  Calendar, 
  Clock, 
  Copy, 
  Check, 
  FileCode2, 
  Edit3, 
  Trash2, 
  Star,
  Paperclip,
  FileText,
  Download,
  ExternalLink,
  Eye,
  Maximize2,
  Bot,
  Link as LinkIcon,
  Globe
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import { openAttachmentInNewTab } from '../../utils/fileHelper';

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const NoteViewer = ({
  note,
  onEdit,
  onDelete,
  onExportXML,
  onClose
}) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  if (!note) return null;

  const handleCopy = () => {
    const textToCopy = `Title: ${note.title}\nSubject: ${note.subject}\nTags: ${(note.tags || []).join(', ')}\n\n${note.content}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success('Note content copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadAttachment = (att) => {
    const link = document.createElement('a');
    link.href = att.data;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${att.name}`);
  };

  const handleOpenInNewTab = (att) => {
    openAttachmentInNewTab(att.data, att.name, att.type);
  };

  const createdDate = new Date(note.createdAt || Date.now()).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const updatedDate = new Date(note.updatedAt || Date.now()).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const attachments = Array.isArray(note.attachments) ? note.attachments : [];
  const linkAttachments = attachments.filter(
    (a) => a.type?.startsWith('link') || a.type === 'link/chatgpt' || a.type === 'link/web'
  );
  const imageAttachments = attachments.filter(
    (a) => !a.type?.startsWith('link') && (a.type?.startsWith('image/') || a.data?.startsWith('data:image/'))
  );
  const fileAttachments = attachments.filter(
    (a) => !a.type?.startsWith('link') && !(a.type?.startsWith('image/') || a.data?.startsWith('data:image/'))
  );

  return (
    <>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="space-y-3 pb-4 border-b border-zinc-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge subject={note.subject} className="text-xs px-3 py-1">
                {note.subject}
              </Badge>
              {note.isFavorite && (
                <span className="flex items-center gap-1 text-xs text-black bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-black text-black" />
                  <span>Starred</span>
                </span>
              )}
              {attachments.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200 font-medium">
                  <Paperclip className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{attachments.length} {attachments.length === 1 ? 'item' : 'items'}</span>
                </span>
              )}
            </div>

            {/* Quick Toolbar */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="text-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onExportXML(note)}
                className="text-xs text-zinc-700 hover:text-black"
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>XML</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose?.();
                  onEdit(note);
                }}
                className="text-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  onClose?.();
                  onDelete(note);
                }}
                className="text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Note Title */}
          <h2 className="text-2xl font-bold text-zinc-950 font-display tracking-tight leading-snug">
            {note.title}
          </h2>

          {/* Dates */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Created: {createdDate}</span>
            </div>
            {note.updatedAt && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Updated: {updatedDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Linked ChatGPT Thread Banner */}
        {note.chatGptUrl && (
          <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-emerald-950 truncate">
                  ChatGPT Shared Question &amp; Answer Thread
                </p>
                <p className="text-[11px] text-emerald-700 font-mono truncate">
                  {note.chatGptUrl}
                </p>
              </div>
            </div>
            <a
              href={note.chatGptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
            >
              <span>Open Full Thread</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Note Content Body with Rich Markdown & Inline Elements */}
        {note.content && note.content.trim() ? (
          <div className="rounded-2xl bg-zinc-50/80 border border-zinc-200 p-6 shadow-xs">
            <MarkdownRenderer content={note.content} attachments={note.attachments || []} />
          </div>
        ) : attachments.length === 0 ? (
          <div className="rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 p-5 text-center text-xs text-zinc-400 italic">
            No text content provided.
          </div>
        ) : null}

        {/* Linked Resources & Web Blocks */}
        {linkAttachments.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              Attached Link Blocks &amp; References ({linkAttachments.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {linkAttachments.map((link) => {
                const isGpt = link.type === 'link/chatgpt' || link.data?.includes('chatgpt.com') || link.data?.includes('openai.com');

                return (
                  <div
                    key={link.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border shadow-xs transition-all ${
                      isGpt
                        ? 'bg-emerald-50/80 border-emerald-200 hover:border-emerald-300'
                        : 'bg-white border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isGpt 
                          ? 'bg-emerald-600 text-white shadow-xs' 
                          : 'bg-zinc-900 text-white'
                      }`}>
                        {isGpt ? <Bot className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-950 truncate" title={link.name}>
                          {link.name}
                        </p>
                        <p className={`text-[11px] font-mono truncate ${
                          isGpt ? 'text-emerald-700' : 'text-zinc-500'
                        }`}>
                          {link.data}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={link.data}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-colors ${
                          isGpt
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-zinc-900 hover:bg-black text-white'
                        }`}
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Image Attachments Gallery */}
        {imageAttachments.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Attached Images &amp; Diagrams ({imageAttachments.length})
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {imageAttachments.map((img) => (
                <div
                  key={img.id}
                  className="group relative rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 shadow-sm hover:border-zinc-300 transition-all"
                >
                  <div 
                    onClick={() => setPreviewImage(img)}
                    className="aspect-video w-full overflow-hidden bg-zinc-900/5 cursor-pointer flex items-center justify-center relative"
                  >
                    <img
                      src={img.data}
                      alt={img.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="p-2 rounded-xl bg-white text-black font-semibold text-xs flex items-center gap-1 shadow-lg">
                        <Maximize2 className="w-3.5 h-3.5" /> Enlarge
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white flex items-center justify-between border-t border-zinc-100">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-zinc-900 truncate" title={img.name}>
                        {img.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {formatFileSize(img.size)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenInNewTab(img)}
                        className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                        title="Open Image in New Tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadAttachment(img)}
                        className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                        title="Download Image"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PDF & Document Attachments */}
        {fileAttachments.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              PDF Documents &amp; Reference Files ({fileAttachments.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fileAttachments.map((doc) => {
                const isPdf = doc.type === 'application/pdf' || doc.name?.toLowerCase().endsWith('.pdf');
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-sm hover:border-zinc-300 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                        {isPdf ? (
                          <FileText className="w-5 h-5 text-rose-600" />
                        ) : (
                          <Paperclip className="w-5 h-5 text-zinc-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 truncate" title={doc.name}>
                          {doc.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          {formatFileSize(doc.size)} • {isPdf ? 'PDF Document' : 'Attachment'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenInNewTab(doc)}
                        className="text-xs h-8 px-2.5"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        <span>Open</span>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownloadAttachment(doc)}
                        className="text-xs h-8 px-2.5"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags Section */}
        {note.tags && note.tags.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Attached Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <Modal
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          title={previewImage.name}
          description={`${formatFileSize(previewImage.size)} • High-Resolution Attachment`}
          maxWidth="max-w-5xl"
        >
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 max-h-[75vh] flex items-center justify-center">
              <img
                src={previewImage.data}
                alt={previewImage.name}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenInNewTab(previewImage)}
                >
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  <span>Open in New Tab</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadAttachment(previewImage)}
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  <span>Download</span>
                </Button>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => setPreviewImage(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
