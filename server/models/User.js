const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const dbConfig = require('../config/db');

// --- Mongoose Schema ---
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: [6, 'Password must be at least 6 characters']
    },
    googleId: {
      type: String,
      sparse: true
    },
    avatar: {
      type: String,
      default: ''
    },
    googleAccessToken: {
      type: String,
      default: ''
    },
    googleRefreshToken: {
      type: String,
      default: ''
    },
    driveRootFolderId: {
      type: String,
      default: ''
    },
    college: {
      type: String,
      default: ''
    },
    semester: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    isProfileCompleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const MongoUser = mongoose.model('User', userSchema);

// --- Persistent File Store Fallback (for zero-dependency local dev/eval) ---
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

const loadFileUsers = () => {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
};

const saveFileUsers = (users) => {
  const dataDir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

const cloudflareD1 = require('../services/cloudflareD1Service');

class FileUserDoc {
  constructor(data) {
    Object.assign(this, data);
    if (!this._id && this.id) {
      this._id = this.id;
    }
  }

  async matchPassword(enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
  }

  toJSON() {
    const obj = { ...this };
    return obj;
  }
}

const UserProxy = {
  async create(userData) {
    if (dbConfig.isD1) {
      const existing = await cloudflareD1.query('SELECT id FROM users WHERE LOWER(email) = ?1 LIMIT 1', [userData.email.toLowerCase().trim()]);
      if (existing && existing.length > 0) {
        const err = new Error('User already exists with this email');
        err.code = 11000;
        throw err;
      }
      let hashedPassword = '';
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(userData.password, salt);
      }
      const now = new Date().toISOString();
      const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      const userRecord = {
        id: userId,
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim(),
        password: hashedPassword,
        googleId: userData.googleId || '',
        avatar: userData.avatar || '',
        googleAccessToken: userData.googleAccessToken || '',
        googleRefreshToken: userData.googleRefreshToken || '',
        driveRootFolderId: userData.driveRootFolderId || '',
        college: userData.college || '',
        semester: userData.semester || '',
        location: userData.location || '',
        bio: userData.bio || '',
        isProfileCompleted: userData.isProfileCompleted ? 1 : 0,
        createdAt: now,
        updatedAt: now
      };

      await cloudflareD1.execute(
        `INSERT INTO users (id, name, email, password, googleId, avatar, googleAccessToken, googleRefreshToken, driveRootFolderId, college, semester, location, bio, isProfileCompleted, createdAt, updatedAt)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)`,
        [
          userRecord.id,
          userRecord.name,
          userRecord.email,
          userRecord.password,
          userRecord.googleId,
          userRecord.avatar,
          userRecord.googleAccessToken,
          userRecord.googleRefreshToken,
          userRecord.driveRootFolderId,
          userRecord.college,
          userRecord.semester,
          userRecord.location,
          userRecord.bio,
          userRecord.isProfileCompleted,
          userRecord.createdAt,
          userRecord.updatedAt
        ]
      );

      return new FileUserDoc({ ...userRecord, _id: userId, isProfileCompleted: Boolean(userRecord.isProfileCompleted) });
    }

    if (dbConfig.isMongo) {
      return await MongoUser.create(userData);
    }
    const users = loadFileUsers();
    const existing = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existing) {
      const err = new Error('User already exists with this email');
      err.code = 11000;
      throw err;
    }
    let hashedPassword = '';
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(userData.password, salt);
    }
    const now = new Date().toISOString();
    const newUser = {
      _id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password: hashedPassword,
      googleId: userData.googleId || null,
      avatar: userData.avatar || '',
      googleAccessToken: userData.googleAccessToken || '',
      googleRefreshToken: userData.googleRefreshToken || '',
      driveRootFolderId: userData.driveRootFolderId || '',
      college: userData.college || '',
      semester: userData.semester || '',
      location: userData.location || '',
      bio: userData.bio || '',
      isProfileCompleted: userData.isProfileCompleted || false,
      createdAt: now,
      updatedAt: now
    };
    users.push(newUser);
    saveFileUsers(users);
    return new FileUserDoc(newUser);
  },

  async findOne(query) {
    if (dbConfig.isD1) {
      let rows = [];
      if (query.email) {
        rows = await cloudflareD1.query('SELECT * FROM users WHERE LOWER(email) = ?1 LIMIT 1', [query.email.toLowerCase().trim()]);
      } else if (query.googleId) {
        rows = await cloudflareD1.query('SELECT * FROM users WHERE googleId = ?1 LIMIT 1', [query.googleId]);
      } else if (query._id || query.id) {
        const id = query._id || query.id;
        rows = await cloudflareD1.query('SELECT * FROM users WHERE id = ?1 LIMIT 1', [id]);
      }
      if (rows && rows.length > 0) {
        const row = rows[0];
        return new FileUserDoc({ ...row, _id: row.id, isProfileCompleted: Boolean(row.isProfileCompleted) });
      }
      return null;
    }

    if (dbConfig.isMongo) {
      return await MongoUser.findOne(query);
    }
    const users = loadFileUsers();
    let found = null;
    if (query.email) {
      found = users.find(u => u.email.toLowerCase() === query.email.toLowerCase());
    } else if (query.googleId) {
      found = users.find(u => u.googleId === query.googleId);
    } else if (query._id) {
      found = users.find(u => u._id === query._id);
    }
    return found ? new FileUserDoc(found) : null;
  },

  async findById(id) {
    if (dbConfig.isD1) {
      const rows = await cloudflareD1.query('SELECT * FROM users WHERE id = ?1 LIMIT 1', [id]);
      if (rows && rows.length > 0) {
        const row = rows[0];
        return new FileUserDoc({ ...row, _id: row.id, isProfileCompleted: Boolean(row.isProfileCompleted) });
      }
      return null;
    }

    if (dbConfig.isMongo) {
      return await MongoUser.findById(id);
    }
    const users = loadFileUsers();
    const found = users.find(u => u._id === id);
    return found ? new FileUserDoc(found) : null;
  },

  async findByIdAndUpdate(id, updateData, options = {}) {
    if (dbConfig.isD1) {
      const existingRows = await cloudflareD1.query('SELECT * FROM users WHERE id = ?1 LIMIT 1', [id]);
      if (!existingRows || existingRows.length === 0) return null;
      
      const current = existingRows[0];
      const now = new Date().toISOString();
      const fieldsToUpdate = {
        name: updateData.name !== undefined ? updateData.name.trim() : current.name,
        email: updateData.email !== undefined ? updateData.email.toLowerCase().trim() : current.email,
        googleId: updateData.googleId !== undefined ? updateData.googleId : current.googleId,
        avatar: updateData.avatar !== undefined ? updateData.avatar : current.avatar,
        googleAccessToken: updateData.googleAccessToken !== undefined ? updateData.googleAccessToken : current.googleAccessToken,
        googleRefreshToken: updateData.googleRefreshToken !== undefined ? updateData.googleRefreshToken : current.googleRefreshToken,
        driveRootFolderId: updateData.driveRootFolderId !== undefined ? updateData.driveRootFolderId : current.driveRootFolderId,
        college: updateData.college !== undefined ? updateData.college : current.college,
        semester: updateData.semester !== undefined ? updateData.semester : current.semester,
        location: updateData.location !== undefined ? updateData.location : current.location,
        bio: updateData.bio !== undefined ? updateData.bio : current.bio,
        isProfileCompleted: updateData.isProfileCompleted !== undefined ? (updateData.isProfileCompleted ? 1 : 0) : current.isProfileCompleted,
        updatedAt: now
      };

      await cloudflareD1.execute(
        `UPDATE users SET name = ?1, email = ?2, googleId = ?3, avatar = ?4, googleAccessToken = ?5, googleRefreshToken = ?6, driveRootFolderId = ?7, college = ?8, semester = ?9, location = ?10, bio = ?11, isProfileCompleted = ?12, updatedAt = ?13 WHERE id = ?14`,
        [
          fieldsToUpdate.name,
          fieldsToUpdate.email,
          fieldsToUpdate.googleId,
          fieldsToUpdate.avatar,
          fieldsToUpdate.googleAccessToken,
          fieldsToUpdate.googleRefreshToken,
          fieldsToUpdate.driveRootFolderId,
          fieldsToUpdate.college,
          fieldsToUpdate.semester,
          fieldsToUpdate.location,
          fieldsToUpdate.bio,
          fieldsToUpdate.isProfileCompleted,
          fieldsToUpdate.updatedAt,
          id
        ]
      );

      const updatedRows = await cloudflareD1.query('SELECT * FROM users WHERE id = ?1 LIMIT 1', [id]);
      if (updatedRows && updatedRows.length > 0) {
        const u = updatedRows[0];
        return new FileUserDoc({ ...u, _id: u.id, isProfileCompleted: Boolean(u.isProfileCompleted) });
      }
      return null;
    }

    if (dbConfig.isMongo) {
      return await MongoUser.findByIdAndUpdate(id, updateData, options);
    }
    const users = loadFileUsers();
    const index = users.findIndex(u => u._id === id);
    if (index === -1) return null;
    users[index] = {
      ...users[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    saveFileUsers(users);
    return new FileUserDoc(users[index]);
  },

  async countDocuments() {
    if (dbConfig.isD1) {
      const rows = await cloudflareD1.query('SELECT COUNT(*) as cnt FROM users');
      return (rows && rows[0] && rows[0].cnt) || 0;
    }
    if (dbConfig.isMongo) {
      return await MongoUser.countDocuments();
    }
    return loadFileUsers().length;
  }
};

module.exports = UserProxy;

