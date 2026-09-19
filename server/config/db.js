const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isConnectedToMongo = false;

const connectDB = async () => {
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
  return {
    type: isConnectedToMongo ? 'mongodb' : 'persistent_file_store',
    connected: true,
    mongoConnected: isConnectedToMongo
  };
};

module.exports = {
  connectDB,
  getDBStatus,
  get isMongo() {
    return isConnectedToMongo;
  }
};
