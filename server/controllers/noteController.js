const Note = require('../models/Note');

// @desc    Get all notes for authenticated user (with search and filters)
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res) => {
  try {
    const { search, subject, tag, favorite, sort, folderId } = req.query;

    const query = {
      userId: req.user.id
    };

    if (folderId !== undefined) {
      query.folderId = folderId === 'null' || folderId === '' ? null : folderId;
    }

    if (subject && subject !== 'all') {
      query.subject = subject;
    }

    if (tag) {
      query.tag = tag;
    }

    if (favorite === 'true') {
      query.isFavorite = true;
    }

    if (search && search.trim() !== '') {
      query.search = search.trim();
    }

    let sortOption = { updatedAt: -1 };
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'title_asc') {
      sortOption = { title: 1 };
    } else if (sort === 'title_desc') {
      sortOption = { title: -1 };
    }

    const notes = await Note.find(query, sortOption);

    return res.status(200).json({
      success: true,
      count: notes.length,
      notes: notes
    });
  } catch (error) {
    console.error('[GetNotes Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching notes.'
    });
  }
};

// @desc    Get single note by ID
// @route   GET /api/notes/:id
// @access  Private
const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.'
      });
    }

    // Ensure the note belongs to the logged-in user
    if (String(note.userId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access. You cannot view notes belonging to other users.'
      });
    }

    return res.status(200).json({
      success: true,
      note: note
    });
  } catch (error) {
    console.error('[GetNoteById Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching note details.'
    });
  }
};

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
  try {
    const { title, subject, content, tags, color, isFavorite, attachments, folderId } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a note title.'
      });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a subject / course name.'
      });
    }

    // Process tags
    let processedTags = [];
    if (Array.isArray(tags)) {
      processedTags = tags.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof tags === 'string') {
      processedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    const note = await Note.create({
      userId: req.user.id,
      folderId: folderId || null,
      title: title.trim(),
      subject: subject.trim(),
      content: content ? content.trim() : '',
      tags: processedTags,
      color: color || 'indigo',
      isFavorite: Boolean(isFavorite),
      attachments: Array.isArray(attachments) ? attachments : []
    });

    // Auto-sync note file to student's Google Drive NOTEX_Vault if connected
    try {
      const User = require('../models/User');
      const Folder = require('../models/Folder');
      const googleDriveService = require('../services/googleDriveService');
      const user = await User.findById(req.user.id);
      if (user && (user.googleAccessToken || user.googleRefreshToken)) {
        const folder = note.folderId ? await Folder.findById(note.folderId) : null;
        googleDriveService.syncNoteToDrive(user, note, folder).catch(err => {
          console.warn('[Google Drive Note Auto-Sync Info]:', err.message);
        });
      }
    } catch (driveSyncErr) {
      console.warn('[Google Drive Sync Dispatch Info]:', driveSyncErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Note created successfully!',
      note: note
    });
  } catch (error) {
    console.error('[CreateNote Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating note.'
    });
  }
};

// @desc    Update existing note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res) => {
  try {
    const { title, subject, content, tags, color, isFavorite, attachments, folderId } = req.body;

    let note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.'
      });
    }

    // Security check: note must belong to the user
    if (String(note.userId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized action. You cannot modify another user’s note.'
      });
    }

    // Process tags if provided
    let processedTags = undefined;
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        processedTags = tags.map(t => String(t).trim()).filter(Boolean);
      } else if (typeof tags === 'string') {
        processedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (subject !== undefined) updateData.subject = subject.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (processedTags !== undefined) updateData.tags = processedTags;
    if (color !== undefined) updateData.color = color;
    if (isFavorite !== undefined) updateData.isFavorite = Boolean(isFavorite);
    if (attachments !== undefined) updateData.attachments = Array.isArray(attachments) ? attachments : [];
    if (folderId !== undefined) updateData.folderId = folderId || null;

    const updatedNote = await Note.findByIdAndUpdate(req.params.id, updateData, { new: true });

    // Auto-sync updated note file to Google Drive NOTEX_Vault if connected
    try {
      const User = require('../models/User');
      const Folder = require('../models/Folder');
      const googleDriveService = require('../services/googleDriveService');
      const user = await User.findById(req.user.id);
      if (user && (user.googleAccessToken || user.googleRefreshToken)) {
        const folder = updatedNote.folderId ? await Folder.findById(updatedNote.folderId) : null;
        googleDriveService.syncNoteToDrive(user, updatedNote, folder).catch(err => {
          console.warn('[Google Drive Note Update Auto-Sync Info]:', err.message);
        });
      }
    } catch (driveSyncErr) {
      console.warn('[Google Drive Sync Dispatch Info]:', driveSyncErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Note updated successfully!',
      note: updatedNote
    });
  } catch (error) {
    console.error('[UpdateNote Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating note.'
    });
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.'
      });
    }

    // Security check
    if (String(note.userId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized action. You cannot delete another user’s note.'
      });
    }

    // Auto-delete note file from Google Drive NOTEX_Vault if connected
    try {
      const User = require('../models/User');
      const Folder = require('../models/Folder');
      const googleDriveService = require('../services/googleDriveService');
      const user = await User.findById(req.user.id);
      if (user && (user.googleAccessToken || user.googleRefreshToken)) {
        const folder = note.folderId ? await Folder.findById(note.folderId) : null;
        googleDriveService.deleteDriveNote(user, note, folder).catch(err => {
          console.warn('[Google Drive Note Auto-Delete Warning]:', err.message);
        });
      }
    } catch (driveDelErr) {
      console.warn('[Google Drive Note Delete Dispatch Info]:', driveDelErr.message);
    }

    await Note.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Note deleted successfully and removed from Google Drive!',
      deletedId: req.params.id
    });
  } catch (error) {
    console.error('[DeleteNote Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting note.'
    });
  }
};

