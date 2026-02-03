const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
// Remove static file serving for Vercel deployment
// app.use(express.static('client/build'));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Helper function to get current time (supports TEST_MODE)
function getCurrentTime(req) {
  if (process.env.TEST_MODE === '1' && req.headers['x-test-now-ms']) {
    return new Date(parseInt(req.headers['x-test-now-ms']));
  }
  return new Date();
}

// Helper function to check if paste is available
function isPasteAvailable(paste, currentTime) {
  // Check TTL
  if (paste.expires_at && currentTime >= paste.expires_at) {
    return false;
  }
  
  // Check view limit
  if (paste.max_views !== null && paste.view_count >= paste.max_views) {
    return false;
  }
  
  return true;
}

// Routes

// Health check
app.get('/api/healthz', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ ok: false });
  }
});

// Create a paste
app.post('/api/pastes', async (req, res) => {
  try {
    const { content, ttl_seconds, max_views } = req.body;
    
    // Validation
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ error: 'Content is required and must be a non-empty string' });
    }
    
    if (ttl_seconds !== undefined && (!Number.isInteger(ttl_seconds) || ttl_seconds < 1)) {
      return res.status(400).json({ error: 'ttl_seconds must be an integer >= 1' });
    }
    
    if (max_views !== undefined && (!Number.isInteger(max_views) || max_views < 1)) {
      return res.status(400).json({ error: 'max_views must be an integer >= 1' });
    }
    
    const id = uuidv4();
    const expires_at = ttl_seconds ? new Date(Date.now() + ttl_seconds * 1000) : null;
    
    const result = await pool.query(
      'INSERT INTO pastes (id, content, expires_at, max_views, view_count, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [id, content, expires_at, max_views, 0, new Date()]
    );
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/p/${id}`;
    
    res.status(201).json({
      id: result.rows[0].id,
      url: url
    });
    
  } catch (error) {
    console.error('Error creating paste:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch a paste (API)
app.get('/api/pastes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentTime = getCurrentTime(req);
    
    const result = await pool.query('SELECT * FROM pastes WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paste not found' });
    }
    
    const paste = result.rows[0];
    
    if (!isPasteAvailable(paste, currentTime)) {
      return res.status(404).json({ error: 'Paste not available' });
    }
    
    // Increment view count
    await pool.query('UPDATE pastes SET view_count = view_count + 1 WHERE id = $1', [id]);
    
    const remaining_views = paste.max_views !== null ? paste.max_views - paste.view_count - 1 : null;
    
    res.json({
      content: paste.content,
      remaining_views: remaining_views,
      expires_at: paste.expires_at
    });
    
  } catch (error) {
    console.error('Error fetching paste:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// View a paste (HTML)
app.get('/p/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentTime = getCurrentTime(req);
    
    const result = await pool.query('SELECT * FROM pastes WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).send(`
        <html>
          <head><title>Paste Not Found</title></head>
          <body>
            <h1>Paste Not Found</h1>
            <p>The requested paste does not exist or has expired.</p>
          </body>
        </html>
      `);
    }
    
    const paste = result.rows[0];
    
    if (!isPasteAvailable(paste, currentTime)) {
      return res.status(404).send(`
        <html>
          <head><title>Paste Not Available</title></head>
          <body>
            <h1>Paste Not Available</h1>
            <p>This paste has expired or reached its view limit.</p>
          </body>
        </html>
      `);
    }
    
    // Increment view count
    await pool.query('UPDATE pastes SET view_count = view_count + 1 WHERE id = $1', [id]);
    
    // Escape HTML to prevent script execution
    const escapeHtml = (text) => {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, m => map[m]);
    };
    
    const escapedContent = escapeHtml(paste.content);
    
    res.send(`
      <html>
        <head>
          <title>Paste View</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .paste-container { 
              border: 1px solid #ddd; 
              padding: 20px; 
              background-color: #f9f9f9; 
              white-space: pre-wrap; 
              word-wrap: break-word;
            }
            .meta { color: #666; margin-bottom: 20px; }
            a { color: #0066cc; }
          </style>
        </head>
        <body>
          <h1>Paste</h1>
          <div class="meta">
            ${paste.max_views ? `<p>Views remaining: ${Math.max(0, paste.max_views - paste.view_count - 1)}</p>` : ''}
            ${paste.expires_at ? `<p>Expires: ${paste.expires_at.toLocaleString()}</p>` : ''}
          </div>
          <div class="paste-container">${escapedContent}</div>
          <p style="margin-top: 20px;"><a href="/">Create a new paste</a></p>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Error viewing paste:', error);
    res.status(500).send('Internal server error');
  }
});

// Database initialization
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pastes (
        id UUID PRIMARY KEY,
        content TEXT NOT NULL,
        expires_at TIMESTAMP,
        max_views INTEGER,
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Initialize database on startup
initializeDatabase();

// Export for Vercel
module.exports = app;
