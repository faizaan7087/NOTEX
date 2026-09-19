const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dbConfig = require('../config/db');

// --- Mongoose Schema ---
const shareLinkSchema = new mongoose.Schema(
  {
    shareCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    authorName: {
      type: String,
      required: true
    },
    authorCollege: {
      type: String,
      default: ''
    },
    authorEmail: {
      type: String,
      default: ''
    },
    folderName: {
      type: String,
      required: true
    },
    totalNotes: {
      type: Number,
      default: 0
    },
    totalSubfolders: {
      type: Number,
      default: 0
    },
    snapshotData: {
      rootFolder: Object,
      subfolders: Array,
      notes: Array
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

const MongoShareLink = mongoose.model('ShareLink', shareLinkSchema);

// --- Persistent File Store Fallback ---
const SHARES_FILE = path.join(__dirname, '..', 'data', 'share_links.json');

const loadFileShares = () => {
  try {
    if (!fs.existsSync(SHARES_FILE)) {
      fs.writeFileSync(SHARES_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(SHARES_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
};

const saveFileShares = (shares) => {
  const dataDir = path.dirname(SHARES_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(SHARES_FILE, JSON.stringify(shares, null, 2));
};

class FileShareDoc {
  constructor(data) {
    Object.assign(this, data);
  }

  toJSON() {
    return { ...this };
  }
}

const ShareLinkProxy = {
  async create(shareData) {
    if (dbConfig.isMongo) {
      return await MongoShareLink.create(shareData);
    }
    const shares = loadFileShares();
    const now = new Date().toISOString();

    const newShare = {
      _id: 'share_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      shareCode: shareData.shareCode,
      userId: String(shareData.userId),
      authorName: shareData.authorName,
      authorCollege: shareData.authorCollege || '',
      authorEmail: shareData.authorEmail || '',
      folderName: shareData.folderName,
      totalNotes: shareData.totalNotes || 0,
      totalSubfolders: shareData.totalSubfolders || 0,
      snapshotData: shareData.snapshotData || {},
      expiresAt: new Date(shareData.expiresAt).toISOString(),
      createdAt: now,
      updatedAt: now
    };

    shares.push(newShare);
    saveFileShares(shares);
    return new FileShareDoc(newShare);
  },

  async findOne(query) {
    if (dbConfig.isMongo) {
      return await MongoShareLink.findOne(query);
    }
    const shares = loadFileShares();
    let found = null;
    if (query.shareCode) {
      found = shares.find(s => s.shareCode === query.shareCode);
    } else if (query._id) {
      found = shares.find(s => s._id === query._id);
    }
    return found ? new FileShareDoc(found) : null;
  },

  async find(query = {}) {
    if (dbConfig.isMongo) {
      return await MongoShareLink.find(query);
    }
    let shares = loadFileShares();
    if (query.userId) {
      shares = shares.filter(s => s.userId === String(query.userId));
    }
    return shares.map(s => new FileShareDoc(s));
  },

  async findByIdAndDelete(id) {
    if (dbConfig.isMongo) {
      return await MongoShareLink.findByIdAndDelete(id);
    }
    const shares = loadFileShares();
    const index = shares.findIndex(s => s._id === id);
    if (index === -1) return null;
    const deleted = shares.splice(index, 1)[0];
    saveFileShares(shares);
    return new FileShareDoc(deleted);
  }
};

module.exports = ShareLinkProxy;