// @desc    Get dashboard statistics for authenticated user
// @route   GET /api/notes/stats/summary
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userNotes = await Note.find({ userId: req.user.id });

    const totalNotes = userNotes.length;
    
    // Extract unique subjects
    const subjectsMap = {};
    const tagsSet = new Set();
    let favoritesCount = 0;

    userNotes.forEach(note => {
      if (note.subject) {
        subjectsMap[note.subject] = (subjectsMap[note.subject] || 0) + 1;
      }
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tag => tagsSet.add(tag));
      }
      if (note.isFavorite) {
        favoritesCount++;
      }
    });

    const subjectsList = Object.keys(subjectsMap).map(name => ({
      name,
      count: subjectsMap[name]
    }));

    // Sort recent 5 notes
    const recentNotes = [...userNotes]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      stats: {
        totalNotes,
        totalSubjects: subjectsList.length,
        totalTags: tagsSet.size,
        favoritesCount,
        subjects: subjectsList,
        recentNotes: recentNotes
      }
    });
  } catch (error) {
    console.error('[GetStats Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while calculating dashboard statistics.'
    });
  }
};

// @desc    Get all distinct subjects for the user
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res) => {
  try {
    const userNotes = await Note.find({ userId: req.user.id });
    const subjectsMap = {};

    userNotes.forEach(note => {
      if (note.subject) {
        subjectsMap[note.subject] = (subjectsMap[note.subject] || 0) + 1;
      }
    });

    const subjects = Object.keys(subjectsMap).map(subject => ({
      name: subject,
      count: subjectsMap[subject]
    }));

    return res.status(200).json({
      success: true,
      subjects: subjects
    });
  } catch (error) {
    console.error('[GetSubjects Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching subjects.'
    });
  }
};

// @desc    Sync all notes and folders for the user to their Google Drive NOTEX_Vault
// @route   POST /api/notes/sync-drive
// @access  Private
const syncAllNotesToDrive = async (req, res) => {
  try {
    const User = require('../models/User');
    const Folder = require('../models/Folder');
    const googleDriveService = require('../services/googleDriveService');

    const user = await User.findById(req.user.id);
    if (!user || (!user.googleAccessToken && !user.googleRefreshToken)) {
      return res.status(400).json({
        success: false,
        message: 'Google Drive is not connected for this account. Please sign in with Google to enable Drive vault synchronization.'
      });
    }

    const notes = await Note.find({ userId: req.user.id });
    const folders = await Folder.find({ userId: req.user.id });

    const authClient = googleDriveService.createOAuth2Client(user.googleAccessToken, user.googleRefreshToken);
    const vaultId = await googleDriveService.getOrCreateNotexVault(authClient);
    await User.findByIdAndUpdate(user._id || user.id, { driveRootFolderId: vaultId });

    // Map folder id to drive folder id
    const folderIdMap = {};
    for (const f of folders) {
      const parentDriveId = f.parentId && folderIdMap[f.parentId] ? folderIdMap[f.parentId] : vaultId;
      const createdDriveFolderId = await googleDriveService.getOrCreateSubfolder(authClient, parentDriveId, f.name);
      folderIdMap[f._id || f.id] = createdDriveFolderId;
    }

    // Sync all notes
    let syncedCount = 0;
    for (const n of notes) {
      const targetFolderId = n.folderId && folderIdMap[n.folderId] ? folderIdMap[n.folderId] : vaultId;
      await googleDriveService.saveDriveNote(authClient, targetFolderId, n);
      syncedCount++;
    }

    return res.status(200).json({
      success: true,
      message: `Successfully synchronized ${syncedCount} notes and ${folders.length} folders to Google Drive NOTEX_Vault!`,
      vaultId,
      syncedNotes: syncedCount,
      syncedFolders: folders.length,
      driveUrl: `https://drive.google.com/drive/folders/${vaultId}`
    });
  } catch (error) {
    console.error('[SyncToDrive Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to synchronize notes to Google Drive.'
    });
  }
};

module.exports = {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  getDashboardStats,
  getSubjects,
  syncAllNotesToDrive
};
