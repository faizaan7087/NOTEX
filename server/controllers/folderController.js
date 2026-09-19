const Folder = require('../models/Folder');
const Note = require('../models/Note');

// @desc    Get all folders for authenticated user with counts
// @route   GET /api/folders
// @access  Private
const getFolders = async (req, res) => {
  try {
    const folders = await Folder.find({ userId: req.user.id });
    const notes = await Note.find({ userId: req.user.id });

    // Calculate notes and subfolders count for each folder
    const foldersWithCounts = folders.map(folder => {
      const folderObj = folder.toJSON ? folder.toJSON() : folder;
      const folderId = folderObj._id || folderObj.id;

      const noteCount = notes.filter(n => n.folderId === folderId).length;
      const subfolderCount = folders.filter(f => {
        const fObj = f.toJSON ? f.toJSON() : f;
        return fObj.parentId === folderId;
      }).length;

      return {
        ...folderObj,
        noteCount,
        subfolderCount
      };
    });

    return res.status(200).json({
      success: true,
      count: foldersWithCounts.length,
      folders: foldersWithCounts
    });
  } catch (error) {
    console.error('[GetFolders Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching folders.'
    });
  }
};

// @desc    Create a new folder or subfolder
// @route   POST /api/folders
// @access  Private
const createFolder = async (req, res) => {
  try {
    const { name, parentId, color, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a folder name.'
      });
    }

    // If parentId is specified, verify that parent folder exists and belongs to user
    if (parentId) {
      const parent = await Folder.findById(parentId);
      if (!parent || String(parent.userId) !== String(req.user.id)) {
        return res.status(400).json({
          success: false,
          message: 'Parent folder does not exist or unauthorized.'
        });
      }
    }

    const folder = await Folder.create({
      userId: req.user.id,
      name: name.trim(),
      parentId: parentId || null,
      color: color || 'indigo',
      icon: icon || 'Folder'
    });

    // Auto-sync new folder to Google Drive NOTEX_Vault if connected
    try {
      const User = require('../models/User');
      const googleDriveService = require('../services/googleDriveService');
      const user = await User.findById(req.user.id);
      if (user && (user.googleAccessToken || user.googleRefreshToken)) {
        const parentFolder = folder.parentId ? await Folder.findById(folder.parentId) : null;
        googleDriveService.syncFolderToDrive(user, folder, parentFolder).catch(err => {
          console.warn('[Google Drive Folder Auto-Sync Warning]:', err.message);
        });
      }
    } catch (driveSyncErr) {
      console.warn('[Google Drive Folder Dispatch Info]:', driveSyncErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Folder created successfully!',
      folder: {
        ...(folder.toJSON ? folder.toJSON() : folder),
        noteCount: 0,
        subfolderCount: 0
      }
    });
  } catch (error) {
    console.error('[CreateFolder Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating folder.'
    });
  }
};

// @desc    Update / rename folder
// @route   PUT /api/folders/:id
// @access  Private
const updateFolder = async (req, res) => {
  try {
    const { name, parentId, color, icon } = req.body;

    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found.'
      });
    }

    if (String(folder.userId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized action.'
      });
    }

    // Auto-sync folder rename to Google Drive NOTEX_Vault if connected
    try {
      const User = require('../models/User');
      const googleDriveService = require('../services/googleDriveService');
      const user = await User.findById(req.user.id);
      if (user && (user.googleAccessToken || user.googleRefreshToken) && name && name !== folder.name) {
        const parentFolder = folder.parentId ? await Folder.findById(folder.parentId) : null;
        googleDriveService.renameDriveFolder(user, folder.name, name, parentFolder ? parentFolder.name : null).catch(err => {
          console.warn('[Google Drive Folder Rename Warning]:', err.message);
        });
      }
    } catch (driveRenameErr) {
      console.warn('[Google Drive Rename Dispatch Info]:', driveRenameErr.message);
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (parentId !== undefined) updateData.parentId = parentId || null;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;

    const updated = await Folder.findByIdAndUpdate(req.params.id, updateData, { new: true });

    return res.status(200).json({
      success: true,
      message: 'Folder updated successfully!',
      folder: updated
    });
  } catch (error) {
    console.error('[UpdateFolder Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating folder.'
    });
  }
};

// @desc    Delete folder and handle its children
// @route   DELETE /api/folders/:id
// @access  Private
const deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found.'
      });
    }

    if (String(folder.userId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized action.'
      });
    }

    // Auto-delete folder from Google Drive NOTEX_Vault if connected
    try {
      const User = require('../models/User');
      const googleDriveService = require('../services/googleDriveService');
      const user = await User.findById(req.user.id);
      if (user && (user.googleAccessToken || user.googleRefreshToken)) {
        const parentFolder = folder.parentId ? await Folder.findById(folder.parentId) : null;
        googleDriveService.deleteDriveFolder(user, folder.name, parentFolder ? parentFolder.name : null).catch(err => {
          console.warn('[Google Drive Folder Auto-Delete Warning]:', err.message);
        });
      }
    } catch (driveDelErr) {
      console.warn('[Google Drive Folder Delete Dispatch Info]:', driveDelErr.message);
    }

    const folderId = req.params.id;

    // Find all subfolder IDs recursively
    const allUserFolders = await Folder.find({ userId: req.user.id });
    const getChildFolderIds = (parentId) => {
      const children = allUserFolders.filter(f => f.parentId === parentId);
      let ids = children.map(c => c._id || c.id);
      children.forEach(c => {
        ids = ids.concat(getChildFolderIds(c._id || c.id));
      });
      return ids;
    };

    const targetFolderIds = [folderId, ...getChildFolderIds(folderId)];

    // Delete all target folders
    for (const id of targetFolderIds) {
      await Folder.findByIdAndDelete(id);
    }

    // Unassign notes from deleted folders (or delete notes if cascade requested)
    const notes = await Note.find({ userId: req.user.id });
    for (const note of notes) {
      if (targetFolderIds.includes(note.folderId)) {
        await Note.findByIdAndUpdate(note._id || note.id, { folderId: null });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Folder and subfolders deleted successfully and removed from Google Drive!',
      deletedFolderIds: targetFolderIds
    });
  } catch (error) {
    console.error('[DeleteFolder Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting folder.'
    });
  }
};

module.exports = {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder
};
