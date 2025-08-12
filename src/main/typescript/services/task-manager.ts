import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import { db, dbOperations } from '../models/database';
import { SEOAnalyzer } from '../core/seo-analyzer';
import { AnalysisConfig, SEOAnalysisTask, SEOCheckGroup } from '../core/types';

export class TaskManager {
  private analyzer: SEOAnalyzer;
  private config: AnalysisConfig;
  private runningTasks = new Set<string>();

  constructor(config: AnalysisConfig) {
    this.config = config;
    this.analyzer = new SEOAnalyzer(config);
  }

  async createTask(url: string, ipAddress: string, userAgent: string): Promise<string> {
    // Validate URL
    if (!this.isValidUrl(url)) {
      throw new Error('Invalid URL format');
    }

    // Check rate limit
    await this.checkRateLimit(ipAddress);

    // Check cache
    const urlHash = this.hashUrl(url);
    const cachedTask = dbOperations.getCachedAnalysis(urlHash);
    
    if (cachedTask) {
      return cachedTask.task_id;
    }

    // Create new task
    const taskId = randomUUID();
    dbOperations.insertTask(taskId, 'queued', url, ipAddress, userAgent);
    
    // Start analysis in background (non-blocking)
    this.processTask(taskId, url, urlHash).catch(error => {
      console.error(`Task ${taskId} failed:`, error);
      dbOperations.updateTaskStatus(
        'failed',
        null,
        null,
        null,
        null,
        error.message,
        taskId
      );
    });

    return taskId;
  }

  async getTask(taskId: string): Promise<SEOAnalysisTask | null> {
    const task = dbOperations.getTask(taskId);
    if (!task) return null;

    const analysisData = task.analysis_data ? JSON.parse(task.analysis_data) : null;

    return {
      id: task.id,
      status: task.status,
      requestedUrl: task.requested_url,
      finalUrl: task.final_url,
      overallScore: task.overall_score,
      grade: task.grade,
      checks: analysisData?.checks,
      cwv: analysisData?.cwv,
      warnings: analysisData?.warnings,
      errorMessage: task.error_message,
      createdAt: task.created_at,
      completedAt: task.completed_at
    };
  }

  private async processTask(taskId: string, url: string, urlHash: string): Promise<void> {
    if (this.runningTasks.has(taskId)) {
      return; // Already processing
    }

    this.runningTasks.add(taskId);

    try {
      // Update status to running
      dbOperations.updateTaskStatus('running', null, null, null, null, null, taskId);

      // Perform analysis with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Analysis timeout')), this.config.maxAnalysisSeconds * 1000);
      });

      const analysisPromise = this.analyzer.analyze(url);
      const result = await Promise.race([analysisPromise, timeoutPromise]);

      const { context, checks } = result as { context: any; checks: SEOCheckGroup[] };
      
      // Calculate overall score
      const { overallScore, grade, warnings } = this.calculateScore(checks);

      // Prepare analysis data
      const analysisData = {
        checks,
        cwv: context.cwv || { source: 'lab' },
        warnings
      };

      // Update task with results
      dbOperations.updateTaskStatus(
        'done',
        context.finalUrl,
        overallScore,
        grade,
        JSON.stringify(analysisData),
        null,
        taskId
      );

      // Cache the result
      dbOperations.insertCache(urlHash, url, taskId);

    } finally {
      this.runningTasks.delete(taskId);
    }
  }

  private calculateScore(checks: SEOCheckGroup[]): { 
    overallScore: number; 
    grade: 'A' | 'B' | 'C' | 'D' | 'E'; 
    warnings: string[] 
  } {
    let totalWeightedScore = 0;
    let totalPossibleWeight = 0;
    const warnings: string[] = [];

    for (const group of checks) {
      const groupMaxScore = group.items.reduce((sum, item) => sum + item.weight, 0);
      const groupActualScore = group.score;
      
      if (groupMaxScore > 0) {
        const normalizedGroupScore = (groupActualScore / groupMaxScore) * group.weight;
        totalWeightedScore += normalizedGroupScore;
        totalPossibleWeight += group.weight;

        // Collect warnings for low-scoring items
        for (const item of group.items) {
          if (item.score < item.weight && item.priority === 'high') {
            warnings.push(`${group.group}: ${item.advice}`);
          }
        }
      }
    }

    const overallScore = totalPossibleWeight > 0 ? 
      Math.round((totalWeightedScore / totalPossibleWeight) * 100) : 0;

    let grade: 'A' | 'B' | 'C' | 'D' | 'E';
    if (overallScore >= 90) grade = 'A';
    else if (overallScore >= 80) grade = 'B';
    else if (overallScore >= 70) grade = 'C';
    else if (overallScore >= 60) grade = 'D';
    else grade = 'E';

    return { overallScore, grade, warnings };
  }

  private async checkRateLimit(ipAddress: string): Promise<void> {
    const hourKey = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
    const currentCount = dbOperations.getRateLimit(ipAddress, hourKey)?.request_count || 0;
    
    const limit = this.config.weights ? 20 : 5; // Assuming authenticated users get higher limit
    
    if (currentCount >= limit) {
      throw new Error(`Rate limit exceeded. Maximum ${limit} requests per hour.`);
    }

    dbOperations.updateRateLimit(ipAddress, hourKey);
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private hashUrl(url: string): string {
    return createHash('sha256').update(url).digest('hex');
  }

  async getRunningTasksCount(): Promise<number> {
    return this.runningTasks.size;
  }

  async cleanup(): Promise<void> {
    await this.analyzer.close();
  }
}