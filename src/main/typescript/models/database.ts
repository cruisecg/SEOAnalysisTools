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
const db = await JSONFilePreset(DB_PATH, defaultData);

export { db };

// Database operations
export const dbOperations = {
  insertTask: (id: string, status: string, requested_url: string, ip_address: string, user_agent: string) => {
    db.data.tasks.push({
      id,
      status: status as any,
      requested_url,
      ip_address,
      user_agent,
      created_at: new Date().toISOString()
    });
    db.write();
  },

  updateTaskStatus: (
    status: string,
    final_url: string | null,
    overall_score: number | null,
    grade: string | null,
    analysis_data: string | null,
    error_message: string | null,
    id: string
  ) => {
    const task = db.data.tasks.find(t => t.id === id);
    if (task) {
      task.status = status as any;
      if (final_url) task.final_url = final_url;
      if (overall_score !== null) task.overall_score = overall_score;
      if (grade) task.grade = grade as any;
      if (analysis_data) task.analysis_data = analysis_data;
      if (error_message) task.error_message = error_message;
      task.completed_at = new Date().toISOString();
      db.write();
    }
  },

  getTask: (id: string) => {
    return db.data.tasks.find(t => t.id === id) || null;
  },

  getRateLimit: (ip_address: string, hour_key: string) => {
    return db.data.rate_limits.find(r => r.ip_address === ip_address && r.hour_key === hour_key) || null;
  },

  updateRateLimit: (ip_address: string, hour_key: string) => {
    const existing = db.data.rate_limits.find(r => r.ip_address === ip_address && r.hour_key === hour_key);
    if (existing) {
      existing.request_count++;
    } else {
      db.data.rate_limits.push({
        ip_address,
        hour_key,
        request_count: 1,
        created_at: new Date().toISOString()
      });
    }
    db.write();
  },

  getCachedAnalysis: (url_hash: string) => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const cache = db.data.analysis_cache.find(c => 
      c.url_hash === url_hash && c.cached_at > oneHourAgo
    );
    
    if (cache) {
      const task = db.data.tasks.find(t => t.id === cache.task_id && t.status === 'done');
      return task ? { task_id: task.id } : null;
    }
    return null;
  },

  insertCache: (url_hash: string, url: string, task_id: string) => {
    // Remove existing cache for this URL
    db.data.analysis_cache = db.data.analysis_cache.filter(c => c.url_hash !== url_hash);
    
    db.data.analysis_cache.push({
      url_hash,
      url,
      task_id,
      cached_at: new Date().toISOString()
    });
    db.write();
  },

  getSetting: (key: string) => {
    return db.data.settings.find(s => s.key === key) || null;
  },

  updateSetting: (key: string, value: string) => {
    const setting = db.data.settings.find(s => s.key === key);
    if (setting) {
      setting.value = value;
      setting.updated_at = new Date().toISOString();
    } else {
      db.data.settings.push({
        key,
        value,
        updated_at: new Date().toISOString()
      });
    }
    db.write();
  }
};

// Cleanup old data periodically
export const cleanup = () => {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Remove old rate limits
  db.data.rate_limits = db.data.rate_limits.filter(r => r.created_at > twoHoursAgo);
  
  // Remove old failed tasks
  db.data.tasks = db.data.tasks.filter(t => !(t.status === 'failed' && t.created_at < oneDayAgo));
  
  // Remove old cache entries
  db.data.analysis_cache = db.data.analysis_cache.filter(c => c.cached_at > sevenDaysAgo);
  
  db.write();
};