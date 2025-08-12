'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Download, 
  Share2, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SEOTask {
  task_id: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  requested_url: string;
  final_url?: string;
  overall_score?: number;
  grade?: 'A' | 'B' | 'C' | 'D' | 'E';
  checks?: SEOCheckGroup[];
  cwv?: any;
  warnings?: string[];
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

interface SEOCheckGroup {
  group: string;
  weight: number;
  score: number;
  items: SEOCheckItem[];
}

interface SEOCheckItem {
  id: string;
  label: string;
  weight: number;
  score: number;
  evidence: Record<string, any>;
  advice: string;
  priority?: 'high' | 'medium' | 'low';
}

export default function ResultPage() {
  const params = useParams();
  const taskId = params?.taskId as string;
  
  const [task, setTask] = useState<SEOTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!taskId) return;

    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/result/${taskId}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch result');
        }

        setTask(data.data);

        // If task is not done, poll for updates
        if (data.data.status !== 'done' && data.data.status !== 'failed') {
          setTimeout(fetchResult, 2000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [taskId]);

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'E': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getItemStatusColor = (item: SEOCheckItem) => {
    if (item.score >= item.weight) return 'border-green-500 bg-green-50';
    if (item.score > 0) return 'border-yellow-500 bg-yellow-50';
    return 'border-red-500 bg-red-50';
  };

  const getItemStatusIcon = (item: SEOCheckItem) => {
    if (item.score >= item.weight) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (item.score > 0) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SEO 分析報告 - ${task?.requested_url}`,
          text: `查看這個網站的 SEO 分析報告，評分: ${task?.overall_score}/100 (${task?.grade})`,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback to copy URL
        navigator.clipboard.writeText(window.location.href);
        alert('連結已複製到剪貼板');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('連結已複製到剪貼板');
    }
  };

  const handleDownload = (format: 'pdf' | 'json') => {
    if (format === 'json') {
      const dataStr = JSON.stringify(task, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `seo-analysis-${taskId}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else {
      // Open report page for PDF generation
      window.open(`/api/report/${taskId}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">分析進行中</h2>
          <p className="text-gray-600">正在分析您的網站，請稍候...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">載入失敗</h2>
          <p className="text-gray-600 mb-4">{error || '找不到分析結果'}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  if (task.status === 'failed') {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">分析失敗</h2>
          <p className="text-gray-600 mb-4">{task.error_message || '分析過程中發生錯誤'}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            重新分析
          </button>
        </div>
      </div>
    );
  }

  if (task.status !== 'done') {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">分析中...</h2>
          <p className="text-gray-600">正在分析 {task.requested_url}</p>
          <div className="mt-4 text-sm text-gray-500">
            狀態: {task.status === 'queued' ? '排隊中' : '處理中'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">SEO 分析報告</h1>
              <div className="text-gray-600">
                <a 
                  href={task.final_url || task.requested_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center space-x-1"
                >
                  <span>{task.final_url || task.requested_url}</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
                {task.final_url && task.final_url !== task.requested_url && (
                  <div className="text-sm text-gray-500 mt-1">
                    原始網址: {task.requested_url}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2 mt-4 md:mt-0">
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span>分享</span>
              </button>
              
              <div className="relative group">
                <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <Download className="h-4 w-4" />
                  <span>匯出</span>
                </button>
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => handleDownload('pdf')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    下載 PDF
                  </button>
                  <button
                    onClick={() => handleDownload('json')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    下載 JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            分析完成時間: {task.completed_at ? new Date(task.completed_at).toLocaleString('zh-TW') : '未知'}
          </div>
        </div>

        {/* Overall Score */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <svg className="transform -rotate-90 w-32 h-32" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  fill="none" 
                  strokeLinecap="round"
                  strokeDasharray={`${45 * 2 * Math.PI}`}
                  strokeDashoffset={`${45 * 2 * Math.PI * (1 - (task.overall_score || 0) / 100)}`}
                  className={`gauge-circle ${getGradeColor(task.grade)}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getGradeColor(task.grade)}`}>
                    {task.overall_score}
                  </div>
                  <div className={`text-lg font-semibold ${getGradeColor(task.grade)}`}>
                    {task.grade}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">整體評分: {task.overall_score}/100</h2>
            <div className="text-gray-600">
              等級: <span className={`font-semibold ${getGradeColor(task.grade)}`}>{task.grade}</span>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {task.warnings && task.warnings.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-yellow-800 mb-2">重要提醒</h3>
                <ul className="text-yellow-700 space-y-1">
                  {task.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-600 mr-2">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Check Groups */}
        <div className="space-y-4">
          {task.checks?.map((group) => (
            <div key={group.group} className="bg-white rounded-lg shadow-md">
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleGroup(group.group)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{group.group}</h3>
                    <div className="text-gray-600 mt-1">
                      得分: {group.score}/{group.items.reduce((sum, item) => sum + item.weight, 0)}
                      <span className="ml-2">
                        ({Math.round((group.score / group.items.reduce((sum, item) => sum + item.weight, 0)) * 100)}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-lg font-semibold">
                      {Math.round((group.score / group.items.reduce((sum, item) => sum + item.weight, 0)) * 100)}%
                    </div>
                    {expandedGroups.has(group.group) ? 
                      <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    }
                  </div>
                </div>
              </div>
              
              {expandedGroups.has(group.group) && (
                <div className="px-6 pb-6 space-y-4">
                  {group.items.map((item) => (
                    <div key={item.id} className={`border-l-4 pl-4 p-4 rounded-r-lg ${getItemStatusColor(item)}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          {getItemStatusIcon(item)}
                          <h4 className="font-semibold text-gray-900">{item.label}</h4>
                        </div>
                        <span className="text-sm font-medium px-2 py-1 bg-white rounded">
                          {item.score}/{item.weight}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{item.advice}</p>
                      
                      {item.evidence && Object.keys(item.evidence).length > 0 && (
                        <details className="text-sm">
                          <summary className="cursor-pointer hover:text-gray-800 font-medium">
                            檢測證據
                          </summary>
                          <pre className="mt-2 p-3 bg-white rounded text-xs overflow-x-auto">
                            {JSON.stringify(item.evidence, null, 2)}
                          </pre>
                        </details>
                      )}
                      
                      {item.priority && (
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.priority === 'high' ? 'bg-red-100 text-red-800' :
                            item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {item.priority === 'high' ? '高優先級' : 
                             item.priority === 'medium' ? '中優先級' : '低優先級'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            分析其他網站
          </button>
        </div>
      </div>
    </div>
  );
}