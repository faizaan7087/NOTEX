const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dbConfig = require('../config/db');

// --- Mongoose Schema ---
const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    folderId: {
      type: String,
      default: null,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please provide a note title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    subject: {
      type: String,
      required: [true, 'Please provide a subject/course name'],
      trim: true,
      maxlength: [100, 'Subject cannot exceed 100 characters']
    },
    content: {
      type: String,
      default: ''
    },
    tags: {
      type: [String],
      default: []
    },
    isFavorite: {
      type: Boolean,
      default: false
    },
    chatGptUrl: {
      type: String,
      default: '',
      trim: true
    },
    color: {
      type: String,
      default: 'indigo'
    },
    attachments: [
      {
        id: String,
        name: String,
        type: String,
        size: Number,
        data: String,
        driveViewLink: String,
        driveDownloadLink: String,
        driveFileId: String,
        uploadedAt: String
      }
    ]
  },
  {
    timestamps: true
  }
);

// Add text search index for MongoDB
noteSchema.index({ title: 'text', content: 'text', subject: 'text' });

const MongoNote = mongoose.model('Note', noteSchema);

// --- Persistent File Store Fallback ---
const NOTES_FILE = path.join(__dirname, '..', 'data', 'notes.json');

const loadFileNotes = () => {
  try {
    if (!fs.existsSync(NOTES_FILE)) {
      fs.writeFileSync(NOTES_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(NOTES_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
};

const saveFileNotes = (notes) => {
  const dataDir = path.dirname(NOTES_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
};

const cloudflareD1 = require('../services/cloudflareD1Service');

class FileNoteDoc {
  constructor(data) {
    Object.assign(this, data);
    if (!this._id && this.id) {
      this._id = this.id;
    }
    // Ensure tags and attachments are parsed if returned as strings from SQL
    if (typeof this.tags === 'string') {
      try {
        this.tags = JSON.parse(this.tags);
      } catch (e) {
        this.tags = [];
      }
    }
    if (typeof this.attachments === 'string') {
      try {
        this.attachments = JSON.parse(this.attachments);
      } catch (e) {
        this.attachments = [];
      }
    }
    this.isFavorite = Boolean(this.isFavorite);
  }

  toJSON() {
    return { ...this };
  }
}

const NoteProxy = {
  async create(noteData) {
    let tags = [];
    if (Array.isArray(noteData.tags)) {
      tags = noteData.tags.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof noteData.tags === 'string') {
      tags = noteData.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    const attachments = Array.isArray(noteData.attachments) ? noteData.attachments : [];
    const now = new Date().toISOString();
    const noteId = 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const userId = String(noteData.userId);
    const folderId = noteData.folderId ? String(noteData.folderId) : null;
    const title = noteData.title.trim();
    const subject = noteData.subject.trim();
    const content = noteData.content || '';
    const isFavorite = noteData.isFavorite ? 1 : 0;
    const chatGptUrl = noteData.chatGptUrl ? String(noteData.chatGptUrl).trim() : '';
    const color = noteData.color || 'indigo';

    if (dbConfig.isD1) {
      await cloudflareD1.execute(
        `INSERT INTO notes (id, userId, folderId, title, subject, content, tags, isFavorite, chatGptUrl, color, attachments, createdAt, updatedAt)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`,
        [
          noteId,
          userId,
          folderId,
          title,
          subject,
          content,
          JSON.stringify(tags),
          isFavorite,
          chatGptUrl,
          color,
          JSON.stringify(attachments),
          now,
          now
        ]
      );

      return new FileNoteDoc({
        id: noteId,
        _id: noteId,
        userId,
        folderId,
        title,
        subject,
        content,
        tags,
        isFavorite: Boolean(isFavorite),
        chatGptUrl,
        color,
        attachments,
        createdAt: now,
        updatedAt: now
      });
    }

    if (dbConfig.isMongo) {
      return await MongoNote.create(noteData);
    }
    const notes = loadFileNotes();

    const newNote = {
      _id: noteId,
      userId,
      folderId,
      title,
      subject,
      content,
      tags,
      isFavorite: Boolean(isFavorite),
      chatGptUrl,
      color,
      attachments,
      createdAt: now,
      updatedAt: now
    };

    notes.unshift(newNote);
    saveFileNotes(notes);
    return new FileNoteDoc(newNote);
  },

  async find(query = {}, sort = { updatedAt: -1 }) {
    if (dbConfig.isD1) {
      let sql = 'SELECT * FROM notes WHERE 1=1';
      const params = [];
      let paramIdx = 1;

      if (query.userId) {
        sql += ` AND userId = ?${paramIdx++}`;
        params.push(String(query.userId));
      }

      if (query.folderId !== undefined) {
        if (query.folderId === null || query.folderId === 'root') {
          sql += ` AND (folderId IS NULL OR folderId = '')`;
        } else {
          sql += ` AND folderId = ?${paramIdx++}`;
          params.push(String(query.folderId));
        }
      }

      if (query.subject && query.subject !== 'all') {
        sql += ` AND LOWER(subject) = LOWER(?${paramIdx++})`;
        params.push(query.subject);
      }

      if (query.isFavorite !== undefined) {
        sql += ` AND isFavorite = ?${paramIdx++}`;
        params.push(query.isFavorite ? 1 : 0);
      }

      if (query.search) {
        const searchTerm = `%${query.search.toLowerCase()}%`;
        sql += ` AND (LOWER(title) LIKE ?${paramIdx} OR LOWER(subject) LIKE ?${paramIdx} OR LOWER(content) LIKE ?${paramIdx} OR LOWER(tags) LIKE ?${paramIdx})`;
        params.push(searchTerm);
        paramIdx++;
      }

      if (query.tag) {
        const tagTerm = `%${query.tag.toLowerCase()}%`;
        sql += ` AND LOWER(tags) LIKE ?${paramIdx++}`;
        params.push(tagTerm);
      }

      sql += ' ORDER BY updatedAt DESC';
      const rows = await cloudflareD1.query(sql, params);
      return rows.map(r => new FileNoteDoc({ ...r, _id: r.id }));
    }

    if (dbConfig.isMongo) {
      return await MongoNote.find(query).sort(sort);
    }
    let notes = loadFileNotes();

    // Filter by userId
    if (query.userId) {
      notes = notes.filter(n => n.userId === String(query.userId));
    }

    // Filter by folderId
    if (query.folderId !== undefined) {
      if (query.folderId === null || query.folderId === 'root') {
        notes = notes.filter(n => !n.folderId);
      } else {
        notes = notes.filter(n => n.folderId === String(query.folderId));
      }
    }

    // Filter by subject
    if (query.subject && query.subject !== 'all') {
      notes = notes.filter(n => n.subject.toLowerCase() === query.subject.toLowerCase());
    }

    // Filter by tag
    if (query.tag) {
      notes = notes.filter(n => n.tags && n.tags.some(t => t.toLowerCase() === query.tag.toLowerCase()));
    }

    // Filter by search keyword
    if (query.search) {
      const q = query.search.toLowerCase();
      notes = notes.filter(n => 
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.subject && n.subject.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q)) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Filter by isFavorite
    if (query.isFavorite !== undefined) {
      notes = notes.filter(n => Boolean(n.isFavorite) === Boolean(query.isFavorite));
    }

    // Sort
    notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return notes.map(n => new FileNoteDoc(n));
  },

  async findById(id) {
    if (dbConfig.isD1) {
      const rows = await cloudflareD1.query('SELECT * FROM notes WHERE id = ?1 LIMIT 1', [id]);
      if (rows && rows.length > 0) {
        return new FileNoteDoc({ ...rows[0], _id: rows[0].id });
      }
      return null;
    }

    if (dbConfig.isMongo) {
      return await MongoNote.findById(id);
    }
    const notes = loadFileNotes();
    const found = notes.find(n => n._id === id);
    return found ? new FileNoteDoc(found) : null;
  },

  async findOne(query) {
    if (dbConfig.isD1) {
      if (query._id && query.userId) {
        const rows = await cloudflareD1.query('SELECT * FROM notes WHERE id = ?1 AND userId = ?2 LIMIT 1', [query._id, String(query.userId)]);
        return rows && rows.length > 0 ? new FileNoteDoc({ ...rows[0], _id: rows[0].id }) : null;
      }
      if (query._id || query.id) {
        const id = query._id || query.id;
        const rows = await cloudflareD1.query('SELECT * FROM notes WHERE id = ?1 LIMIT 1', [id]);
        return rows && rows.length > 0 ? new FileNoteDoc({ ...rows[0], _id: rows[0].id }) : null;
      }
      return null;
    }

    if (dbConfig.isMongo) {
      return await MongoNote.findOne(query);
    }
    const notes = loadFileNotes();
    let found = null;
    if (query._id && query.userId) {
      found = notes.find(n => n._id === query._id && n.userId === String(query.userId));
    } else if (query._id) {
      found = notes.find(n => n._id === query._id);
    }
    return found ? new FileNoteDoc(found) : null;
  },

  async findByIdAndUpdate(id, updateData, options = {}) {
    if (dbConfig.isD1) {
      const existing = await cloudflareD1.query('SELECT * FROM notes WHERE id = ?1 LIMIT 1', [id]);
      if (!existing || existing.length === 0) return null;

      const current = existing[0];
      const now = new Date().toISOString();

      let tags = current.tags;
      if (updateData.tags !== undefined) {
        if (Array.isArray(updateData.tags)) {
          tags = updateData.tags.map(t => String(t).trim()).filter(Boolean);
        } else if (typeof updateData.tags === 'string') {
          tags = updateData.tags.split(',').map(t => t.trim()).filter(Boolean);
        }
      } else if (typeof tags === 'string') {
        try { tags = JSON.parse(tags); } catch(e) { tags = []; }
      }

      let attachments = current.attachments;
      if (updateData.attachments !== undefined) {
        attachments = Array.isArray(updateData.attachments) ? updateData.attachments : [];
      } else if (typeof attachments === 'string') {
        try { attachments = JSON.parse(attachments); } catch(e) { attachments = []; }
      }

      const title = updateData.title !== undefined ? updateData.title.trim() : current.title;
      const subject = updateData.subject !== undefined ? updateData.subject.trim() : current.subject;
      const content = updateData.content !== undefined ? updateData.content : current.content;
      const folderId = updateData.folderId !== undefined ? (updateData.folderId ? String(updateData.folderId) : null) : current.folderId;
      const isFavorite = updateData.isFavorite !== undefined ? (updateData.isFavorite ? 1 : 0) : current.isFavorite;
      const chatGptUrl = updateData.chatGptUrl !== undefined ? String(updateData.chatGptUrl).trim() : current.chatGptUrl;
      const color = updateData.color !== undefined ? updateData.color : current.color;

      await cloudflareD1.execute(
        `UPDATE notes SET title = ?1, subject = ?2, content = ?3, folderId = ?4, isFavorite = ?5, chatGptUrl = ?6, color = ?7, tags = ?8, attachments = ?9, updatedAt = ?10 WHERE id = ?11`,
        [
          title,
          subject,
          content,
          folderId,
          isFavorite,
          chatGptUrl,
          color,
          JSON.stringify(tags),
          JSON.stringify(attachments),
          now,
          id
        ]
      );

      const updated = await cloudflareD1.query('SELECT * FROM notes WHERE id = ?1 LIMIT 1', [id]);
      if (updated && updated.length > 0) {
        return new FileNoteDoc({ ...updated[0], _id: updated[0].id });
      }
      return null;
    }

    if (dbConfig.isMongo) {
      return await MongoNote.findByIdAndUpdate(id, updateData, { new: true, ...options });
    }
    const notes = loadFileNotes();
    const index = notes.findIndex(n => n._id === id);
    if (index === -1) return null;

    let tags = notes[index].tags;
    if (updateData.tags !== undefined) {
      if (Array.isArray(updateData.tags)) {
        tags = updateData.tags.map(t => String(t).trim()).filter(Boolean);
      } else if (typeof updateData.tags === 'string') {
        tags = updateData.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    let attachments = notes[index].attachments || [];
    if (updateData.attachments !== undefined) {
      attachments = Array.isArray(updateData.attachments) ? updateData.attachments : [];
    }

    const updatedNote = {
      ...notes[index],
      ...updateData,
      folderId: updateData.folderId !== undefined ? (updateData.folderId ? String(updateData.folderId) : null) : notes[index].folderId,
      tags: tags,
      attachments: attachments,
      updatedAt: new Date().toISOString()
    };

    notes[index] = updatedNote;
    saveFileNotes(notes);
    return new FileNoteDoc(updatedNote);
  },

  async findByIdAndDelete(id) {
    if (dbConfig.isD1) {
      const existing = await cloudflareD1.query('SELECT * FROM notes WHERE id = ?1 LIMIT 1', [id]);
      if (!existing || existing.length === 0) return null;

      await cloudflareD1.execute('DELETE FROM notes WHERE id = ?1', [id]);
      return new FileNoteDoc({ ...existing[0], _id: existing[0].id });
    }

    if (dbConfig.isMongo) {
      return await MongoNote.findByIdAndDelete(id);
    }
    const notes = loadFileNotes();
    const index = notes.findIndex(n => n._id === id);
    if (index === -1) return null;
    const deleted = notes.splice(index, 1)[0];
    saveFileNotes(notes);
    return new FileNoteDoc(deleted);
  },

  async countDocuments(query = {}) {
    if (dbConfig.isD1) {
      const notes = await this.find(query);
      return notes.length;
    }
    if (dbConfig.isMongo) {
      return await MongoNote.countDocuments(query);
    }
    const notes = await this.find(query);
    return notes.length;
  },

  async getSubjects(userId) {
    if (dbConfig.isD1) {
      const rows = await cloudflareD1.query('SELECT DISTINCT subject FROM notes WHERE userId = ?1', [String(userId)]);
      return (rows || []).map(r => r.subject).filter(Boolean);
    }
    if (dbConfig.isMongo) {
      const distinctSubjects = await MongoNote.distinct('subject', { userId: String(userId) });
      return distinctSubjects;
    }
    const notes = loadFileNotes().filter(n => n.userId === String(userId));
    const set = new Set(notes.map(n => n.subject).filter(Boolean));
    return Array.from(set);
  }
};

module.exports = NoteProxy;

