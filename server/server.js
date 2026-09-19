const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB, getDBStatus } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { APP_CONFIG, APP_NAME } = require('./config/constants');

// Load environment variables
dotenv.config();

// Connect to Database (with automatic local file fallback)
connectDB();

const app = express();

// Global Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API Health Check & System Info
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    application: APP_CONFIG.FULL_NAME,
    appName: APP_NAME,
    version: APP_CONFIG.VERSION,
    timestamp: new Date().toISOString(),
    database: getDBStatus()
  });
});

// Mount Routes (supporting both /api/path and /path)
const authRouter = require('./routes/authRoutes');
const folderRouter = require('./routes/folderRoutes');
const noteRouter = require('./routes/noteRoutes');
const shareRouter = require('./routes/shareRoutes');
const xmlRouter = require('./routes/xmlRoutes');

app.use(['/api/auth', '/auth'], authRouter);
app.use(['/api/folders', '/folders'], folderRouter);
app.use(['/api/notes', '/notes'], noteRouter);
app.use(['/api/share', '/share'], shareRouter);
app.use(['/api/xml', '/xml'], xmlRouter);

// Standalone subjects endpoint
app.get(['/api/subjects', '/subjects'], require('./middleware/authMiddleware').protect, require('./controllers/noteController').getSubjects);

// Root route for direct browser inspection
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>NOTEX Backend REST API</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }
          .card { background: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #334155; max-width: 600px; margin: 0 auto; }
          h1 { color: #6366f1; margin-top: 0; }
          code { background: #0f172a; color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
          .badge { display: inline-block; background: #10b981; color: #022c22; font-weight: bold; padding: 4px 10px; border-radius: 9999px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>NOTEX Server API</h1>
          <p><span class="badge">ONLINE &amp; RUNNING</span></p>
          <p>Student Notes Management System REST API is live.</p>
          <ul>
            <li>Health Check: <code>/api/health</code></li>
            <li>Auth Endpoints: <code>/api/auth/register</code>, <code>/api/auth/login</code></li>
            <li>Notes CRUD: <code>/api/notes</code></li>
            <li>XML Export: <code>/api/notes/export/xml</code></li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`🚀 NOTEX Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`📚 API Health: http://localhost:${PORT}/api/health`);
    console.log(`=============================================`);
  });
}

module.exports = app;
