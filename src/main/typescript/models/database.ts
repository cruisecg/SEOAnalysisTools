import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const DB_PATH = process.env.DATABASE_PATH || './data/seo_analysis.json';

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database schema
interface DatabaseSchema {
  tasks: Array<{
    id: string;
    status: 'queued' | 'running' | 'done' | 'failed';
    requested_url: string;
    final_url?: string;
    overall_score?: number;
    grade?: 'A' | 'B' | 'C' | 'D' | 'E';
    analysis_data?: string; // JSON blob
    error_message?: string;
    ip_address: string;
    user_agent: string;
    created_at: string;
    completed_at?: string;
  }>;
  rate_limits: Array<{
    ip_address: string;
    hour_key: string;
    request_count: number;
    created_at: string;
  }>;
  analysis_cache: Array<{
    url_hash: string;
    url: string;
    task_id: string;
    cached_at: string;
  }>;
  settings: Array<{
    key: string;
    value: string;
    description?: string;
    updated_at: string;
  }>;
}

// Default data
const defaultData: DatabaseSchema = {
  tasks: [],
  rate_limits: [],
  analysis_cache: [],
  settings: [
    { key: 'weights.technical', value: '30', description: 'Technical foundation weight', updated_at: new Date().toISOString() },
    { key: 'weights.content', value: '25', description: 'Content and structure weight', updated_at: new Date().toISOString() },
    { key: 'weights.structured_data', value: '10', description: 'Structured data weight', updated_at: new Date().toISOString() },
    { key: 'weights.performance', value: '25', description: 'Performance and CWV weight', updated_at: new Date().toISOString() },
    { key: 'weights.social', value: '10', description: 'Social markup weight', updated_at: new Date().toISOString() }
  ]
};

// Initialize database
let db: any = null;

async function initDB() {
  if (!db) {
    db = await JSONFilePreset(DB_PATH, defaultData);
  }
  return db;
}

export { initDB };

// Database operations
export const dbOperations = {
  insertTask: async (id: string, status: string, requested_url: string, ip_address: string, user_agent: string) => {
    const database = await initDB();
    database.data.tasks.push({
      id,
      status: status as any,
      requested_url,
      ip_address,
      user_agent,
      created_at: new Date().toISOString()
    });
    database.write();
  },

  updateTaskStatus: async (
    status: string,
    final_url: string | null,
    overall_score: number | null,
    grade: string | null,
    analysis_data: string | null,
    error_message: string | null,
    id: string
  ) => {
    const database = await initDB();
    const task = database.data.tasks.find(t => t.id === id);
    if (task) {
      task.status = status as any;
      if (final_url) task.final_url = final_url;
      if (overall_score !== null) task.overall_score = overall_score;
      if (grade) task.grade = grade as any;
      if (analysis_data) task.analysis_data = analysis_data;
      if (error_message) task.error_message = error_message;
      task.completed_at = new Date().toISOString();
      database.write();
    }
  },

  getTask: async (id: string) => {
    const database = await initDB();
    return database.data.tasks.find(t => t.id === id) || null;
  },

  getRateLimit: async (ip_address: string, hour_key: string) => {
    const database = await initDB();
    return database.data.rate_limits.find(r => r.ip_address === ip_address && r.hour_key === hour_key) || null;
  },

  updateRateLimit: async (ip_address: string, hour_key: string) => {
    const database = await initDB();
    const existing = database.data.rate_limits.find(r => r.ip_address === ip_address && r.hour_key === hour_key);
    if (existing) {
      existing.request_count++;
    } else {
      database.data.rate_limits.push({
        ip_address,
        hour_key,
        request_count: 1,
        created_at: new Date().toISOString()
      });
    }
    database.write();
  },

  getCachedAnalysis: async (url_hash: string) => {
    const database = await initDB();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const cache = database.data.analysis_cache.find(c => 
      c.url_hash === url_hash && c.cached_at > oneHourAgo
    );
    
    if (cache) {
      const task = database.data.tasks.find(t => t.id === cache.task_id && t.status === 'done');
      return task ? { task_id: task.id } : null;
    }
    return null;
  },

  insertCache: async (url_hash: string, url: string, task_id: string) => {
    const database = await initDB();
    // Remove existing cache for this URL
    database.data.analysis_cache = database.data.analysis_cache.filter(c => c.url_hash !== url_hash);
    
    database.data.analysis_cache.push({
      url_hash,
      url,
      task_id,
      cached_at: new Date().toISOString()
    });
    database.write();
  },

  getSetting: async (key: string) => {
    const database = await initDB();
    return database.data.settings.find(s => s.key === key) || null;
  },

  updateSetting: async (key: string, value: string) => {
    const database = await initDB();
    const setting = database.data.settings.find(s => s.key === key);
    if (setting) {
      setting.value = value;
      setting.updated_at = new Date().toISOString();
    } else {
      database.data.settings.push({
        key,
        value,
        updated_at: new Date().toISOString()
      });
    }
    database.write();
  }
};

// Cleanup old data periodically
export const cleanup = async () => {
  const database = await initDB();
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Remove old rate limits
  database.data.rate_limits = database.data.rate_limits.filter(r => r.created_at > twoHoursAgo);
  
  // Remove old failed tasks
  database.data.tasks = database.data.tasks.filter(t => !(t.status === 'failed' && t.created_at < oneDayAgo));
  
  // Remove old cache entries
  database.data.analysis_cache = database.data.analysis_cache.filter(c => c.cached_at > sevenDaysAgo);
  
  database.write();
};