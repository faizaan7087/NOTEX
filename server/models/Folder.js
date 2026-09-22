const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dbConfig = require('../config/db');

// --- Mongoose Schema ---
const folderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please provide a folder name'],
      trim: true,
      maxlength: [80, 'Folder name cannot exceed 80 characters']
    },
    parentId: {
      type: String,
      default: null,
      index: true
    },
    color: {
      type: String,
      default: 'indigo'
    },
    icon: {
      type: String,
      default: 'Folder'
    }
  },
  {
    timestamps: true
  }
);

const MongoFolder = mongoose.model('Folder', folderSchema);

// --- Persistent File Store Fallback ---
const FOLDERS_FILE = path.join(__dirname, '..', 'data', 'folders.json');

const loadFileFolders = () => {
  try {
    if (!fs.existsSync(FOLDERS_FILE)) {
      fs.writeFileSync(FOLDERS_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(FOLDERS_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
};

const saveFileFolders = (folders) => {
  const dataDir = path.dirname(FOLDERS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(FOLDERS_FILE, JSON.stringify(folders, null, 2));
};

const cloudflareD1 = require('../services/cloudflareD1Service');

class FileFolderDoc {
  constructor(data) {
    Object.assign(this, data);
    if (!this._id && this.id) {
      this._id = this.id;
    }
  }

  toJSON() {
    return { ...this };
  }
}

const FolderProxy = {
  async create(folderData) {
    if (dbConfig.isD1) {
      const folderId = 'folder_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      const now = new Date().toISOString();
      const parentId = folderData.parentId ? String(folderData.parentId) : null;
      const color = folderData.color || 'indigo';
      const icon = folderData.icon || 'Folder';
      const name = folderData.name.trim();
      const userId = String(folderData.userId);

      await cloudflareD1.execute(
        `INSERT INTO folders (id, userId, name, parentId, color, icon, createdAt, updatedAt)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
        [folderId, userId, name, parentId, color, icon, now, now]
      );

      return new FileFolderDoc({
        id: folderId,
        _id: folderId,
        userId,
        name,
        parentId,
        color,
        icon,
        createdAt: now,
        updatedAt: now
      });
    }

    if (dbConfig.isMongo) {
      return await MongoFolder.create(folderData);
    }
    const folders = loadFileFolders();
    const now = new Date().toISOString();

    const newFolder = {
      _id: 'folder_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      userId: String(folderData.userId),
      name: folderData.name.trim(),
      parentId: folderData.parentId ? String(folderData.parentId) : null,
      color: folderData.color || 'indigo',
      icon: folderData.icon || 'Folder',
      createdAt: now,
      updatedAt: now
    };

    folders.push(newFolder);
    saveFileFolders(folders);
    return new FileFolderDoc(newFolder);
  },

  async find(query = {}, sort = { createdAt: 1 }) {
    if (dbConfig.isD1) {
      let sql = 'SELECT * FROM folders WHERE 1=1';
      const params = [];
      let paramIdx = 1;

      if (query.userId) {
        sql += ` AND userId = ?${paramIdx++}`;
        params.push(String(query.userId));
      }

      if (query.parentId !== undefined) {
        if (query.parentId === null) {
          sql += ` AND (parentId IS NULL OR parentId = '')`;
        } else {
          sql += ` AND parentId = ?${paramIdx++}`;
          params.push(String(query.parentId));
        }
      }

      sql += ' ORDER BY createdAt ASC';
      const rows = await cloudflareD1.query(sql, params);
      return rows.map(r => new FileFolderDoc({ ...r, _id: r.id }));
    }

    if (dbConfig.isMongo) {
      return await MongoFolder.find(query).sort(sort);
    }
    let folders = loadFileFolders();

    if (query.userId) {
      folders = folders.filter(f => f.userId === String(query.userId));
    }

    if (query.parentId !== undefined) {
      if (query.parentId === null) {
        folders = folders.filter(f => !f.parentId);
      } else {
        folders = folders.filter(f => f.parentId === String(query.parentId));
      }
    }

    return folders.map(f => new FileFolderDoc(f));
  },

  async findById(id) {
    if (dbConfig.isD1) {
      const rows = await cloudflareD1.query('SELECT * FROM folders WHERE id = ?1 LIMIT 1', [id]);
      if (rows && rows.length > 0) {
        return new FileFolderDoc({ ...rows[0], _id: rows[0].id });
      }
      return null;
    }

    if (dbConfig.isMongo) {
      return await MongoFolder.findById(id);
    }
    const folders = loadFileFolders();
    const found = folders.find(f => f._id === id);
    return found ? new FileFolderDoc(found) : null;
  },

  async findByIdAndUpdate(id, updateData, options = {}) {
    if (dbConfig.isD1) {
      const existing = await cloudflareD1.query('SELECT * FROM folders WHERE id = ?1 LIMIT 1', [id]);
      if (!existing || existing.length === 0) return null;

      const current = existing[0];
      const now = new Date().toISOString();
      const name = updateData.name !== undefined ? updateData.name.trim() : current.name;
      const parentId = updateData.parentId !== undefined ? (updateData.parentId ? String(updateData.parentId) : null) : current.parentId;
      const color = updateData.color !== undefined ? updateData.color : current.color;
      const icon = updateData.icon !== undefined ? updateData.icon : current.icon;

      await cloudflareD1.execute(
        `UPDATE folders SET name = ?1, parentId = ?2, color = ?3, icon = ?4, updatedAt = ?5 WHERE id = ?6`,
        [name, parentId, color, icon, now, id]
      );

      const updated = await cloudflareD1.query('SELECT * FROM folders WHERE id = ?1 LIMIT 1', [id]);
      if (updated && updated.length > 0) {
        return new FileFolderDoc({ ...updated[0], _id: updated[0].id });
      }
      return null;
    }

    if (dbConfig.isMongo) {
      return await MongoFolder.findByIdAndUpdate(id, updateData, { new: true, ...options });
    }
    const folders = loadFileFolders();
    const index = folders.findIndex(f => f._id === id);
    if (index === -1) return null;

    const updatedFolder = {
      ...folders[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    folders[index] = updatedFolder;
    saveFileFolders(folders);
    return new FileFolderDoc(updatedFolder);
  },

  async findByIdAndDelete(id) {
    if (dbConfig.isD1) {
      const existing = await cloudflareD1.query('SELECT * FROM folders WHERE id = ?1 LIMIT 1', [id]);
      if (!existing || existing.length === 0) return null;

      await cloudflareD1.execute('DELETE FROM folders WHERE id = ?1', [id]);
      return new FileFolderDoc({ ...existing[0], _id: existing[0].id });
    }

    if (dbConfig.isMongo) {
      return await MongoFolder.findByIdAndDelete(id);
    }
    const folders = loadFileFolders();
    const index = folders.findIndex(f => f._id === id);
    if (index === -1) return null;
    const deleted = folders.splice(index, 1)[0];
    saveFileFolders(folders);
    return new FileFolderDoc(deleted);
  },

  async deleteMany(query = {}) {
    if (dbConfig.isD1) {
      if (query.userId && query.parentId) {
        await cloudflareD1.execute('DELETE FROM folders WHERE userId = ?1 AND parentId = ?2', [String(query.userId), String(query.parentId)]);
      } else if (query.userId) {
        await cloudflareD1.execute('DELETE FROM folders WHERE userId = ?1', [String(query.userId)]);
      }
      return { acknowledged: true };
    }

    if (dbConfig.isMongo) {
      return await MongoFolder.deleteMany(query);
    }
    let folders = loadFileFolders();
    if (query.userId && query.parentId) {
      folders = folders.filter(f => !(f.userId === String(query.userId) && f.parentId === String(query.parentId)));
    }
    saveFileFolders(folders);
    return { acknowledged: true };
  }
};

module.exports = FolderProxy;

