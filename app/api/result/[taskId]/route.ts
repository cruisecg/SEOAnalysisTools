import { NextRequest, NextResponse } from 'next/server';
import { TaskManager } from '../../../../src/main/typescript/services/task-manager';
import { AnalysisConfig } from '../../../../src/main/typescript/core/types';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const taskId = params.taskId;

    if (!taskId || typeof taskId !== 'string') {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid task ID' 
      }, { status: 400 });
    }

    const task = await taskManager.getTask(taskId);

    if (!task) {
      return NextResponse.json({ 
        success: false,
        error: 'Task not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        task_id: task.id,
        status: task.status,
        requested_url: task.requestedUrl,
        final_url: task.finalUrl,
        overall_score: task.overallScore,
        grade: task.grade,
        checks: task.checks,
        cwv: task.cwv,
        warnings: task.warnings,
        error_message: task.errorMessage,
        created_at: task.createdAt,
        completed_at: task.completedAt
      }
    });

  } catch (error) {
    console.error('Get task result failed:', error);
    
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}