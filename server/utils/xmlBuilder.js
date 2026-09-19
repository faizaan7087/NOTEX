/**
 * Escapes XML special characters for safe inclusion in XML nodes
 */
const escapeXml = (unsafe) => {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Builds standard XML string for a single note or an array of notes
 * @param {Array|Object} notes 
 * @param {Object} metadata Optional metadata (user name, exportedAt)
 * @returns {String} formatted XML
 */
const buildNotesXML = (notes, metadata = {}) => {
  const notesArray = Array.isArray(notes) ? notes : [notes];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<notes';
  if (metadata.user) {
    xml += ` user="${escapeXml(metadata.user)}"`;
  }
  if (metadata.exportedAt) {
    xml += ` exportedAt="${escapeXml(metadata.exportedAt)}"`;
  }
  xml += ` total="${notesArray.length}">\n`;

  notesArray.forEach((note) => {
    xml += '    <note>\n';
    xml += `        <id>${escapeXml(note._id || note.id)}</id>\n`;
    xml += `        <title>${escapeXml(note.title)}</title>\n`;
    xml += `        <subject>${escapeXml(note.subject)}</subject>\n`;
    xml += `        <content>${escapeXml(note.content)}</content>\n`;
    
    xml += '        <tags>\n';
    if (note.tags && Array.isArray(note.tags)) {
      note.tags.forEach((tag) => {
        xml += `            <tag>${escapeXml(tag)}</tag>\n`;
      });
    }
    xml += '        </tags>\n';

    if (note.attachments && Array.isArray(note.attachments) && note.attachments.length > 0) {
      xml += '        <attachments>\n';
      note.attachments.forEach((att) => {
        xml += `            <attachment name="${escapeXml(att.name)}" type="${escapeXml(att.type)}" size="${att.size || 0}" />\n`;
      });
      xml += '        </attachments>\n';
    }

    if (note.createdAt) {
      xml += `        <createdAt>${escapeXml(new Date(note.createdAt).toISOString())}</createdAt>\n`;
    }
    if (note.updatedAt) {
      xml += `        <updatedAt>${escapeXml(new Date(note.updatedAt).toISOString())}</updatedAt>\n`;
    }

    xml += '    </note>\n';
  });

  xml += '</notes>\n';
  return xml;
};

module.exports = {
  buildNotesXML,
  escapeXml
};
