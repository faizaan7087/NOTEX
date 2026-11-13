const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dbConfig = require('../config/db');

// --- Mongoose Schema ---
const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please provide a reminder title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    dueDate: {
      type: Date,
      required: [true, 'Please provide a due date and time']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    subject: {
      type: String,
      default: '',
      trim: true
    },
    noteId: {
      type: String,
      default: null
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    notified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const MongooseReminder = mongoose.models.Reminder || mongoose.model('Reminder', reminderSchema);

// --- Local JSON File Fallback Helpers ---
const DATA_DIR = path.join(__dirname, '../data');
const REMINDERS_FILE = path.join(DATA_DIR, 'reminders.json');

const ensureFileExists = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(REMINDERS_FILE)) {
    fs.writeFileSync(REMINDERS_FILE, '[]', 'utf8');
  }
};

const getFileReminders = () => {
  try {
    ensureFileExists();
    const data = fs.readFileSync(REMINDERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('[Reminder Local DB] Error reading file:', err);
    return [];
  }
};

const saveFileReminders = (reminders) => {
  try {
    ensureFileExists();
    fs.writeFileSync(REMINDERS_FILE, JSON.stringify(reminders, null, 2), 'utf8');
  } catch (err) {
    console.error('[Reminder Local DB] Error saving file:', err);
  }
};

class FileReminderDoc {
  constructor(data) {
    Object.assign(this, data);
    this._id = data._id || data.id;
    this.id = this._id;
  }

  async save() {
    return this;
  }
}

// --- D1 & Local File Compatible Adapter ---
const FileReminder = {
  async create(reminderData) {
    const { userId, title, description = '', dueDate, priority = 'medium', subject = '', noteId = null } = reminderData;
    const now = new Date().toISOString();
    const reminderId = `rem_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
    const dueIso = new Date(dueDate).toISOString();

    if (dbConfig.isD1) {
      const d1 = require('../services/cloudflareD1Service');
      const sql = `INSERT INTO reminders (id, userId, title, description, dueDate, priority, subject, noteId, isCompleted, notified, createdAt, updatedAt)
                   VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 0, 0, ?9, ?10)`;
      await d1.execute(sql, [
        reminderId,
        String(userId),
        title.trim(),
        description.trim(),
        dueIso,
        priority,
        subject.trim(),
        noteId || null,
        now,
        now
      ]);

      return new FileReminderDoc({
        id: reminderId,
        _id: reminderId,
        userId: String(userId),
        title: title.trim(),
        description: description.trim(),
        dueDate: dueIso,
        priority,
        subject: subject.trim(),
        noteId,
        isCompleted: false,
        notified: false,
        createdAt: now,
        updatedAt: now
      });
    }

    const reminders = getFileReminders();
    const newReminder = {
      _id: reminderId,
      id: reminderId,
      userId: String(userId),
      title: title.trim(),
      description: description.trim(),
      dueDate: dueIso,
      priority,
      subject: subject.trim(),
      noteId,
      isCompleted: false,
      notified: false,
      createdAt: now,
      updatedAt: now
    };

    reminders.unshift(newReminder);
    saveFileReminders(reminders);
    return new FileReminderDoc(newReminder);
  },

  async find(query = {}, sort = { dueDate: 1 }) {
    if (dbConfig.isD1) {
      let sql = 'SELECT * FROM reminders WHERE 1=1';
      const params = [];
      let paramIdx = 1;

      if (query.userId) {
        sql += ` AND userId = ?${paramIdx++}`;
        params.push(String(query.userId));
      }

      if (query.isCompleted !== undefined) {
        sql += ` AND isCompleted = ?${paramIdx++}`;
        params.push(query.isCompleted ? 1 : 0);
      }

      if (query.priority) {
        sql += ` AND priority = ?${paramIdx++}`;
        params.push(query.priority);
      }

      sql += ' ORDER BY dueDate ASC';

      const d1 = require('../services/cloudflareD1Service');
      const rows = await d1.query(sql, params);
      return (rows || []).map(r => new FileReminderDoc({
        ...r,
        _id: r.id,
        isCompleted: Boolean(r.isCompleted),
        notified: Boolean(r.notified)
      }));
    }

    let reminders = getFileReminders();
    if (query.userId) {
      reminders = reminders.filter(r => String(r.userId) === String(query.userId));
    }
    if (query.isCompleted !== undefined) {
      reminders = reminders.filter(r => Boolean(r.isCompleted) === Boolean(query.isCompleted));
    }
    if (query.priority) {
      reminders = reminders.filter(r => r.priority === query.priority);
    }

    reminders.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    return reminders.map(r => new FileReminderDoc(r));
  },

  async findById(id) {
    if (dbConfig.isD1) {
      const d1 = require('../services/cloudflareD1Service');
      const rows = await d1.query('SELECT * FROM reminders WHERE id = ?1 LIMIT 1', [String(id)]);
      if (rows && rows.length > 0) {
        const r = rows[0];
        return new FileReminderDoc({
          ...r,
          _id: r.id,
          isCompleted: Boolean(r.isCompleted),
          notified: Boolean(r.notified)
        });
      }
      return null;
    }

    const reminders = getFileReminders();
    const item = reminders.find(r => r.id === id || r._id === id);
    return item ? new FileReminderDoc(item) : null;
  },

  async findByIdAndUpdate(id, updateData) {
    const now = new Date().toISOString();

    if (dbConfig.isD1) {
      const d1 = require('../services/cloudflareD1Service');
      const current = await this.findById(id);
      if (!current) return null;

      const title = updateData.title !== undefined ? updateData.title.trim() : current.title;
      const description = updateData.description !== undefined ? updateData.description.trim() : current.description;
      const dueDate = updateData.dueDate !== undefined ? new Date(updateData.dueDate).toISOString() : current.dueDate;
      const priority = updateData.priority !== undefined ? updateData.priority : current.priority;
      const subject = updateData.subject !== undefined ? updateData.subject : current.subject;
      const isCompleted = updateData.isCompleted !== undefined ? (updateData.isCompleted ? 1 : 0) : (current.isCompleted ? 1 : 0);
      const notified = updateData.notified !== undefined ? (updateData.notified ? 1 : 0) : (current.notified ? 1 : 0);

      const sql = `UPDATE reminders SET title = ?1, description = ?2, dueDate = ?3, priority = ?4, subject = ?5, isCompleted = ?6, notified = ?7, updatedAt = ?8 WHERE id = ?9`;
      await d1.execute(sql, [title, description, dueDate, priority, subject, isCompleted, notified, now, String(id)]);

      return new FileReminderDoc({
        ...current,
        title,
        description,
        dueDate,
        priority,
        subject,
        isCompleted: Boolean(isCompleted),
        notified: Boolean(notified),
        updatedAt: now
      });
    }

    const reminders = getFileReminders();
    const index = reminders.findIndex(r => r.id === id || r._id === id);
    if (index === -1) return null;

    reminders[index] = {
      ...reminders[index],
      ...updateData,
      updatedAt: now
    };
    saveFileReminders(reminders);
    return new FileReminderDoc(reminders[index]);
  },

  async findByIdAndDelete(id) {
    if (dbConfig.isD1) {
      const d1 = require('../services/cloudflareD1Service');
      const item = await this.findById(id);
      if (!item) return null;
      await d1.execute('DELETE FROM reminders WHERE id = ?1', [String(id)]);
      return item;
    }

    let reminders = getFileReminders();
    const item = reminders.find(r => r.id === id || r._id === id);
    if (!item) return null;

    reminders = reminders.filter(r => r.id !== id && r._id !== id);
    saveFileReminders(reminders);
    return new FileReminderDoc(item);
  }
};

const Reminder = {
  create: async (data) => (dbConfig.isMongo ? MongooseReminder.create(data) : FileReminder.create(data)),
  find: async (query, sort) => (dbConfig.isMongo ? MongooseReminder.find(query).sort(sort) : FileReminder.find(query, sort)),
  findById: async (id) => (dbConfig.isMongo ? MongooseReminder.findById(id) : FileReminder.findById(id)),
  findByIdAndUpdate: async (id, data, options) => (dbConfig.isMongo ? MongooseReminder.findByIdAndUpdate(id, data, { new: true, ...options }) : FileReminder.findByIdAndUpdate(id, data)),
  findByIdAndDelete: async (id) => (dbConfig.isMongo ? MongooseReminder.findByIdAndDelete(id) : FileReminder.findByIdAndDelete(id))
};

module.exports = Reminder;
