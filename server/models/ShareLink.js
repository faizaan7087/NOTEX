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

const cloudflareD1 = require('../services/cloudflareD1Service');

class FileShareDoc {
  constructor(data) {
    Object.assign(this, data);
    if (!this._id && this.id) {
      this._id = this.id;
    }
    if (typeof this.snapshotData === 'string') {
      try {
        this.snapshotData = JSON.parse(this.snapshotData);
      } catch (e) {
        this.snapshotData = {};
      }
    }
  }

  toJSON() {
    return { ...this };
  }
}

const ShareLinkProxy = {
  async create(shareData) {
    const now = new Date().toISOString();
    const shareId = 'share_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const expiresAt = new Date(shareData.expiresAt).toISOString();
    const snapshotData = shareData.snapshotData || {};

    if (dbConfig.isD1) {
      await cloudflareD1.execute(
        `INSERT INTO share_links (id, shareCode, userId, authorName, authorCollege, authorEmail, folderName, totalNotes, totalSubfolders, snapshotData, expiresAt, createdAt, updatedAt)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`,
        [
          shareId,
          shareData.shareCode,
          String(shareData.userId),
          shareData.authorName,
          shareData.authorCollege || '',
          shareData.authorEmail || '',
          shareData.folderName,
          shareData.totalNotes || 0,
          shareData.totalSubfolders || 0,
          JSON.stringify(snapshotData),
          expiresAt,
          now,
          now
        ]
      );

      return new FileShareDoc({
        id: shareId,
        _id: shareId,
        shareCode: shareData.shareCode,
        userId: String(shareData.userId),
        authorName: shareData.authorName,
        authorCollege: shareData.authorCollege || '',
        authorEmail: shareData.authorEmail || '',
        folderName: shareData.folderName,
        totalNotes: shareData.totalNotes || 0,
        totalSubfolders: shareData.totalSubfolders || 0,
        snapshotData,
        expiresAt,
        createdAt: now,
        updatedAt: now
      });
    }

    if (dbConfig.isMongo) {
      return await MongoShareLink.create(shareData);
    }
    const shares = loadFileShares();

    const newShare = {
      _id: shareId,
      shareCode: shareData.shareCode,
      userId: String(shareData.userId),
      authorName: shareData.authorName,
      authorCollege: shareData.authorCollege || '',
      authorEmail: shareData.authorEmail || '',
      folderName: shareData.folderName,
      totalNotes: shareData.totalNotes || 0,
      totalSubfolders: shareData.totalSubfolders || 0,
      snapshotData: snapshotData,
      expiresAt: expiresAt,
      createdAt: now,
      updatedAt: now
    };

    shares.push(newShare);
    saveFileShares(shares);
    return new FileShareDoc(newShare);
  },

  async findOne(query) {
    if (dbConfig.isD1) {
      let rows = [];
      if (query.shareCode) {
        rows = await cloudflareD1.query('SELECT * FROM share_links WHERE shareCode = ?1 LIMIT 1', [query.shareCode]);
      } else if (query._id || query.id) {
        const id = query._id || query.id;
        rows = await cloudflareD1.query('SELECT * FROM share_links WHERE id = ?1 LIMIT 1', [id]);
      }
      return rows && rows.length > 0 ? new FileShareDoc({ ...rows[0], _id: rows[0].id }) : null;
    }

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
    if (dbConfig.isD1) {
      let sql = 'SELECT * FROM share_links WHERE 1=1';
      const params = [];
      if (query.userId) {
        sql += ' AND userId = ?1';
        params.push(String(query.userId));
      }
      sql += ' ORDER BY createdAt DESC';
      const rows = await cloudflareD1.query(sql, params);
      return rows.map(r => new FileShareDoc({ ...r, _id: r.id }));
    }

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
    if (dbConfig.isD1) {
      const existing = await cloudflareD1.query('SELECT * FROM share_links WHERE id = ?1 LIMIT 1', [id]);
      if (!existing || existing.length === 0) return null;

      await cloudflareD1.execute('DELETE FROM share_links WHERE id = ?1', [id]);
      return new FileShareDoc({ ...existing[0], _id: existing[0].id });
    }

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

