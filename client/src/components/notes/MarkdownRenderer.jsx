import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  Bot, 
  Globe, 
  FileText, 
  Paperclip, 
  Video, 
  Code2, 
  Maximize2,
  Download
} from 'lucide-react';
import { openAttachmentInNewTab } from '../../utils/fileHelper';

const detectLinkType = (url = '', text = '') => {
  const lowerUrl = url.toLowerCase();
  const lowerText = text.toLowerCase();

  if (lowerUrl.includes('chatgpt.com') || lowerUrl.includes('openai.com') || lowerUrl.includes('claude.ai') || lowerText.includes('chatgpt')) {
    return { type: 'ai', name: 'ChatGPT Conversation', icon: Bot, color: 'emerald' };
  }
  if (lowerUrl.includes('github.com') || lowerText.includes('github')) {
    return { type: 'github', name: 'GitHub Repository', icon: Code2, color: 'zinc' };
  }
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerText.includes('youtube') || lowerText.includes('lecture')) {
    return { type: 'video', name: 'Video Resource', icon: Video, color: 'rose' };
  }
  if (lowerUrl.startsWith('data:application/pdf') || lowerUrl.endsWith('.pdf') || lowerText.includes('.pdf') || lowerText.includes('pdf')) {
    return { type: 'pdf', name: 'PDF Document', icon: FileText, color: 'rose' };
  }
  return { type: 'web', name: 'Web Link', icon: Globe, color: 'zinc' };
};

const extractPlainText = (node) => {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractPlainText).join('');
  if (node.props && node.props.children) return extractPlainText(node.props.children);
  return '';
};

