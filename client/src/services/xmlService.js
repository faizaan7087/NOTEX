/**
 * XML Service for client-side processing, formatting, and file downloading
 */

export const xmlService = {
  /**
   * Triggers a browser download of an XML string as a file
   */
  downloadXMLFile(xmlString, filename = 'notex_notes_export.xml') {
    const blob = new Blob([xmlString], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Formats raw XML into HTML with syntax coloring classes
   */
  highlightXML(xml) {
    if (!xml) return '';
    
    // Simple & robust syntax highlighter for display in modal
    let formatted = xml
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Color XML tags: &lt;tag&gt; or &lt;/tag&gt; or &lt;?xml...?&gt;
    formatted = formatted.replace(
      /(&lt;\/?[\w:-]+)(.*?)(\/?&gt;)/g,
      (match, openTag, attributes, closeTag) => {
        // Color attributes inside tag
        const coloredAttrs = attributes.replace(
          /([\w:-]+)=(&quot;.*?&quot;|'.*?')/g,
          '<span class="text-amber-400">$1</span>=<span class="text-emerald-300">$2</span>'
        );
        return `<span class="text-cyan-400 font-medium">${openTag}</span>${coloredAttrs}<span class="text-cyan-400 font-medium">${closeTag}</span>`;
      }
    );

    // Color XML comments
    formatted = formatted.replace(
      /(&lt;!--.*?--&gt;)/g,
      '<span class="text-slate-500 italic">$1</span>'
    );

    return formatted;
  },

  /**
   * Parses an XML string and extracts note properties (title, subject, content, tags)
   */
  parseNoteFromXML(xmlString) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      
      const parserError = xmlDoc.getElementsByTagName('parsererror');
      if (parserError.length > 0) {
        throw new Error('Invalid XML structure');
      }

      const noteNode = xmlDoc.getElementsByTagName('note')[0] || xmlDoc.documentElement;
      
      const getTagVal = (tag) => {
        const el = noteNode.getElementsByTagName(tag)[0];
        return el ? el.textContent.trim() : '';
      };

      const title = getTagVal('title');
      const subject = getTagVal('subject');
      const content = getTagVal('content');
      
      const tagEls = noteNode.getElementsByTagName('tag');
      const tags = [];
      for (let i = 0; i < tagEls.length; i++) {
        const t = tagEls[i].textContent.trim();
        if (t) tags.push(t);
      }

      return {
        success: true,
        title,
        subject,
        content,
        tags
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Failed to parse XML content.'
      };
    }
  }
};
