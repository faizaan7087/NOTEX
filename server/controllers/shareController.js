const ShareLink = require('../models/ShareLink');
const Folder = require('../models/Folder');
const Note = require('../models/Note');
const User = require('../models/User');
const googleDriveService = require('../services/googleDriveService');

// @desc    Generate a 1-Hour Cloud Relay share link for an entire folder repo
// @route   POST /api/share/create
// @access  Private
const createShareLink = async (req, res) => {
  try {
    const { folderId, expiresInHours = 1 } = req.body;

    if (!folderId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a folder ID to share.'
      });
    }

    const rootFolder = await Folder.findById(folderId);
    if (!rootFolder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found.'
      });
    }

    if (String(rootFolder.userId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only share your own folders.'
      });
    }

    // Recursively collect all nested subfolders
    const allUserFolders = await Folder.find({ userId: req.user.id });
    const getSubfolderTree = (parentId) => {
      const children = allUserFolders.filter(f => f.parentId === parentId);
      let list = [...children];
      children.forEach(c => {
        list = list.concat(getSubfolderTree(c._id || c.id));
      });
      return list;
    };

    const subfolders = getSubfolderTree(folderId);
    const allFolderIds = [folderId, ...subfolders.map(f => f._id || f.id)];

    // Collect all notes within root folder and all its subfolders
    const allUserNotes = await Note.find({ userId: req.user.id });
    const notesInRepo = allUserNotes.filter(n => allFolderIds.includes(n.folderId));

    // Calculate expiration timestamp (Default: 1 Hour Cloud Relay)
    const durationHours = parseFloat(expiresInHours) || 1;
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    // Generate readable, unique share code
    const cleanFolderName = rootFolder.name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 12);
    const randomHex = Math.random().toString(36).substring(2, 8);
    const shareCode = `notex_${cleanFolderName}_${randomHex}`;

    // Get user details
    const user = await User.findById(req.user.id);
    const authorName = user?.name || req.user.name || 'NOTEX Student';
    const authorCollege = user?.college || 'Computer Science Department';
    const authorEmail = user?.email || req.user.email || '';

    const shareLink = await ShareLink.create({
      shareCode,
      userId: req.user.id,
      authorName,
      authorCollege,
      authorEmail,
      folderName: rootFolder.name,
      totalNotes: notesInRepo.length,
      totalSubfolders: subfolders.length,
      snapshotData: {
        rootFolder: rootFolder.toJSON ? rootFolder.toJSON() : rootFolder,
        subfolders: subfolders.map(f => (f.toJSON ? f.toJSON() : f)),
        notes: notesInRepo.map(n => (n.toJSON ? n.toJSON() : n))
      },
      expiresAt
    });

    return res.status(201).json({
      success: true,
      message: 'Share link generated successfully!',
      shareCode: shareLink.shareCode,
      folderName: rootFolder.name,
      totalNotes: notesInRepo.length,
      totalSubfolders: subfolders.length,
      authorName,
      expiresAt: shareLink.expiresAt
    });
  } catch (error) {
    console.error('[CreateShareLink Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while generating share link.'
    });
  }
};

// @desc    Get shared repository preview by share code (with expiration check)
// @route   GET /api/share/:code
// @access  Public / Private
const getSharedRepo = async (req, res) => {
  try {
    const { code } = req.params;

    const shareLink = await ShareLink.findOne({ shareCode: code });
    if (!shareLink) {
      return res.status(404).json({
        success: false,
        message: 'Share link not found or invalid.'
      });
    }

    // Check expiration
    const isExpired = new Date(shareLink.expiresAt) < new Date();
    if (isExpired) {
      return res.status(410).json({
        success: false,
        expired: true,
        message: `This share link expired on ${new Date(shareLink.expiresAt).toLocaleDateString()}.`,
        expiresAt: shareLink.expiresAt
      });
    }

    const { snapshotData } = shareLink;
    const subfolderNames = (snapshotData?.subfolders || []).map(f => f.name);
    const notePreviews = (snapshotData?.notes || []).map(n => ({
      title: n.title,
      subject: n.subject,
      tags: n.tags || [],
      hasAttachments: (n.attachments || []).length > 0,
      attachmentCount: (n.attachments || []).length
    }));

    return res.status(200).json({
      success: true,
      shareCode: shareLink.shareCode,
      folderName: shareLink.folderName,
      authorName: shareLink.authorName,
      authorCollege: shareLink.authorCollege,
      createdAt: shareLink.createdAt,
      expiresAt: shareLink.expiresAt,
      totalNotes: shareLink.totalNotes,
      totalSubfolders: shareLink.totalSubfolders,
      subfolders: subfolderNames,
      notePreviews
    });
  } catch (error) {
    console.error('[GetSharedRepo Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching shared repository.'
    });
  }
};

