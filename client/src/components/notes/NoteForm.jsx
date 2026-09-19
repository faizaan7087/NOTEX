import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import { xmlService } from '../../services/xmlService';
import { useToast } from '../../context/ToastContext';
import { 
  Save, 
  X, 
  Plus, 
  Tag as TagIcon, 
  Star, 
  Paperclip,
  FileText,
  FileCode2,
  Trash2,
  Eye,
  FileUp,
  Folder,
  FolderPlus,
  Check,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';

const SUGGESTED_SUBJECTS = [
  'DBMS',
  'Operating Systems',
  'Computer Networks',
  'Data Structures & Algorithms',
  'Machine Learning',
  'Artificial Intelligence',
  'Software Engineering',
  'Web Development',
  'Cyber Security',
  'Theory of Computation'
];

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const NoteForm = ({
  initialData = null,
  folders = [],
  onSave,
  onCancel,
  onRequestCreateFolder,
  loading = false
}) => {
  const isEditing = !!initialData?._id || !!initialData?.id;
  const toast = useToast();
  const fileInputRef = useRef(null);
  const xmlFileInputRef = useRef(null);
  const tagInputRef = useRef(null);
  const titleInputRef = useRef(null);

  const [title, setTitle] = useState(initialData?.title || '');
  const [subject, setSubject] = useState(initialData?.subject || '');
  const [folderId, setFolderId] = useState(initialData?.folderId || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [tags, setTags] = useState(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [isFavorite, setIsFavorite] = useState(initialData?.isFavorite || false);
  const [attachments, setAttachments] = useState(initialData?.attachments || []);
  
  // XML Import Modal State
  const [xmlModalOpen, setXmlModalOpen] = useState(false);
  const [xmlInputText, setXmlInputText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setSubject(initialData.subject || '');
      setFolderId(initialData.folderId || '');
      setContent(initialData.content || '');
      setTags(initialData.tags || []);
      setIsFavorite(initialData.isFavorite || false);
      setAttachments(initialData.attachments || []);
    } else {
      // Auto-focus title on new note
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [initialData]);

  // Keyboard shortcut for Cmd/Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, subject, folderId, content, tags, isFavorite, attachments]);

  // When selecting a folder, auto-populate subject if blank or generic
  const handleFolderChange = (e) => {
    const selectedFid = e.target.value;
    setFolderId(selectedFid);
    if (selectedFid) {
      const chosenFolder = folders.find(f => (f._id || f.id) === selectedFid);
      if (chosenFolder) {
        let rootName = chosenFolder.name;
        if (chosenFolder.parentId) {
          const parentF = folders.find(f => (f._id || f.id) === chosenFolder.parentId);
          if (parentF) rootName = parentF.name;
        }
        if (!subject || subject === 'General') {
          setSubject(rootName);
        }
      }
    }
  };

  const validate = () => {
    const errs = {};
    if (!title.trim()) {
      errs.title = 'Please enter a note title';
    }

    // Default subject if empty
    let finalSubject = subject.trim();
    if (!finalSubject) {
      if (folderId) {
        const f = folders.find(item => (item._id || item.id) === folderId);
        finalSubject = f ? f.name : 'General';
      } else {
        finalSubject = 'General';
      }
      setSubject(finalSubject);
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddTag = (e) => {
    if (e) e.preventDefault();
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDownTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Escape') {
      setShowTagInput(false);
    }
  };

  // --- Attachment Handling ---
  const processFiles = (files) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    fileList.forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 20MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const newAttachment = {
          id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          data: event.target.result,
          uploadedAt: new Date().toISOString()
        };

        setAttachments((prev) => [...prev, newAttachment]);
        toast.success(`Attached "${file.name}"`);
      };

      reader.onerror = () => {
        toast.error(`Failed to read "${file.name}".`);
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveAttachment = (attId) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  // --- XML Import Logic ---
  const handleXMLFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const xmlString = ev.target.result;
      setXmlInputText(xmlString);
      applyXMLNote(xmlString);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const applyXMLNote = (rawXml) => {
    const result = xmlService.parseNoteFromXML(rawXml || xmlInputText);
    if (!result.success) {
      toast.error(result.error || 'Failed to parse XML note.');
      return;
    }

    if (result.title) setTitle(result.title);
    if (result.subject) setSubject(result.subject);
    if (result.content) setContent(result.content);
    if (result.tags && result.tags.length > 0) {
      setTags((prev) => Array.from(new Set([...prev, ...result.tags])));
    }

    setErrors({});
    setXmlModalOpen(false);
    setXmlInputText('');
    toast.success('Note fields populated from XML!');
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    const finalSubject = subject.trim() || 'General';

    onSave({
      title: title.trim(),
      subject: finalSubject,
      folderId: folderId || null,
      content: content.trim(),
      tags,
      isFavorite,
      attachments
    });
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div 
      className="relative"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsDragging(false);
        }
      }}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Full Canvas Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 rounded-3xl bg-black/5 backdrop-blur-xs border-2 border-dashed border-black flex flex-col items-center justify-center p-6 pointer-events-none transition-all animate-in fade-in duration-150">
          <div className="p-4 rounded-2xl bg-white shadow-xl text-black flex flex-col items-center gap-2">
            <Paperclip className="w-8 h-8 animate-bounce" />
            <p className="text-sm font-bold">Drop files here to attach</p>
            <p className="text-xs text-zinc-500">Supports images, PDFs, and documents</p>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*,application/pdf,.doc,.docx,.txt"
        className="hidden"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-zinc-100">
          {/* Left: Folder Picker & Metadata Pill */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Folder Dropdown */}
            <div className="relative flex items-center">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/80 text-xs font-medium text-zinc-800 transition-colors">
                <Folder className="w-3.5 h-3.5 text-zinc-500" />
                <select
                  value={folderId || ''}
                  onChange={handleFolderChange}
                  className="bg-transparent border-none text-xs font-medium text-zinc-900 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="">📁 Root / All Notes</option>
                  {folders.map((f) => {
                    const isSub = !!f.parentId;
                    let displayName = f.name;
                    if (isSub) {
                      const parentF = folders.find(p => (p._id || p.id) === f.parentId);
                      displayName = `${parentF?.name || 'Folder'} / ${f.name}`;
                    }
                    return (
                      <option key={f._id || f.id} value={f._id || f.id}>
                        {isSub ? '   └── 📁 ' : '📁 '} {displayName}
                      </option>
                    );
                  })}
                </select>
              </div>

              {onRequestCreateFolder && (
                <button
                  type="button"
                  onClick={() => onRequestCreateFolder(folderId || null)}
                  className="ml-1 p-1.5 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors"
                  title="Create new folder"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Subject Selector / Input Pill */}
            <div className="relative">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/80 text-xs text-zinc-800 transition-colors">
                <TagIcon className="w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Subject (e.g. DBMS)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  onFocus={() => setShowSubjectMenu(true)}
                  className="bg-transparent border-none text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none w-28 sm:w-36"
                />
                <button
                  type="button"
                  onClick={() => setShowSubjectMenu(!showSubjectMenu)}
                  className="text-zinc-400 hover:text-zinc-700"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Quick Subject Dropdown */}
              {showSubjectMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setShowSubjectMenu(false)} 
                  />
                  <div className="absolute left-0 top-full mt-1.5 z-30 w-56 p-1.5 bg-white rounded-2xl border border-zinc-200 shadow-xl max-h-56 overflow-y-auto">
                    <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Suggested Subjects
                    </p>
                    {SUGGESTED_SUBJECTS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setSubject(s);
                          setShowSubjectMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 hover:text-black rounded-lg transition-colors flex items-center justify-between"
                      >
                        <span>{s}</span>
                        {subject.toLowerCase() === s.toLowerCase() && (
                          <Check className="w-3.5 h-3.5 text-black" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Quick Action: Attach File */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/80 text-xs font-medium text-zinc-700 hover:text-black transition-colors"
              title="Add PDF, image, or document"
            >
              <Paperclip className="w-3.5 h-3.5 text-zinc-500" />
              <span>Attach</span>
              {attachments.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-bold">
                  {attachments.length}
                </span>
              )}
            </button>

            {/* Quick Action: Add Tag */}
            {!showTagInput ? (
              <button
                type="button"
                onClick={() => {
                  setShowTagInput(true);
                  setTimeout(() => tagInputRef.current?.focus(), 50);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/80 text-xs font-medium text-zinc-600 hover:text-black transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Tag</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white border border-black shadow-xs">
                <span className="text-xs text-zinc-400">#</span>
                <input
                  ref={tagInputRef}
                  type="text"
                  placeholder="tag and Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDownTag}
                  onBlur={() => {
                    if (tagInput.trim()) handleAddTag();
                    else setShowTagInput(false);
                  }}
                  className="bg-transparent border-none text-xs text-zinc-900 focus:outline-none w-24"
                />
              </div>
            )}
          </div>

          {/* Right: Star, More Actions & Save Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Favorite / Star Button */}
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-xl transition-all ${
                isFavorite
                  ? 'bg-amber-50 text-amber-500 border border-amber-200 shadow-2xs'
                  : 'text-zinc-400 hover:text-black hover:bg-zinc-100'
              }`}
              title={isFavorite ? 'Starred Note' : 'Star Note'}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>

            {/* More Options Dropdown (XML Import) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2 rounded-xl text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors"
                title="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMoreMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setShowMoreMenu(false)} 
                  />
                  <div className="absolute right-0 top-full mt-1.5 z-30 w-48 p-1 bg-white rounded-2xl border border-zinc-200 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setXmlModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-black rounded-xl transition-colors flex items-center gap-2"
                    >
                      <FileCode2 className="w-4 h-4 text-zinc-500" />
                      <span>Import XML Note</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Save Button */}
            <Button
              type="submit"
              variant="default"
              loading={loading}
              className="shadow-sm px-4 py-1.5 text-xs font-semibold rounded-xl"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              <span>{isEditing ? 'Update' : 'Save'}</span>
            </Button>
          </div>
        </div>

        {/* Clean Title Field */}
        <div>
          <input
            ref={titleInputRef}
            type="text"
            placeholder="Note Title..."
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors({ ...errors, title: null });
            }}
            className="w-full bg-transparent border-none outline-none text-2xl sm:text-3xl font-bold font-display text-zinc-950 placeholder:text-zinc-300 focus:ring-0 px-0 py-1"
          />
          {errors.title && (
            <p className="text-xs text-rose-500 mt-1 font-medium">{errors.title}</p>
          )}
        </div>

        {/* Tags Row (Rendered if tags exist) */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-zinc-400 hover:text-black transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Clean Writing Canvas / Textarea */}
        <div className="relative">
          <textarea
            placeholder="Write your notes here... (Formulas, exam key points, lecture summaries, or code snippets)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
            className="w-full bg-transparent border-none outline-none text-base text-zinc-800 placeholder:text-zinc-300 focus:ring-0 px-0 py-2 leading-relaxed resize-y font-sans min-h-[300px]"
          />
        </div>

        {/* Attachments Preview Chips (Rendered if attachments exist) */}
        {attachments.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-zinc-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Attached Files ({attachments.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {attachments.map((att) => {
                const isImg = att.type?.startsWith('image/') || att.data?.startsWith('data:image/');
                const isPdf = att.type === 'application/pdf' || att.name?.toLowerCase().endsWith('.pdf');

                return (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      {isImg ? (
                        <div 
                          onClick={() => setPreviewMedia(att)}
                          className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={att.data}
                            alt={att.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-zinc-200 flex items-center justify-center shrink-0 text-zinc-700">
                          {isPdf ? (
                            <FileText className="w-5 h-5 text-rose-500" />
                          ) : (
                            <Paperclip className="w-4 h-4 text-zinc-600" />
                          )}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 truncate" title={att.name}>
                          {att.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          {formatFileSize(att.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {isImg && (
                        <button
                          type="button"
                          onClick={() => setPreviewMedia(att)}
                          className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-200 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete attachment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Footer Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 text-xs text-zinc-400">
          <div className="flex items-center gap-4">
            <span className="font-mono">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Auto-syncs to Google Drive</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={loading}
              className="text-xs text-zinc-500 hover:text-black"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              loading={loading}
              className="text-xs px-4"
            >
              {isEditing ? 'Update Note' : 'Save Note'}
            </Button>
          </div>
        </div>
      </form>

      {/* XML Import Modal */}
      <Modal
        isOpen={xmlModalOpen}
        onClose={() => setXmlModalOpen(false)}
        title="Import XML Note"
        description="Paste XML or choose a .xml file to auto-fill the note."
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-black text-white">
                <FileUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-900">Upload .xml file</p>
                <p className="text-[11px] text-zinc-500">Auto-fill title, subject, content & tags</p>
              </div>
            </div>
            <input
              type="file"
              ref={xmlFileInputRef}
              accept=".xml,application/xml,text/xml"
              onChange={handleXMLFileImport}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => xmlFileInputRef.current?.click()}
              className="text-xs"
            >
              Choose File
            </Button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Or Paste XML
            </label>
            <textarea
              rows={6}
              value={xmlInputText}
              onChange={(e) => setXmlInputText(e.target.value)}
              placeholder={'<note>\n  <title>Topic Title</title>\n  <subject>DBMS</subject>\n  <content>Notes...</content>\n</note>'}
              className="w-full rounded-2xl border border-zinc-300 bg-zinc-950 p-3 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setXmlModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => applyXMLNote(xmlInputText)}
              disabled={!xmlInputText.trim()}
            >
              Fill Form
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Preview Modal */}
      {previewMedia && (
        <Modal
          isOpen={!!previewMedia}
          onClose={() => setPreviewMedia(null)}
          title={previewMedia.name}
          description={`${formatFileSize(previewMedia.size)} • Attachment`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 max-h-[70vh] flex items-center justify-center">
              <img
                src={previewMedia.data}
                alt={previewMedia.name}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMedia(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
