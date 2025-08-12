import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OneStep SEO Inspector - 網站SEO分析工具',
  description: '輸入網址即可快速分析網站SEO表現，提供詳細分數與修正建議',
  keywords: 'SEO, 網站分析, SEO工具, 搜尋引擎優化, 網站診斷',
  authors: [{ name: 'OneStep SEO Inspector' }],
  openGraph: {
    title: 'OneStep SEO Inspector - 網站SEO分析工具',
    description: '輸入網址即可快速分析網站SEO表現，提供詳細分數與修正建議',
    type: 'website',
    locale: 'zh_TW',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OneStep SEO Inspector - 網站SEO分析工具',
    description: '輸入網址即可快速分析網站SEO表現，提供詳細分數與修正建議',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">
                  OneStep SEO Inspector
                </h1>
                <nav className="hidden md:flex space-x-6 text-sm">
                  <a href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
                    首頁
                  </a>
                  <a href="/about" className="text-gray-700 hover:text-blue-600 transition-colors">
                    關於我們
                  </a>
                </nav>
              </div>
            </div>
          </header>

          <main className="flex-1">
            {children}
          </main>

          <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-16">
            <div className="container mx-auto px-4 py-8">
              <div className="text-center text-gray-600">
                <p className="mb-2">© 2024 OneStep SEO Inspector. 僅供站長學術用途使用。</p>
                <p className="text-sm">
                  我們尊重網站服務條款，不進行大量爬蟲行為。
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}