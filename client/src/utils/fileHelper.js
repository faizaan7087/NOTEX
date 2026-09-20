import mammoth from 'mammoth';

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
 * Opens any attachment (Google Drive link, Base64 data URL, Blob URL, or HTTP link) in a new browser tab.
 * Handles images, PDFs, docx, docs, and other binary documents seamlessly without browser blocking.
 */
export const openAttachmentInNewTab = async (dataOrUrl, filename = 'document', mimeType = '') => {
  if (!dataOrUrl) return;

  // 1. Standard web / Google Drive URLs
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
    // Open a blank new tab SYNCHRONOUSLY within the user click event to prevent popup blockers from killing async window.open
    const win = window.open('', '_blank');
    if (win) {
      win.document.title = `Loading ${filename}...`;
      win.document.body.style.margin = '0';
      win.document.body.style.backgroundColor = '#09090b';
      win.document.body.style.color = '#ffffff';
      win.document.body.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      win.document.body.style.display = 'flex';
      win.document.body.style.alignItems = 'center';
      win.document.body.style.justifyContent = 'center';
      win.document.body.style.height = '100vh';
      win.document.body.innerHTML = `
        <div style="text-align: center;">
          <div style="width: 44px; height: 44px; border: 3px solid #27272a; border-top-color: #38bdf8; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem;"></div>
          <p style="font-weight: 700; font-size: 1.05rem; color: #fafafa;">Opening ${filename}...</p>
          <p style="font-size: 0.8125rem; color: #71717a; margin-top: 0.25rem;">NOTEX Study Vault</p>
          <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        </div>
      `;
    }

    try {
      const blob = dataUrlToBlob(dataOrUrl, filename, mimeType);
      if (!blob) {
        if (win) win.close();
        return;
      }

      const blobUrl = URL.createObjectURL(blob);
      const effectiveMime = blob.type;
      const lowerName = filename.toLowerCase();

      const isImage = effectiveMime.startsWith('image/') || lowerName.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i);
      const isPdf = effectiveMime === 'application/pdf' || lowerName.endsWith('.pdf');
      const isText = effectiveMime.startsWith('text/') || lowerName.match(/\.(txt|md|json|js|jsx|py|java|c|cpp|html|xml|csv)$/i);
      const isDocx = lowerName.endsWith('.docx') || effectiveMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      // For Images, PDFs, and Text files: navigate the opened window directly to blobUrl
      if (isPdf || isImage || isText) {
        if (win) {
          win.location.href = blobUrl;
        } else {
          const a = document.createElement('a');
          a.href = blobUrl;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        return;
      }

      // For Word DOCX files: parse with mammoth and generate an interactive HTML document viewer
      let docHtml = '';
      if (isDocx) {
        try {
          const buffer = await blob.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
          docHtml = result.value || '';
        } catch (docxErr) {
          console.warn('Mammoth docx preview parsing error:', docxErr);
        }
      }

      const escapedFilename = filename.replace(/"/g, '&quot;');

      const viewerPageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedFilename} — NOTEX Document Viewer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #09090b;
      --card: #18181b;
      --border: #27272a;
      --text: #fafafa;
      --muted: #a1a1aa;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background-color: #09090b;
      color: #fafafa;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(18, 18, 20, 0.9);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid #27272a;
      padding: 0.875rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
    }
    .file-icon {
      width: 38px;
      height: 38px;
      background: #27272a;
      border: 1px solid #3f3f46;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .file-info { min-width: 0; }
    .file-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #fafafa;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .file-subtitle {
      font-size: 0.75rem;
      color: #a1a1aa;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-shrink: 0;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
      font-weight: 600;
      border-radius: 0.625rem;
      text-decoration: none;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: #ffffff;
      color: #09090b;
    }
    .btn-primary:hover {
      background: #e4e4e7;
    }
    .btn-outline {
      background: #27272a;
      color: #fafafa;
      border-color: #3f3f46;
    }
    .btn-outline:hover {
      background: #3f3f46;
    }
    main {
      flex: 1;
      padding: 2.5rem 1.5rem 4rem;
      display: flex;
      justify-content: center;
    }
    .doc-container {
      width: 100%;
      max-width: 840px;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 1.25rem;
      padding: 3rem 3.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    }
    .doc-content {
      color: #e4e4e7;
      font-size: 1.0625rem;
      line-height: 1.8;
    }
    .doc-content h1, .doc-content h2, .doc-content h3, .doc-content h4 {
      color: #ffffff;
      font-weight: 700;
      margin-top: 2rem;
      margin-bottom: 0.75rem;
      letter-spacing: -0.01em;
    }
    .doc-content h1 { font-size: 1.625rem; }
    .doc-content h2 { font-size: 1.35rem; }
    .doc-content h3 { font-size: 1.15rem; }
    .doc-content p { margin-bottom: 1.25rem; }
    .doc-content ul, .doc-content ol { margin: 1rem 0 1.25rem 1.5rem; }
    .doc-content li { margin-bottom: 0.5rem; }
    .doc-content strong { color: #ffffff; font-weight: 700; }
    .doc-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.75rem 0;
      border: 1px solid #3f3f46;
      border-radius: 0.5rem;
      overflow: hidden;
    }
    .doc-content th, .doc-content td {
      border: 1px solid #3f3f46;
      padding: 0.75rem 1rem;
      text-align: left;
    }
    .doc-content th { background: #27272a; font-weight: 700; color: #fff; }
    .doc-empty-card {
      text-align: center;
      padding: 3.5rem 1.5rem;
    }
    @media (max-width: 640px) {
      .doc-container { padding: 1.5rem; }
      header { padding: 0.75rem 1rem; }
    }
    @media print {
      header { display: none !important; }
      body { background: white !important; color: black !important; }
      .doc-container { border: none !important; box-shadow: none !important; padding: 0 !important; background: white !important; max-width: 100% !important; }
      .doc-content, .doc-content h1, .doc-content h2, .doc-content h3, .doc-content strong { color: black !important; }
      .doc-content th { background: #eee !important; color: black !important; }
    }
  </style>
</head>
<body>
  <header>
    <div class="header-left">
      <div class="file-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      </div>
      <div class="file-info">
        <div class="file-title">${escapedFilename}</div>
        <div class="file-subtitle">NOTEX Study Document Viewer</div>
      </div>
    </div>
    <div class="header-actions">
      <button class="btn btn-outline" onclick="window.print()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        <span>Print</span>
      </button>
      <a href="${blobUrl}" download="${escapedFilename}" class="btn btn-primary">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        <span>Download (.docx)</span>
      </a>
    </div>
  </header>
  <main>
    <div class="doc-container">
      ${docHtml ? `<div class="doc-content">${docHtml}</div>` : `
        <div class="doc-empty-card">
          <div style="width: 56px; height: 56px; background: #27272a; border-radius: 1rem; margin: 0 auto 1.25rem; display: flex; align-items: center; justify-content: center; border: 1px solid #3f3f46;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: #fff;">${escapedFilename}</h2>
          <p style="color: #a1a1aa; font-size: 0.875rem; margin-bottom: 2rem;">Ready to download and open in your local document editor</p>
          <a href="${blobUrl}" download="${escapedFilename}" class="btn btn-primary" style="padding: 0.75rem 1.75rem; font-size: 0.9375rem; border-radius: 0.875rem;">
            <span>Download & Open</span>
          </a>
        </div>
      `}
    </div>
  </main>
</body>
</html>`;

      const viewerBlob = new Blob([viewerPageHtml], { type: 'text/html;charset=utf-8' });
      const viewerUrl = URL.createObjectURL(viewerBlob);

      if (win) {
        win.location.href = viewerUrl;
      } else {
        const a = document.createElement('a');
        a.href = viewerUrl;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Error opening attachment in new tab', err);
      if (win) {
        win.location.href = dataOrUrl;
      } else {
        const a = document.createElement('a');
        a.href = dataOrUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
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


