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
 * Save or update a note file in Google Drive inside a folder
 */
const saveDriveNote = async (authClient, folderId, noteData) => {
  try {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const cleanTitle = (noteData.title || 'Untitled').replace(/[/\\?%*:|"<>]/g, '-');
    const noteFileName = `${cleanTitle}.notex.json`;

    // Check if file already exists in this folder
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
      lastSyncedAt: new Date().toISOString()
    };

    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(notePayload, null, 2)
    };

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      // Update existing file
      const existingFileId = searchRes.data.files[0].id;
      const updated = await drive.files.update({
        fileId: existingFileId,
        media: media,
        fields: 'id, name, webViewLink, modifiedTime'
      });
      console.log(`[Google Drive] Updated note "${noteFileName}" in Drive:`, updated.data.id);
      return updated.data;
    }

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
    return file.data;
  } catch (error) {
    console.error('[Google Drive Service] Error saving note to Drive:', error.message);
    throw error;
  }
};

/**
 * Automatically sync a note to Google Drive
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

    let targetFolderId = vaultId;

    // If note is organized under a folder, find or create the subfolder
    if (folder && folder.name) {
      targetFolderId = await getOrCreateSubfolder(authClient, vaultId, folder.name);
    }

    const driveFile = await saveDriveNote(authClient, targetFolderId, note);
    return driveFile;
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
