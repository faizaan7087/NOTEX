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

class FileFolderDoc {
  constructor(data) {
    Object.assign(this, data);
  }

  toJSON() {
    return { ...this };
  }
}

const FolderProxy = {
  async create(folderData) {
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
    if (dbConfig.isMongo) {
      return await MongoFolder.findById(id);
    }
    const folders = loadFileFolders();
    const found = folders.find(f => f._id === id);
    return found ? new FileFolderDoc(found) : null;
  },

  async findByIdAndUpdate(id, updateData, options = {}) {
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