export const MarkdownRenderer = ({ content, attachments = [], className = '' }) => {
  const [copiedLink, setCopiedLink] = useState(null);

  const resolveAttachment = (url) => {
    if (!url) return { url: '', isAttachment: false, attachment: null };
    if (url.startsWith('attachment:')) {
      const attIdOrName = decodeURIComponent(url.replace(/^attachment:/, '').trim());
      const match = (attachments || []).find(
        (a) => a.id === attIdOrName || 
               a.name === attIdOrName || 
               (a.id && String(a.id).toLowerCase() === attIdOrName.toLowerCase()) ||
               (a.name && String(a.name).toLowerCase() === attIdOrName.toLowerCase())
      );
      if (match) {
        return { url: match.data, isAttachment: true, attachment: match };
      }
      const partialMatch = (attachments || []).find(
        (a) => a.name && (a.name.includes(attIdOrName) || attIdOrName.includes(a.name))
      );
      if (partialMatch) {
        return { url: partialMatch.data, isAttachment: true, attachment: partialMatch };
      }
      return { url, isAttachment: true, attachment: null };
    }
    return { url, isAttachment: false, attachment: null };
  };

  const handleCopy = (url, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (!content || !content.trim()) {
    return null;
  }

  return (
    <div className={`prose-notex space-y-4 text-zinc-900 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom Blockquote Renderer: if blockquote contains a link, render as a rich Interactive Link Block Card!
          blockquote({ node, children, ...props }) {
            return (
              <blockquote 
                className="my-3 border-l-2 border-zinc-900 bg-zinc-50/90 pl-4 py-2 pr-3 rounded-r-2xl text-zinc-800 text-sm shadow-2xs"
                {...props}
              >
                {children}
              </blockquote>
            );
          },

          // Custom Link Component: converts markdown links into interactive link blocks or clean inline links
          a({ href, children, ...props }) {
            const rawHref = href || '';
            const { url: linkUrl, isAttachment, attachment } = resolveAttachment(rawHref);
            const linkText = extractPlainText(children) || linkUrl;
            const info = detectLinkType(linkUrl, linkText);
            const isCopied = copiedLink === linkUrl;
            const isBlockLike = linkText.includes('🔗') || linkText.includes('📄') || linkText.length > 25 || isAttachment;
            const cleanText = linkText.replace(/^[🔗📄📎\s]+/, '').trim() || attachment?.name || info.name;

            // If link is styled as a block link (contains link emoji or is standalone block)
            if (isBlockLike || info.type === 'ai' || isAttachment) {
              const isAi = info.type === 'ai';
              const isPdf = isAttachment || info.type === 'pdf' || linkUrl.startsWith('data:application/pdf') || linkUrl.endsWith('.pdf');

              const handleOpen = (e) => {
                if (e) e.preventDefault();
                openAttachmentInNewTab(linkUrl, cleanText, attachment?.type);
              };

              return (
                <span className={`block my-2.5 not-prose rounded-2xl border transition-all ${
                  isAi 
                    ? 'bg-emerald-50/90 border-emerald-200 hover:border-emerald-300' 
                    : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                }`}>
                  <span className="flex items-center justify-between p-3 gap-3">
                    <span 
                      onClick={handleOpen}
                      className="flex items-center gap-2.5 min-w-0 pr-1 cursor-pointer group/card"
                    >
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isAi 
                          ? 'bg-emerald-600 text-white shadow-2xs' 
                          : isPdf
                          ? 'bg-rose-600 text-white'
                          : 'bg-zinc-900 text-white'
                      }`}>
                        {isAi ? (
                          <info.icon className="w-4 h-4" />
                        ) : isPdf ? (
                          <FileText className="w-4 h-4" />
                        ) : (
                          <info.icon className="w-4 h-4" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-zinc-950 group-hover/card:text-black truncate">
                          {cleanText}
                        </span>
                        <span className={`block text-[11px] font-mono truncate ${
                          isAi ? 'text-emerald-700' : 'text-zinc-500'
                        }`}>
                          {linkUrl.startsWith('data:') ? 'Attached Vault Document (Click to Open in New Tab)' : linkUrl}
                        </span>
                      </span>
                    </span>

                    <span className="flex items-center gap-1.5 shrink-0">
                      {!linkUrl.startsWith('data:') && !linkUrl.startsWith('attachment:') && (
                        <button
                          type="button"
                          onClick={(e) => handleCopy(linkUrl, e)}
                          className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-200/70 rounded-lg transition-colors cursor-pointer"
                          title="Copy Link"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleOpen}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${
                          isAi 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                            : 'bg-zinc-900 hover:bg-black text-white'
                        }`}
                        title="Open in new tab"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </span>
                  </span>
                </span>
              );
            }

            // Standard Inline Link
            return (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (linkUrl.startsWith('data:') || linkUrl.startsWith('attachment:') || isAttachment) {
                    e.preventDefault();
                    openAttachmentInNewTab(linkUrl, cleanText, attachment?.type);
                  }
                }}
                className="inline-flex items-center gap-1 font-semibold text-zinc-900 underline underline-offset-4 decoration-zinc-400 hover:decoration-black hover:text-black transition-colors cursor-pointer"
                {...props}
              >
                <span>{children}</span>
                <ExternalLink className="w-3 h-3 text-zinc-400 inline shrink-0" />
              </a>
            );
          },

          // Custom Image Component: responsive inline image with 1-click open in new tab
          img({ src, alt, ...props }) {
            const cleanAlt = alt || 'Attached image';
            const { url: resolvedSrc, attachment } = resolveAttachment(src);

            const handleOpenImage = () => {
              openAttachmentInNewTab(resolvedSrc, cleanAlt, attachment?.type || 'image/png');
            };

            return (
              <span className="block my-3 not-prose">
                <span className="group relative block rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50 shadow-xs max-w-xl">
                  <img
                    src={resolvedSrc}
                    alt={cleanAlt}
                    onClick={handleOpenImage}
                    className="w-full max-h-96 object-contain bg-zinc-950/5 cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                    loading="lazy"
                    title="Click to open image in new tab"
                    {...props}
                  />
                  <span 
                    onClick={handleOpenImage}
                    className="absolute bottom-2 right-2 p-1.5 rounded-xl bg-black/75 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 cursor-pointer backdrop-blur-xs shadow-md"
                    title="Open full image in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold">Open in New Tab</span>
                  </span>
                  {cleanAlt && cleanAlt !== 'Attached image' && (
                    <span className="block px-3 py-1.5 text-[11px] text-zinc-500 font-medium border-t border-zinc-100 bg-white truncate">
                      {cleanAlt}
                    </span>
                  )}
                </span>
              </span>
            );
          },

            // Headings
            h1: ({ children }) => <h1 className="text-xl sm:text-2xl font-bold font-display text-zinc-950 mt-4 mb-2 tracking-tight">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg sm:text-xl font-bold font-display text-zinc-950 mt-3 mb-2 tracking-tight">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-semibold font-display text-zinc-950 mt-3 mb-1">{children}</h3>,
            
            // Paragraphs
            p: ({ children }) => <p className="text-sm sm:text-base text-zinc-800 leading-relaxed font-sans mb-3">{children}</p>,

            // Lists
            ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 text-sm sm:text-base text-zinc-800">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 text-sm sm:text-base text-zinc-800">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,

            // Code Blocks & Inline Code
            code({ inline, className, children, ...props }) {
              const codeString = String(children).replace(/\n$/, '');
              if (inline) {
                return (
                  <code className="px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-900 font-mono text-xs border border-zinc-200" {...props}>
                    {children}
                  </code>
                );
              }
              return (
                <div className="relative my-3 rounded-2xl overflow-hidden bg-zinc-950 text-zinc-100 border border-zinc-800 text-xs font-mono">
                  <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900 border-b border-zinc-800 text-[11px] text-zinc-400">
                    <span>Code Snippet</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(codeString);
                        setCopiedLink('code_' + codeString.slice(0, 10));
                        setTimeout(() => setCopiedLink(null), 2000);
                      }}
                      className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedLink === 'code_' + codeString.slice(0, 10) ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3.5 overflow-x-auto leading-relaxed">
                    <code>{codeString}</code>
                  </pre>
                </div>
              );
            },

            // Tables
            table: ({ children }) => (
              <div className="overflow-x-auto my-3 rounded-2xl border border-zinc-200 bg-white">
                <table className="w-full text-left text-xs border-collapse">{children}</table>
              </div>
            ),
            th: ({ children }) => <th className="p-2.5 bg-zinc-100 font-bold text-zinc-900 border-b border-zinc-200">{children}</th>,
            td: ({ children }) => <td className="p-2.5 border-b border-zinc-100 text-zinc-700">{children}</td>,
            hr: () => <hr className="my-4 border-zinc-200" />
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
  );
};
