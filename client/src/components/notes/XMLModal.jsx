import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { api } from '../../services/api';
import { xmlService } from '../../services/xmlService';
import { useToast } from '../../context/ToastContext';
import { 
  FileCode2, 
  Download, 
  Copy, 
  Check, 
  Code2
} from 'lucide-react';

export const XMLModal = ({
  isOpen,
  onClose,
  targetNote = null,
  subjects = []
}) => {
  const toast = useToast();
  const [xmlData, setXmlData] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filterSubject, setFilterSubject] = useState('all');

  useEffect(() => {
    if (isOpen) {
      fetchXML();
    }
  }, [isOpen, targetNote, filterSubject]);

  const fetchXML = async () => {
    setLoading(true);
    try {
      if (targetNote) {
        const noteId = targetNote._id || targetNote.id;
        const res = await api.exportSingleNoteXML(noteId);
        setXmlData(res.xml || res);
      } else {
        const res = await api.exportNotesXML(filterSubject);
        setXmlData(res.xml || res);
      }
    } catch (err) {
      console.error('[XML Fetch Error]:', err);
      toast.error('Failed to generate XML from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!xmlData) return;
    navigator.clipboard.writeText(xmlData);
    setCopied(true);
    toast.success('XML data copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!xmlData) return;
    const filename = targetNote
      ? `notex_${targetNote.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}.xml`
      : `notex_notes_${filterSubject !== 'all' ? filterSubject.toLowerCase() + '_' : ''}export.xml`;
    xmlService.downloadXMLFile(xmlData, filename);
    toast.success(`Downloaded ${filename}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="XML Export & Data Interchange"
      description="Syllabus Module 1 & 9: Web applications using CSS, XML, JavaScript & REST API"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-black text-white shadow-sm">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900">
                {targetNote ? `Single Note XML: "${targetNote.title}"` : 'Complete Notes Repository XML'}
              </p>
              <p className="text-[11px] text-zinc-500 font-mono">
                Endpoint: {targetNote ? `/api/notes/${targetNote._id || targetNote.id}/xml` : `/api/notes/export/xml`}
              </p>
            </div>
          </div>

          {!targetNote && subjects.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-600">Subject:</span>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="h-8 text-xs font-medium bg-white border border-zinc-300 rounded-lg text-zinc-900 px-2 focus:outline-none focus:border-black shadow-sm"
              >
                <option value="all">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} ({s.count})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* XML Code Container */}
        <div className="relative rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 inline-block" />
              <span className="font-mono text-[11px] text-zinc-300 ml-2">notex_export.xml</span>
            </div>
            <span className="text-[10px] text-zinc-200 font-mono bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              application/xml
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-zinc-400 font-mono text-xs">
              <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-3" />
              Generating structured XML from database...
            </div>
          ) : (
            <pre className="p-4 text-xs font-mono text-zinc-100 overflow-x-auto max-h-96 leading-relaxed select-text">
              <code
                dangerouslySetInnerHTML={{
                  __html: xmlService.highlightXML(xmlData) || 'No XML generated yet.'
                }}
              />
            </pre>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-zinc-500">
            Exported data is compliant with standard W3C XML specifications.
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={loading || !xmlData}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy XML</span>
                </>
              )}
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleDownload}
              disabled={loading || !xmlData}
              className="shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download .XML</span>
            </Button>
          </div>
        </div>

      </div>
    </Modal>
  );
};
