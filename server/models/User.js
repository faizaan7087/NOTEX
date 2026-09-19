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

class FileUserDoc {
  constructor(data) {
    Object.assign(this, data);
  }

  async matchPassword(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  }

  toJSON() {
    const obj = { ...this };
    return obj;
  }
}

const UserProxy = {
  // Check if mongo is active
  async create(userData) {
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
    if (dbConfig.isMongo) {
      return await MongoUser.findById(id);
    }
    const users = loadFileUsers();
    const found = users.find(u => u._id === id);
    return found ? new FileUserDoc(found) : null;
  },

  async findByIdAndUpdate(id, updateData, options = {}) {
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
    if (dbConfig.isMongo) {
      return await MongoUser.countDocuments();
    }
    return loadFileUsers().length;
  }
};

module.exports = UserProxy;
