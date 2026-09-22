const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cloudflareD1 = require('../services/cloudflareD1Service');

let isConnectedToMongo = false;
let isConnectedToD1 = false;

const connectDB = async () => {
  cloudflareD1.reloadConfig();
  // 1. Check if Cloudflare D1 is configured
  if (cloudflareD1.isConfigured) {
    console.log('[NOTEX DB] Cloudflare D1 credentials detected. Connecting to Cloudflare D1...');
    try {
      const isAlive = await cloudflareD1.testConnection();
      if (isAlive) {
        await cloudflareD1.initD1Tables();
        isConnectedToD1 = true;
        console.log('[NOTEX DB] 🚀 Connected to Cloudflare D1 (5 GB Free Serverless Database)');
        return;
      } else {
        console.warn('[NOTEX DB] Cloudflare D1 connection test did not succeed. Checking fallback options...');
      }
    } catch (d1Err) {
      console.warn(`[NOTEX DB] Cloudflare D1 initialization error: ${d1Err.message}`);
    }
  }

  // 2. Check MongoDB
  const uri = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/notex_db';
  
  try {
    // Attempt Mongoose connection with a short timeout for quick fallback if local server isn't running
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnectedToMongo = true;
    console.log(`[NOTEX DB] Connected to MongoDB: ${conn.connection.host}`);
  } catch (error) {
    isConnectedToMongo = false;
    console.warn(`[NOTEX DB] MongoDB connection not available (${error.message}).`);
    console.log(`[NOTEX DB] Initializing persistent local file database fallback in /server/data/...`);
    
    // Ensure data directory exists
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }
};

const getDBStatus = () => {
  if (isConnectedToD1) {
    return {
      type: 'cloudflare_d1',
      provider: 'Cloudflare D1 (Serverless SQLite)',
      storageLimit: '5 GB Free Tier',
      connected: true,
      mongoConnected: false,
      d1Connected: true
    };
  }

  return {
    type: isConnectedToMongo ? 'mongodb' : 'persistent_file_store',
    provider: isConnectedToMongo ? 'MongoDB' : 'Local JSON File Store',
    connected: true,
    mongoConnected: isConnectedToMongo,
    d1Connected: false
  };
};

module.exports = {
  connectDB,
  getDBStatus,
  get isMongo() {
    return isConnectedToMongo;
  },
  get isD1() {
    return isConnectedToD1;
  }
};

