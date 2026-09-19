const Note = require('../models/Note');
const { buildNotesXML } = require('../utils/xmlBuilder');

// @desc    Export all notes belonging to the authenticated user as XML
// @route   GET /api/xml/export or GET /api/notes/export/xml
// @access  Private
const exportNotesToXML = async (req, res) => {
  try {
    const { download, subject } = req.query;

    const query = { userId: req.user.id };
    if (subject && subject !== 'all') {
      query.subject = subject;
    }

    const notes = await Note.find(query);

    const xmlContent = buildNotesXML(notes, {
      user: req.user.name,
      exportedAt: new Date().toISOString()
    });

    // If query parameter download=true or default file download requested
    if (download === 'true') {
      const filename = `notex_export_${Date.now()}.xml`;
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(xmlContent);
    }

    // Otherwise send as structured JSON response containing the XML string + count + raw XML
    if (req.headers.accept && req.headers.accept.includes('application/xml')) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      return res.status(200).send(xmlContent);
    }

    return res.status(200).json({
      success: true,
      message: 'Notes XML generated successfully',
      count: notes.length,
      xml: xmlContent
    });
  } catch (error) {
    console.error('[XML Export Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while generating notes XML export.'
    });
  }
};

// @desc    Export a single note as XML
// @route   GET /api/xml/notes/:id
// @access  Private
const exportSingleNoteXML = async (req, res) => {
  try {
    const { download } = req.query;
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.'
      });
    }

    if (String(note.userId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this note.'
      });
    }

    const xmlContent = buildNotesXML(note, {
      user: req.user.name,
      exportedAt: new Date().toISOString()
    });

    if (download === 'true') {
      const safeTitle = note.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="note_${safeTitle}.xml"`);
      return res.status(200).send(xmlContent);
    }

    return res.status(200).json({
      success: true,
      noteId: note._id,
      xml: xmlContent
    });
  } catch (error) {
    console.error('[Single XML Export Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while exporting single note as XML.'
    });
  }
};

module.exports = {
  exportNotesToXML,
  exportSingleNoteXML
};