// @desc    Clone shared folder repository into authenticated user's account
// @route   POST /api/share/clone/:code
// @access  Private
const cloneSharedRepo = async (req, res) => {
  try {
    const { code } = req.params;

    const shareLink = await ShareLink.findOne({ shareCode: code });
    if (!shareLink) {
      return res.status(404).json({
        success: false,
        message: 'Share link not found.'
      });
    }

    // Expiration check
    if (new Date(shareLink.expiresAt) < new Date()) {
      return res.status(410).json({
        success: false,
        expired: true,
        message: 'This share link has expired and cannot be cloned.'
      });
    }

    const { snapshotData } = shareLink;
    if (!snapshotData || !snapshotData.rootFolder) {
      return res.status(400).json({
        success: false,
        message: 'Shared repository data is corrupted.'
      });
    }

    const userId = req.user.id;
    const folderIdMap = {}; // Maps oldFolderId -> newFolderId

    // 1. Clone Root Folder
    const originalRoot = snapshotData.rootFolder;
    const clonedRoot = await Folder.create({
      userId,
      name: originalRoot.name,
      parentId: null,
      color: originalRoot.color || 'indigo',
      icon: originalRoot.icon || 'Folder'
    });
    folderIdMap[originalRoot._id || originalRoot.id] = clonedRoot._id || clonedRoot.id;

    // 2. Clone Subfolders preserving parent relationships
    const originalSubfolders = snapshotData.subfolders || [];
    for (const sub of originalSubfolders) {
      const oldParentId = sub.parentId;
      const newParentId = folderIdMap[oldParentId] || clonedRoot._id || clonedRoot.id;

      const clonedSub = await Folder.create({
        userId,
        name: sub.name,
        parentId: newParentId,
        color: sub.color || 'indigo',
        icon: sub.icon || 'Folder'
      });
      folderIdMap[sub._id || sub.id] = clonedSub._id || clonedSub.id;
    }

    // 3. Clone all Notes with attachments
    const originalNotes = snapshotData.notes || [];
    let clonedNotesCount = 0;

    for (const note of originalNotes) {
      const targetFolderId = folderIdMap[note.folderId] || clonedRoot._id || clonedRoot.id;

      await Note.create({
        userId,
        folderId: targetFolderId,
        title: note.title,
        subject: note.subject || originalRoot.name,
        content: note.content || '',
        tags: Array.isArray(note.tags) ? [...note.tags, `SharedBy-${shareLink.authorName.split(' ')[0]}`] : [],
        color: note.color || 'indigo',
        isFavorite: false,
        attachments: Array.isArray(note.attachments) ? note.attachments : []
      });
      clonedNotesCount++;
    }

    // 4. If recipient has Google Drive connected, also clone directly into their Google Drive NOTEX_Vault
    let driveCloned = false;
    const recipientUser = await User.findById(userId);
    if (recipientUser?.googleAccessToken || recipientUser?.driveRootFolderId) {
      try {
        const authClient = googleDriveService.createOAuth2Client(
          recipientUser.googleAccessToken,
          recipientUser.googleRefreshToken
        );
        const vaultId = recipientUser.driveRootFolderId || (await googleDriveService.getOrCreateNotexVault(authClient));
        await googleDriveService.cloneSnapshotToDrive(authClient, vaultId, snapshotData);
        driveCloned = true;
      } catch (driveErr) {
        console.warn('[Clone Drive Sync Info]:', driveErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Successfully cloned "${shareLink.folderName}" (${originalSubfolders.length} units & ${clonedNotesCount} notes) into your ${driveCloned ? 'Google Drive & ' : ''}workspace!`,
      clonedFolderId: clonedRoot._id || clonedRoot.id,
      clonedFolderName: clonedRoot.name,
      clonedNotesCount,
      clonedUnitsCount: originalSubfolders.length,
      authorName: shareLink.authorName,
      driveCloned
    });
  } catch (error) {
    console.error('[CloneSharedRepo Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while cloning repository.'
    });
  }
};

module.exports = {
  createShareLink,
  getSharedRepo,
  cloneSharedRepo
};
