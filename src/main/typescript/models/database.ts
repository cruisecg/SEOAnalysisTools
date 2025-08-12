import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || './data/seo_analysis.db';

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
const createTables = () => {
  // Tasks table for SEO analysis jobs
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'done', 'failed')),
      requested_url TEXT NOT NULL,
      final_url TEXT,
      overall_score INTEGER,
      grade TEXT CHECK (grade IN ('A', 'B', 'C', 'D', 'E')),
      analysis_data TEXT, -- JSON blob
      error_message TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    )
  `);

  // Rate limiting table
  db.exec(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      ip_address TEXT NOT NULL,
      hour_key TEXT NOT NULL,
      request_count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (ip_address, hour_key)
    )
  `);

  // Analysis cache to avoid re-analyzing same URLs frequently
  db.exec(`
    CREATE TABLE IF NOT EXISTS analysis_cache (
      url_hash TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      task_id TEXT NOT NULL,
      cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    )
  `);

  // Settings table for configurable weights and thresholds
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default settings
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)
  `);

  insertSetting.run('weights.technical', '30', 'Technical foundation weight');
  insertSetting.run('weights.content', '25', 'Content and structure weight');
  insertSetting.run('weights.structured_data', '10', 'Structured data weight');
  insertSetting.run('weights.performance', '25', 'Performance and CWV weight');
  insertSetting.run('weights.social', '10', 'Social markup weight');

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
    CREATE INDEX IF NOT EXISTS idx_rate_limits_hour ON rate_limits(hour_key);
    CREATE INDEX IF NOT EXISTS idx_analysis_cache_url ON analysis_cache(url);
  `);
};

// Initialize database
createTables();

export { db };

// Prepared statements for common operations
export const statements = {
  insertTask: db.prepare(`
    INSERT INTO tasks (id, status, requested_url, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `),
  
  updateTaskStatus: db.prepare(`
    UPDATE tasks SET status = ?, final_url = ?, overall_score = ?, grade = ?, 
                     analysis_data = ?, error_message = ?, completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  
  getTask: db.prepare(`
    SELECT * FROM tasks WHERE id = ?
  `),
  
  getRateLimit: db.prepare(`
    SELECT request_count FROM rate_limits WHERE ip_address = ? AND hour_key = ?
  `),
  
  updateRateLimit: db.prepare(`
    INSERT OR REPLACE INTO rate_limits (ip_address, hour_key, request_count)
    VALUES (?, ?, COALESCE((SELECT request_count FROM rate_limits WHERE ip_address = ? AND hour_key = ?) + 1, 1))
  `),
  
  getCachedAnalysis: db.prepare(`
    SELECT ac.task_id FROM analysis_cache ac
    JOIN tasks t ON ac.task_id = t.id
    WHERE ac.url_hash = ? AND t.status = 'done' AND datetime(ac.cached_at) > datetime('now', '-1 day')
  `),
  
  insertCache: db.prepare(`
    INSERT OR REPLACE INTO analysis_cache (url_hash, url, task_id)
    VALUES (?, ?, ?)
  `),
  
  getSetting: db.prepare(`
    SELECT value FROM settings WHERE key = ?
  `),
  
  updateSetting: db.prepare(`
    UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?
  `)
};

// Cleanup old data periodically
export const cleanup = () => {
  // Remove rate limit records older than 2 hours
  db.exec(`DELETE FROM rate_limits WHERE created_at < datetime('now', '-2 hours')`);
  
  // Remove failed tasks older than 24 hours
  db.exec(`DELETE FROM tasks WHERE status = 'failed' AND created_at < datetime('now', '-1 day')`);
  
  // Remove cache entries older than 7 days
  db.exec(`DELETE FROM analysis_cache WHERE cached_at < datetime('now', '-7 days')`);
};