import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { xmlService } from '../services/xmlService';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/button';
import { 
  FileCode2, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  CheckCircle2, 
  Code2, 
  Layers,
  ArrowRight
} from 'lucide-react';

export const XMLDemoPage = ({ subjects = [], onNavigate }) => {
  const toast = useToast();
  const [xmlData, setXmlData] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filterSubject, setFilterSubject] = useState('all');
  const [totalCount, setTotalCount] = useState(0);

  const fetchXML = async () => {
    setLoading(true);
    try {
      const res = await api.exportNotesXML(filterSubject);
      setXmlData(res.xml || res);
      setTotalCount(res.count || 0);
    } catch (err) {
      console.error('[XML Page Fetch Error]:', err);
      toast.error('Failed to generate XML from REST endpoint.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchXML();
  }, [filterSubject]);

  const handleCopy = () => {
    if (!xmlData) return;
    navigator.clipboard.writeText(xmlData);
    setCopied(true);
    toast.success('XML data copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!xmlData) return;
    const filename = `notex_notes_${filterSubject !== 'all' ? filterSubject.toLowerCase() + '_' : ''}export.xml`;
    xmlService.downloadXMLFile(xmlData, filename);
    toast.success(`Exported ${filename}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-900 text-xs font-semibold">
              <Code2 className="w-3.5 h-3.5 text-zinc-900" />
              <span>Syllabus Module 1 &amp; 9 Demonstration</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-950 font-display tracking-tight">
              XML Data Interchange &amp; Export
            </h1>
            <p className="text-sm text-zinc-500 max-w-2xl leading-relaxed">
              Demonstrating full XML integration in a web application. All academic notes are dynamically transformed from the database into standard W3C-compliant XML using Express REST APIs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="default"
              onClick={fetchXML}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh XML</span>
            </Button>

            <Button
              variant="default"
              size="default"
              onClick={handleDownload}
              disabled={loading || !xmlData}
              className="font-semibold shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download .XML File</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Practical Syllabus Requirements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-zinc-950 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>1. XML Tree Hierarchy</span>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Root <code>&lt;notes&gt;</code> element encapsulating individual <code>&lt;note&gt;</code> nodes, <code>&lt;title&gt;</code>, <code>&lt;subject&gt;</code>, and <code>&lt;tags&gt;</code>.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-zinc-950 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>2. REST API Integration</span>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Served via dedicated backend endpoint <code>GET /api/notes/export/xml</code> with <code>application/xml</code> Content-Type.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-zinc-950 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>3. Cross-Device Portability</span>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Downloadable as standard XML files for easy import into desktop readers, other tools, or archiving.
          </p>
        </div>
      </div>

      {/* Live XML Viewer */}
      <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        
        {/* Top Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-zinc-200 bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-zinc-200 text-xs font-mono text-zinc-900 shadow-sm">
              <FileCode2 className="w-4 h-4 text-black" />
              <span>notex_export.xml</span>
            </div>
            <span className="text-xs text-zinc-500">
              ({totalCount} {totalCount === 1 ? 'note' : 'notes'} formatted)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {subjects.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-600">Filter Subject:</span>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="h-9 text-xs font-medium bg-white border border-zinc-300 rounded-xl text-zinc-900 px-3 focus:outline-none focus:border-black shadow-sm"
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
          </div>
        </div>

        {/* XML Raw Code Block (Clean dark editor box for contrast) */}
        <div className="relative bg-zinc-950 p-6 overflow-x-auto max-h-[500px]">
          {loading ? (
            <div className="p-16 text-center text-zinc-400 font-mono text-xs">
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-3" />
              Generating structured XML from database...
            </div>
          ) : (
            <pre className="text-xs font-mono text-zinc-100 leading-relaxed select-text">
              <code
                dangerouslySetInnerHTML={{
                  __html: xmlService.highlightXML(xmlData) || 'No XML generated yet.'
                }}
              />
            </pre>
          )}
        </div>

        {/* Footer info inside card */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <span>W3C Compliant XML 1.0 Document</span>
          <button
            onClick={() => onNavigate('notes')}
            className="text-black hover:text-zinc-700 inline-flex items-center gap-1 font-semibold transition-colors"
          >
            <span>Back to Notes Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
