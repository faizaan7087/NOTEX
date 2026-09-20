const { google } = require('googleapis');

/**
 * Google Drive Storage Service for NOTEX ("store it like a variable")
 * Manages personal Google Drive storage for students in a dedicated "NOTEX_Vault" folder.
 */

// Initialize OAuth2 client
const createOAuth2Client = (accessToken, refreshToken) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173'
  );

  if (accessToken || refreshToken) {
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });
  }

  return oauth2Client;
};

/**
 * Get or create the root "NOTEX_Vault" folder in the student's personal Google Drive
 */
const getOrCreateNotexVault = async (authClient) => {
  try {
    const drive = google.drive({ version: 'v3', auth: authClient });

    // Search for existing NOTEX_Vault folder in root
    const response = await drive.files.list({
      q: "name = 'NOTEX_Vault' and mimeType = 'application/vnd.google-apps.folder' and trashed = false and 'root' in parents",
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (response.data.files && response.data.files.length > 0) {
      console.log('[Google Drive] Found existing NOTEX_Vault folder:', response.data.files[0].id);
      return response.data.files[0].id;
    }

    // Create NOTEX_Vault folder if not found
    const fileMetadata = {
      name: 'NOTEX_Vault',
      mimeType: 'application/vnd.google-apps.folder',
      description: 'NOTEX - Student Notes Management & Academic Repository Vault'
    };

    const folder = await drive.files.create({
      requestBody: fileMetadata,
      resource: fileMetadata,
      fields: 'id'
    });

    console.log('[Google Drive] Successfully created NOTEX_Vault root folder:', folder.data.id);
    return folder.data.id;
  } catch (error) {
    console.error('[Google Drive Service] Error finding/creating NOTEX_Vault:', error.message);
    throw error;
  }
};

/**
 * Find or create a subfolder (e.g. "BDA" or "Unit 1") in Google Drive under a parent
 */
const getOrCreateSubfolder = async (authClient, parentId, folderName) => {
  try {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const cleanName = folderName.replace(/'/g, "\\'");

    const response = await drive.files.list({
      q: `name = '${cleanName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false and '${parentId}' in parents`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    };

    const created = await drive.files.create({
      requestBody: fileMetadata,
      resource: fileMetadata,
      fields: 'id, name'
    });

    return created.data.id;
  } catch (error) {
    console.warn('[Google Drive] Subfolder check/create fallback to parent:', error.message);
    return parentId;
  }
};

/**
 * Create a subfolder in Google Drive
 */
const createDriveFolder = async (authClient, parentId, folderName) => {
  try {
    const drive = google.drive({ version: 'v3', auth: authClient });

    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    };

    const folder = await drive.files.create({
      requestBody: fileMetadata,
      resource: fileMetadata,
      fields: 'id, name, parents'
    });

    return {
      id: folder.data.id,
      name: folder.data.name,
      parentId: parentId
    };
  } catch (error) {
    console.error('[Google Drive Service] Error creating Drive folder:', error.message);
    throw error;
  }
};

/**
 * Resolve the full recursive folder hierarchy from database
 */
const resolveFolderHierarchy = async (folderId) => {
  if (!folderId) return [];
  try {
    const Folder = require('../models/Folder');
    const hierarchy = [];
    let currentId = folderId;
    const visited = new Set();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const folder = await Folder.findById(currentId);
      if (!folder || !folder.name) break;
      hierarchy.unshift(folder.name.trim());
      currentId = folder.parentId;
    }
    return hierarchy;
  } catch (err) {
    console.warn('[Google Drive] Error resolving folder hierarchy:', err.message);
    return [];
  }
};

/**
 * Traverse and create the full folder & subfolder chain in Google Drive
 */
const getOrCreateFolderPath = async (authClient, vaultId, folderNames = []) => {
  let currentParentId = vaultId;
  for (const name of folderNames) {
    if (name && name.trim()) {
      currentParentId = await getOrCreateSubfolder(authClient, currentParentId, name.trim());
    }
  }
  return currentParentId;
};

/**
 * Upload an attachment file (DOCX, PDF, image, etc.) directly into Google Drive inside target folder
 */
const uploadDriveAttachment = async (drive, targetFolderId, att, noteTitle) => {
  if (!att || !att.data) return att;

  // If already uploaded and has driveViewLink, skip re-upload unless missing
  if (att.driveFileId && att.driveViewLink) {
    return att;
  }

  if (att.data.startsWith('data:')) {
    try {
      const parts = att.data.split(',');
      const base64Content = parts[1] || '';
      const match = parts[0].match(/:(.*?);/);
      const mimeType = att.type || (match ? match[1] : 'application/octet-stream');
      const buffer = Buffer.from(base64Content, 'base64');
      const { Readable } = require('stream');

      const fileName = att.name || 'document';
      const cleanFileName = fileName.replace(/'/g, "\\'");

      // Check if file with same name already exists in target Google Drive folder
      const searchRes = await drive.files.list({
        q: `name = '${cleanFileName}' and trashed = false and '${targetFolderId}' in parents`,
        fields: 'files(id, name, webViewLink, webContentLink)',
        spaces: 'drive'
      });

      let driveFileId;
      let webViewLink;
      let webContentLink;

      const media = {
        mimeType: mimeType,
        body: Readable.from(buffer)
      };

      if (searchRes.data.files && searchRes.data.files.length > 0) {
        driveFileId = searchRes.data.files[0].id;
        const updated = await drive.files.update({
          fileId: driveFileId,
          media: media,
          fields: 'id, name, webViewLink, webContentLink'
        });
        webViewLink = updated.data.webViewLink;
        webContentLink = updated.data.webContentLink;
        console.log(`[Google Drive] Updated attachment "${fileName}" (ID: ${driveFileId}) in Drive folder.`);
      } else {
        const fileMetadata = {
          name: fileName,
          parents: [targetFolderId],
          description: `Attachment for NOTEX Note: ${noteTitle || 'Study Note'}`
        };
        const created = await drive.files.create({
          requestBody: fileMetadata,
          resource: fileMetadata,
          media: media,
          fields: 'id, name, webViewLink, webContentLink'
        });
        driveFileId = created.data.id;
        webViewLink = created.data.webViewLink;
        webContentLink = created.data.webContentLink;
        console.log(`[Google Drive] Created attachment "${fileName}" (ID: ${driveFileId}) in Drive folder.`);
      }

      // Ensure anyone with link can view the file
      try {
        await drive.permissions.create({
          fileId: driveFileId,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });
      } catch (permErr) {
        // Ignored if domain restricted
      }

      return {
        ...att,
        driveFileId: driveFileId,
        driveViewLink: webViewLink || `https://drive.google.com/file/d/${driveFileId}/view`,
        driveDownloadLink: webContentLink || `https://drive.google.com/uc?export=download&id=${driveFileId}`
      };
    } catch (attErr) {
      console.error(`[Google Drive] Error uploading attachment "${att.name}":`, attErr.message);
      return att;
    }
  }

  return att;
};

/**
 * Save or update a note file (.notex.json) AND all its attachments in Google Drive inside a folder
 */
const saveDriveNote = async (authClient, folderId, noteData) => {
  try {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const cleanTitle = (noteData.title || 'Untitled').replace(/[/\\?%*:|"<>]/g, '-');
    const noteFileName = `${cleanTitle}.notex.json`;

    // 1. Upload any document/image attachments directly into this Drive folder
    const updatedAttachments = [];
    for (const att of (noteData.attachments || [])) {
      const syncedAtt = await uploadDriveAttachment(drive, folderId, att, noteData.title);
      updatedAttachments.push(syncedAtt);
    }

    // 2. Check if .notex.json already exists in this folder
    const searchRes = await drive.files.list({
      q: `name = '${noteFileName.replace(/'/g, "\\'")}' and trashed = false and '${folderId}' in parents`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    const notePayload = {
      id: noteData._id || noteData.id,
      title: noteData.title,
      subject: noteData.subject || 'General',
      content: noteData.content || '',
      tags: noteData.tags || [],
      isFavorite: Boolean(noteData.isFavorite),
      color: noteData.color || 'indigo',
      author: noteData.authorName || 'Student',
      attachments: updatedAttachments.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        size: a.size,
        driveFileId: a.driveFileId,
        driveViewLink: a.driveViewLink,
        driveDownloadLink: a.driveDownloadLink,
        uploadedAt: a.uploadedAt
      })),
      lastSyncedAt: new Date().toISOString()
    };

    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(notePayload, null, 2)
    };

    let driveFileResult;

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      // Update existing file
      const existingFileId = searchRes.data.files[0].id;
      const updated = await drive.files.update({
        fileId: existingFileId,
        media: media,
        fields: 'id, name, webViewLink, modifiedTime'
      });
      console.log(`[Google Drive] Updated note "${noteFileName}" in Drive:`, updated.data.id);
      driveFileResult = updated.data;
    } else {
      // Create new note file
      const fileMetadata = {
        name: noteFileName,
        parents: [folderId],
        properties: {
          subject: noteData.subject || 'General',
          tags: (noteData.tags || []).join(','),
          notexId: String(noteData._id || noteData.id || '')
        }
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        resource: fileMetadata,
        media: media,
        fields: 'id, name, properties, webViewLink, createdTime'
      });

      console.log(`[Google Drive] Created note "${noteFileName}" in Drive:`, file.data.id);
      driveFileResult = file.data;
    }

    // 3. Update note in local DB with synced attachment Drive links
    try {
      const Note = require('../models/Note');
      const noteId = noteData._id || noteData.id;
      if (noteId) {
        await Note.findByIdAndUpdate(noteId, { attachments: updatedAttachments });
      }
    } catch (dbErr) {
      console.warn('[Google Drive] Note attachment DB update warning:', dbErr.message);
    }

    return {
      file: driveFileResult,
      attachments: updatedAttachments
    };
  } catch (error) {
    console.error('[Google Drive Service] Error saving note to Drive:', error.message);
    throw error;
  }
};

/**
 * Automatically sync a note and its attachments to Google Drive with full folder + subfolder structure
 */
const syncNoteToDrive = async (user, note, folder = null) => {
  if (!user || (!user.googleAccessToken && !user.googleRefreshToken)) {
    return null;
  }

  try {
    const authClient = createOAuth2Client(user.googleAccessToken, user.googleRefreshToken);
    
    // Ensure root NOTEX_Vault exists
    let vaultId = user.driveRootFolderId;
    if (!vaultId) {
      vaultId = await getOrCreateNotexVault(authClient);
      const User = require('../models/User');
      await User.findByIdAndUpdate(user._id || user.id, { driveRootFolderId: vaultId });
    }

    // Resolve full folder hierarchy from root down to subfolder
    let folderNames = [];
    if (note.folderId) {
      folderNames = await resolveFolderHierarchy(note.folderId);
    } else if (folder && folder.name) {
      folderNames = [folder.name];
    } else if (note.subject && note.subject !== 'General') {
      folderNames = [note.subject];
    }

    const targetFolderId = await getOrCreateFolderPath(authClient, vaultId, folderNames);
    const result = await saveDriveNote(authClient, targetFolderId, note);
    return result;
  } catch (err) {
    console.warn('[Google Drive Sync Warning]:', err.message);
    return null;
  }
};

/**
 * Delete a note file from Google Drive (strictly inside NOTEX_Vault or subfolder)
 */
const deleteDriveNote = async (user, note, folder = null) => {
  if (!user || (!user.googleAccessToken && !user.googleRefreshToken)) {
    return false;
  }

  try {
    const authClient = createOAuth2Client(user.googleAccessToken, user.googleRefreshToken);
    const drive = google.drive({ version: 'v3', auth: authClient });

    let vaultId = user.driveRootFolderId;
    if (!vaultId) {
      vaultId = await getOrCreateNotexVault(authClient);
    }

    let searchParentId = vaultId;
    if (folder && folder.name) {
      searchParentId = await getOrCreateSubfolder(authClient, vaultId, folder.name);
    }

    const cleanTitle = (note.title || 'Untitled').replace(/[/\\?%*:|"<>]/g, '-');
    const noteFileName = `${cleanTitle}.notex.json`;

    // Search specifically within the target folder inside NOTEX_Vault
    const response = await drive.files.list({
      q: `name = '${noteFileName.replace(/'/g, "\\'")}' and trashed = false and '${searchParentId}' in parents`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (response.data.files && response.data.files.length > 0) {
      for (const file of response.data.files) {
        await drive.files.delete({ fileId: file.id });
        console.log(`[Google Drive] Deleted note "${file.name}" (ID: ${file.id}) from Drive.`);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.warn('[Google Drive Delete Note Warning]:', error.message);
    return false;
  }
};

/**
 * Delete a folder from Google Drive (strictly inside NOTEX_Vault)
 */
const deleteDriveFolder = async (user, folderName, parentFolderName = null) => {
  if (!user || (!user.googleAccessToken && !user.googleRefreshToken)) {
    return false;
  }

  try {
    const authClient = createOAuth2Client(user.googleAccessToken, user.googleRefreshToken);
    const drive = google.drive({ version: 'v3', auth: authClient });

    let vaultId = user.driveRootFolderId;
    if (!vaultId) {
      vaultId = await getOrCreateNotexVault(authClient);
    }

    let parentId = vaultId;
    if (parentFolderName) {
      parentId = await getOrCreateSubfolder(authClient, vaultId, parentFolderName);
    }

    const cleanName = folderName.replace(/'/g, "\\'");
    const response = await drive.files.list({
      q: `name = '${cleanName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false and '${parentId}' in parents`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (response.data.files && response.data.files.length > 0) {
      for (const f of response.data.files) {
        await drive.files.delete({ fileId: f.id });
        console.log(`[Google Drive] Deleted folder "${f.name}" (ID: ${f.id}) from Drive.`);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.warn('[Google Drive Delete Folder Warning]:', error.message);
    return false;
  }
};

/**
 * Sync a new folder creation to Google Drive
 */
const syncFolderToDrive = async (user, folder, parentFolder = null) => {
  if (!user || (!user.googleAccessToken && !user.googleRefreshToken)) {
    return null;
  }

  try {
    const authClient = createOAuth2Client(user.googleAccessToken, user.googleRefreshToken);
    let vaultId = user.driveRootFolderId;
    if (!vaultId) {
      vaultId = await getOrCreateNotexVault(authClient);
      const User = require('../models/User');
      await User.findByIdAndUpdate(user._id || user.id, { driveRootFolderId: vaultId });
    }

    let parentId = vaultId;
    if (parentFolder && parentFolder.name) {
      parentId = await getOrCreateSubfolder(authClient, vaultId, parentFolder.name);
    }

    const createdFolderId = await getOrCreateSubfolder(authClient, parentId, folder.name);
    console.log(`[Google Drive] Synced folder "${folder.name}" to Drive:`, createdFolderId);
    return createdFolderId;
  } catch (error) {
    console.warn('[Google Drive Sync Folder Warning]:', error.message);
    return null;
  }
};

/**
 * Rename a folder in Google Drive
 */
const renameDriveFolder = async (user, oldName, newName, parentFolderName = null) => {
  if (!user || (!user.googleAccessToken && !user.googleRefreshToken) || oldName === newName) {
    return false;
  }

  try {
    const authClient = createOAuth2Client(user.googleAccessToken, user.googleRefreshToken);
    const drive = google.drive({ version: 'v3', auth: authClient });

    let vaultId = user.driveRootFolderId;
    if (!vaultId) {
      vaultId = await getOrCreateNotexVault(authClient);
    }

    let parentId = vaultId;
    if (parentFolderName) {
      parentId = await getOrCreateSubfolder(authClient, vaultId, parentFolderName);
    }

    const cleanOld = oldName.replace(/'/g, "\\'");
    const response = await drive.files.list({
      q: `name = '${cleanOld}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false and '${parentId}' in parents`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (response.data.files && response.data.files.length > 0) {
      const folderId = response.data.files[0].id;
      await drive.files.update({
        fileId: folderId,
        requestBody: { name: newName },
        resource: { name: newName }
      });
      console.log(`[Google Drive] Renamed folder "${oldName}" to "${newName}" in Drive.`);
      return true;
    }
    return false;
  } catch (error) {
    console.warn('[Google Drive Rename Folder Warning]:', error.message);
    return false;
  }
};

/**
 * Recursively clone a shared repository snapshot into the recipient's Google Drive
 */
const cloneSnapshotToDrive = async (authClient, recipientVaultId, snapshot) => {
  try {
    const rootFolderData = snapshot.folder;
    // 1. Create root repo folder in recipient's NOTEX_Vault
    const rootDriveFolder = await createDriveFolder(authClient, recipientVaultId, rootFolderData.name);

    const folderIdMap = {
      [rootFolderData._id || rootFolderData.id]: rootDriveFolder.id
    };

    // 2. Create subfolders
    for (const subfolder of snapshot.subfolders || []) {
      const parentDriveId = folderIdMap[subfolder.parentId] || rootDriveFolder.id;
      const createdSubfolder = await createDriveFolder(authClient, parentDriveId, subfolder.name);
      folderIdMap[subfolder._id || subfolder.id] = createdSubfolder.id;
    }

    // 3. Write notes into their respective Drive folders
    const clonedNotes = [];
    for (const note of snapshot.notes || []) {
      const targetDriveFolderId = folderIdMap[note.folderId] || rootDriveFolder.id;
      const saved = await saveDriveNote(authClient, targetDriveFolderId, note);
      clonedNotes.push(saved);
    }

    return {
      rootDriveFolderId: rootDriveFolder.id,
      totalUnits: (snapshot.subfolders || []).length,
      totalNotes: clonedNotes.length
    };
  } catch (error) {
    console.error('[Google Drive Service] Error cloning snapshot to recipient Drive:', error.message);
    throw error;
  }
};

module.exports = {
  createOAuth2Client,
  getOrCreateNotexVault,
  getOrCreateSubfolder,
  createDriveFolder,
  saveDriveNote,
  syncNoteToDrive,
  deleteDriveNote,
  deleteDriveFolder,
  syncFolderToDrive,
  renameDriveFolder,
  cloneSnapshotToDrive
};
