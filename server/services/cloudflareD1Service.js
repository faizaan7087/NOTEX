/**
 * Cloudflare D1 Database Service
 * Connects directly to Cloudflare D1 serverless SQL database via Cloudflare REST API.
 * Free tier provides 5 GB storage with zero maintenance.
 */

class CloudflareD1Service {
  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
    this.databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID || '';
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN || '';
    this.isConfigured = Boolean(this.accountId && this.databaseId && this.apiToken);
  }

  reloadConfig() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
    this.databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID || '';
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN || '';
    this.isConfigured = Boolean(this.accountId && this.databaseId && this.apiToken);
  }

  getEndpoint() {
    return `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;
  }

  /**
   * Execute a single SQL statement with parameters
   * @param {string} sql - SQL query string with ?1, ?2 or ? parameter placeholders
   * @param {Array} params - Array of parameters
   * @returns {Promise<Array>} Array of rows
   */
  async query(sql, params = []) {
    if (!this.isConfigured) {
      throw new Error('[Cloudflare D1] Missing credentials. Please set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_API_TOKEN.');
    }

    try {
      const response = await fetch(this.getEndpoint(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql,
          params
        })
      });

      const data = await response.json();

      if (!data.success) {
        const errorMsg = data.errors && data.errors.length > 0 
          ? data.errors.map(e => e.message).join(', ') 
          : 'Unknown Cloudflare D1 API error';
        throw new Error(`[Cloudflare D1 Query Error]: ${errorMsg}`);
      }

      // D1 query response returns results in data.result[0].results
      if (data.result && data.result.length > 0) {
        return data.result[0].results || [];
      }
      return [];
    } catch (err) {
      console.error('[Cloudflare D1 Error]:', err.message);
      throw err;
    }
  }

  /**
   * Execute an INSERT/UPDATE/DELETE statement and return mutation metadata
   * @param {string} sql 
   * @param {Array} params 
   */
  async execute(sql, params = []) {
    if (!this.isConfigured) {
      throw new Error('[Cloudflare D1] Missing credentials.');
    }

    try {
      const response = await fetch(this.getEndpoint(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql,
          params
        })
      });

      const data = await response.json();

      if (!data.success) {
        const errorMsg = data.errors && data.errors.length > 0 
          ? data.errors.map(e => e.message).join(', ') 
          : 'Unknown Cloudflare D1 API error';
        throw new Error(`[Cloudflare D1 Execute Error]: ${errorMsg}`);
      }

      const meta = (data.result && data.result[0] && data.result[0].meta) || {};
      return {
        success: true,
        changes: meta.changes || 0,
        lastRowId: meta.last_row_id || null
      };
    } catch (err) {
      console.error('[Cloudflare D1 Execute Error]:', err.message);
      throw err;
    }
  }

  /**
   * Run schema migrations to auto-create NOTEX tables in D1
   */
  async initD1Tables() {
    console.log('[Cloudflare D1] Verifying and initializing database tables...');

    const schemaQueries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        googleId TEXT,
        avatar TEXT DEFAULT '',
        googleAccessToken TEXT DEFAULT '',
        googleRefreshToken TEXT DEFAULT '',
        driveRootFolderId TEXT DEFAULT '',
        college TEXT DEFAULT '',
        semester TEXT DEFAULT '',
        location TEXT DEFAULT '',
        bio TEXT DEFAULT '',
        isProfileCompleted INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );`,

      // Folders table
      `CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        parentId TEXT DEFAULT NULL,
        color TEXT DEFAULT 'indigo',
        icon TEXT DEFAULT 'Folder',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );`,

      // Notes table
      `CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        folderId TEXT DEFAULT NULL,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        content TEXT DEFAULT '',
        tags TEXT DEFAULT '[]',
        isFavorite INTEGER DEFAULT 0,
        chatGptUrl TEXT DEFAULT '',
        color TEXT DEFAULT 'indigo',
        attachments TEXT DEFAULT '[]',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );`,

      // Share links table
      `CREATE TABLE IF NOT EXISTS share_links (
        id TEXT PRIMARY KEY,
        shareCode TEXT UNIQUE NOT NULL,
        userId TEXT NOT NULL,
        authorName TEXT NOT NULL,
        authorCollege TEXT DEFAULT '',
        authorEmail TEXT DEFAULT '',
        folderName TEXT NOT NULL,
        totalNotes INTEGER DEFAULT 0,
        totalSubfolders INTEGER DEFAULT 0,
        snapshotData TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );`,

      // Indexes for fast querying
      `CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(userId);`,
      `CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parentId);`,
      `CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(userId);`,
      `CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folderId);`,
      `CREATE INDEX IF NOT EXISTS idx_notes_subject ON notes(subject);`,
      `CREATE INDEX IF NOT EXISTS idx_share_code ON share_links(shareCode);`
    ];

    for (const sql of schemaQueries) {
      await this.execute(sql);
    }

    console.log('[Cloudflare D1] ✅ Database tables & indexes verified successfully.');
    return true;
  }

  /**
   * Test connection to Cloudflare D1
   */
  async testConnection() {
    this.reloadConfig();
    if (!this.isConfigured) return false;
    try {
      const rows = await this.query('SELECT 1 as connected;');
      return rows && rows.length > 0 && rows[0].connected === 1;
    } catch (e) {
      console.warn(`[Cloudflare D1 Test Connection Failed]: ${e.message}`);
      return false;
    }
  }
}

const cloudflareD1Service = new CloudflareD1Service();
module.exports = cloudflareD1Service;
