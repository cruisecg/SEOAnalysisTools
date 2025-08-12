export interface SEOAnalysisTask {
  id: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  requestedUrl: string;
  finalUrl?: string;
  overallScore?: number;
  grade?: 'A' | 'B' | 'C' | 'D' | 'E';
  checks?: SEOCheckGroup[];
  cwv?: CoreWebVitals;
  warnings?: string[];
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface SEOCheckGroup {
  group: string;
  weight: number;
  score: number;
  items: SEOCheckItem[];
}

export interface SEOCheckItem {
  id: string;
  label: string;
  weight: number;
  score: number;
  evidence: Record<string, any>;
  advice: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface CoreWebVitals {
  LCP_ms?: number;
  CLS?: number;
  INP_ms?: number;
  source: 'lab' | 'field';
}

export interface AnalysisContext {
  html: string;
  url: string;
  finalUrl: string;
  statusCode: number;
  headers: Record<string, string>;
  redirectChain: string[];
  lighthouseReport?: any;
  robotsTxt?: string;
  sitemapXml?: string;
}

export interface SEOCheckWeights {
  technical: number;
  content: number;
  structuredData: number;
  performance: number;
  social: number;
}

export interface AnalysisConfig {
  weights: SEOCheckWeights;
  renderTimeoutMs: number;
  maxAnalysisSeconds: number;
  maxHtmlMb: number;
  targetSeconds: number;
}

export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetTime: Date;
}