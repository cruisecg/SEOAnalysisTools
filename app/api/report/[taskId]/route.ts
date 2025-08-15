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
      return new NextResponse('Invalid task ID', { status: 400 });
    }

    const task = await taskManager.getTask(taskId);

    if (!task) {
      return new NextResponse('Task not found', { status: 404 });
    }

    if (task.status !== 'done') {
      return new NextResponse('Analysis not completed yet', { status: 202 });
    }

    // Generate HTML report
    const html = generateHTMLReport(task);
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('Generate report failed:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

function generateHTMLReport(task: any): string {
  const gradeColors = {
    A: 'text-green-600',
    B: 'text-blue-600', 
    C: 'text-yellow-600',
    D: 'text-orange-600',
    E: 'text-red-600'
  };

  const gradeColor = gradeColors[task.grade as keyof typeof gradeColors] || 'text-gray-600';

  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SEO 分析報告 - ${task.requestedUrl}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .gauge {
            transform: rotate(-90deg);
        }
        .gauge-text {
            transform: rotate(90deg);
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
                <h1 class="text-3xl font-bold text-gray-900">SEO 分析報告</h1>
                <div class="text-sm text-gray-500">
                    ${new Date(task.createdAt).toLocaleString('zh-TW')}
                </div>
            </div>
            <div class="text-lg text-gray-700 mb-2">
                <span class="font-semibold">分析網址:</span> 
                <a href="${task.finalUrl || task.requestedUrl}" target="_blank" class="text-blue-600 hover:underline">
                    ${task.finalUrl || task.requestedUrl}
                </a>
            </div>
            ${task.finalUrl && task.finalUrl !== task.requestedUrl ? 
              `<div class="text-sm text-gray-600">原始網址: ${task.requestedUrl}</div>` : ''
            }
        </div>

        <!-- Overall Score -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex items-center justify-center mb-6">
                <div class="relative">
                    <svg class="gauge w-32 h-32" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" stroke="#e5e7eb" stroke-width="8" fill="none" />
                        <circle cx="50" cy="50" r="45" stroke="currentColor" stroke-width="8" 
                                fill="none" stroke-linecap="round"
                                stroke-dasharray="${45 * 2 * Math.PI}"
                                stroke-dashoffset="${45 * 2 * Math.PI * (1 - (task.overallScore || 0) / 100)}"
                                class="${gradeColor}" />
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="text-center gauge-text">
                            <div class="text-3xl font-bold ${gradeColor}">${task.overallScore || 0}</div>
                            <div class="text-lg font-semibold ${gradeColor}">${task.grade || 'N/A'}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="text-center">
                <h2 class="text-2xl font-bold mb-2">整體評分: ${task.overallScore || 0}/100</h2>
                <div class="text-gray-600">等級: <span class="${gradeColor} font-semibold">${task.grade || 'N/A'}</span></div>
            </div>
        </div>

        <!-- Checks -->
        ${(task.checks || []).map((group: any) => `
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-gray-900">${group.group}</h3>
                <div class="text-lg font-semibold">
                    ${group.score}/${group.items.reduce((sum: number, item: any) => sum + item.weight, 0)} 分
                </div>
            </div>
            <div class="space-y-4">
                ${group.items.map((item: any) => `
                <div class="border-l-4 ${item.score >= item.weight ? 'border-green-500' : item.score > 0 ? 'border-yellow-500' : 'border-red-500'} pl-4">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-semibold text-gray-900">${item.label}</h4>
                        <span class="text-sm font-medium ${item.score >= item.weight ? 'text-green-600' : item.score > 0 ? 'text-yellow-600' : 'text-red-600'}">
                            ${item.score}/${item.weight}
                        </span>
                    </div>
                    <p class="text-gray-700 mb-2">${item.advice}</p>
                    ${item.evidence && Object.keys(item.evidence).length > 0 ? `
                    <details class="text-sm text-gray-600">
                        <summary class="cursor-pointer hover:text-gray-800">檢測證據</summary>
                        <pre class="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">${JSON.stringify(item.evidence, null, 2)}</pre>
                    </details>
                    ` : ''}
                </div>
                `).join('')}
            </div>
        </div>
        `).join('')}

        <!-- Warnings -->
        ${task.warnings && task.warnings.length > 0 ? `
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div class="flex">
                <div class="ml-3">
                    <h3 class="text-lg font-medium text-yellow-800">重要提醒</h3>
                    <ul class="mt-2 text-yellow-700 list-disc list-inside">
                        ${task.warnings.map((warning: string) => `<li>${warning}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div class="text-center text-sm text-gray-500 mt-8">
            <p>報告由 空間便利店 SEO Inspector 生成</p>
            <p>分析時間: ${task.completedAt ? new Date(task.completedAt).toLocaleString('zh-TW') : '處理中'}</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}