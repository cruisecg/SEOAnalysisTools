'use client';

import { useState } from 'react';
import { Search, ExternalLink, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setTaskId(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      setTaskId(data.task_id);
      // Redirect to result page
      window.location.href = `/result/${data.task_id}`;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exampleUrls = [
    'https://www.gov.tw',
    'https://www.mozilla.org',
    'https://developer.mozilla.org',
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          快速分析網站 SEO 表現
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          輸入任意網址，我們將為您全面分析網站的 SEO 健康狀況，
          提供詳細的評分報告和具體的修正建議。
        </p>
      </div>

      {/* Analysis Form */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                網站網址 (URL)
              </label>
              <div className="relative">
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                  disabled={isAnalyzing}
                />
                <ExternalLink className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isAnalyzing || !url.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>分析中...</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  <span>開始分析</span>
                </>
              )}
            </button>
          </form>

          {/* Example URLs */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">試試這些範例網址：</p>
            <div className="flex flex-wrap gap-2">
              {exampleUrls.map((exampleUrl) => (
                <button
                  key={exampleUrl}
                  onClick={() => setUrl(exampleUrl)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                  disabled={isAnalyzing}
                >
                  {exampleUrl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mt-16 grid md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">全面檢測</h3>
          <p className="text-gray-600">
            檢查技術基礎、內容結構、結構化資料、效能指標和社群標記
          </p>
        </div>

        <div className="text-center">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">快速分析</h3>
          <p className="text-gray-600">
            通常在 30 秒內完成分析，即時獲得詳細報告和建議
          </p>
        </div>

        <div className="text-center">
          <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">具體建議</h3>
          <p className="text-gray-600">
            不只給分數，還提供優先級排序的具體修正建議和實作方法
          </p>
        </div>
      </div>

      {/* Rate Limit Info */}
      <div className="mt-12 max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">使用限制</p>
            <p>每小時最多可分析 5 個網站，分析結果可分享且有效期 24 小時。</p>
          </div>
        </div>
      </div>
    </div>
  );
}