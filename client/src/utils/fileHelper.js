/**
 * Get correct MIME type based on filename extension and data URL prefix
 */
export const getMimeTypeFromFilename = (filename = '', fallbackMime = '') => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeMap = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    md: 'text/markdown',
    json: 'application/json',
    html: 'text/html',
    xml: 'application/xml',
    csv: 'text/csv'
  };

  if (ext && mimeMap[ext]) {
    return mimeMap[ext];
  }
  return fallbackMime || 'application/octet-stream';
};

/**
 * Converts a Base64 data URL into a Blob object with proper MIME type
 */
export const dataUrlToBlob = (dataUrl, filename = '', explicitMime = '') => {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null;

  const parts = dataUrl.split(',');
  const match = parts[0].match(/:(.*?);/);
  const detectedMime = explicitMime || (match ? match[1] : '') || getMimeTypeFromFilename(filename);
  
  const finalMime = (detectedMime && detectedMime !== 'application/octet-stream') 
    ? detectedMime 
    : getMimeTypeFromFilename(filename, detectedMime);

  const byteString = atob(parts[1] || '');
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  return new Blob([uint8Array], { type: finalMime });
};

/**
 * Opens any attachment (Base64 data URL, Blob URL, or HTTP link) in a new browser tab.
 * Handles images, PDFs, docx, docs, and other binary documents seamlessly without browser blocking.
 */
export const openAttachmentInNewTab = (dataOrUrl, filename = 'document', mimeType = '') => {
  if (!dataOrUrl) return;

  // 1. Standard web URLs
  if (dataOrUrl.startsWith('http://') || dataOrUrl.startsWith('https://')) {
    window.open(dataOrUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  // 2. Existing Blob URLs
  if (dataOrUrl.startsWith('blob:')) {
    window.open(dataOrUrl, '_blank');
    return;
  }

  // 3. Base64 Data URLs
  if (dataOrUrl.startsWith('data:')) {
    try {
      const blob = dataUrlToBlob(dataOrUrl, filename, mimeType);
      if (!blob) return;

      const blobUrl = URL.createObjectURL(blob);
      const effectiveMime = blob.type;

      const isImage = effectiveMime.startsWith('image/') || filename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i);
      const isPdf = effectiveMime === 'application/pdf' || filename.toLowerCase().endsWith('.pdf');
      const isText = effectiveMime.startsWith('text/') || filename.match(/\.(txt|md|json|js|jsx|py|java|c|cpp|html|xml|csv)$/i);

      // For Images, PDFs, and Text files, open natively in a new tab
      if (isPdf || isImage || isText) {
        const win = window.open(blobUrl, '_blank');
        if (!win) {
          // Fallback if browser popup blocker intervened
          const a = document.createElement('a');
          a.href = blobUrl;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        return;
      }

      // For Word Docs (.doc, .docx), Excel (.xlsx), PowerPoint (.pptx), etc.:
      // Open a clean dark-themed preview & download window in another tab
      const win = window.open('', '_blank');
      if (win) {
        win.document.title = `${filename} — NOTEX Document Viewer`;
        win.document.body.style.margin = '0';
        win.document.body.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        win.document.body.style.backgroundColor = '#09090b';
        win.document.body.style.color = '#ffffff';
        win.document.body.style.display = 'flex';
        win.document.body.style.alignItems = 'center';
        win.document.body.style.justifyContent = 'center';
        win.document.body.style.height = '100vh';

        win.document.body.innerHTML = `
          <div style="background: #18181b; padding: 2.5rem 2rem; border-radius: 1.5rem; border: 1px solid #27272a; text-align: center; max-width: 440px; width: 90%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
            <div style="width: 56px; height: 56px; background: #27272a; border-radius: 1rem; margin: 0 auto 1.25rem; display: flex; align-items: center; justify-content: center; border: 1px solid #3f3f46;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <h2 style="margin: 0 0 0.5rem; font-size: 1.125rem; font-weight: 700; color: #fafafa; word-break: break-all;">${filename}</h2>
            <p style="margin: 0 0 1.75rem; font-size: 0.8125rem; color: #a1a1aa;">Attached Study Document from your NOTEX Vault</p>
            <a href="${blobUrl}" download="${filename}" style="display: inline-flex; align-items: center; gap: 8px; background: #ffffff; color: #09090b; padding: 0.75rem 1.5rem; border-radius: 0.875rem; font-weight: 700; font-size: 0.875rem; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); cursor: pointer;">
              <span>Download &amp; Open Document</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </a>
          </div>
        `;
      } else {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Error opening attachment in new tab', err);
      const a = document.createElement('a');
      a.href = dataOrUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }
};

/**
 * Trigger immediate download for any data URL or Blob.
 */
export const downloadAttachment = (dataOrUrl, filename = 'download') => {
  if (!dataOrUrl) return;
  const a = document.createElement('a');
  a.href = dataOrUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

