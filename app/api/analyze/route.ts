import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { TaskManager } from '../../../src/main/typescript/services/task-manager';
import { AnalysisConfig } from '../../../src/main/typescript/core/types';

const analyzeSchema = z.object({
  url: z.string().url('Invalid URL format')
});

const config: AnalysisConfig = {
  weights: {
    technical: 30,
    content: 25,
    structuredData: 10,
    performance: 25,
    social: 10
  },
  renderTimeoutMs: parseInt(process.env.RENDER_TIMEOUT_MS || '10000'),
  maxAnalysisSeconds: parseInt(process.env.MAX_ANALYSIS_SECONDS || '60'),
  maxHtmlMb: parseInt(process.env.MAX_HTML_MB || '10'),
  targetSeconds: parseInt(process.env.TARGET_SECONDS || '30')
};

const taskManager = new TaskManager(config);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = analyzeSchema.parse(body);
    
    // Get client IP and user agent
    const ipAddress = request.ip || 
                     request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const taskId = await taskManager.createTask(url, ipAddress, userAgent);

    return NextResponse.json({ 
      success: true,
      task_id: taskId 
    }, { status: 201 });

  } catch (error) {
    console.error('Analysis request failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid request data',
        details: error.errors 
      }, { status: 400 });
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage.includes('Rate limit') ? 429 : 500;

    return NextResponse.json({ 
      success: false,
      error: errorMessage 
    }, { status: statusCode });
  }
}

export async function GET() {
  return NextResponse.json({ 
    success: false,
    error: 'Method not allowed' 
  }, { status: 405 });
}