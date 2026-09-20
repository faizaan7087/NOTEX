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

class FileNoteDoc {
  constructor(data) {
    Object.assign(this, data);
  }

  toJSON() {
    return { ...this };
  }
}

const NoteProxy = {
  async create(noteData) {
    if (dbConfig.isMongo) {
      return await MongoNote.create(noteData);
    }
    const notes = loadFileNotes();
    const now = new Date().toISOString();
    
    // Clean and normalize tags
    let tags = [];
    if (Array.isArray(noteData.tags)) {
      tags = noteData.tags.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof noteData.tags === 'string') {
      tags = noteData.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    const newNote = {
      _id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      userId: String(noteData.userId),
      folderId: noteData.folderId ? String(noteData.folderId) : null,
      title: noteData.title.trim(),
      subject: noteData.subject.trim(),
      content: noteData.content || '',
      tags: tags,
      isFavorite: Boolean(noteData.isFavorite),
      chatGptUrl: noteData.chatGptUrl ? String(noteData.chatGptUrl).trim() : '',
      color: noteData.color || 'indigo',
      attachments: Array.isArray(noteData.attachments) ? noteData.attachments : [],
      createdAt: now,
      updatedAt: now
    };

    notes.unshift(newNote);
    saveFileNotes(notes);
    return new FileNoteDoc(newNote);
  },

  async find(query = {}, sort = { updatedAt: -1 }) {
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
    if (dbConfig.isMongo) {
      return await MongoNote.findById(id);
    }
    const notes = loadFileNotes();
    const found = notes.find(n => n._id === id);
    return found ? new FileNoteDoc(found) : null;
  },

  async findOne(query) {
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
    if (dbConfig.isMongo) {
      return await MongoNote.countDocuments(query);
    }
    const notes = await this.find(query);
    return notes.length;
  },

  async getSubjects(userId) {
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
