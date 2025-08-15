import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '空間便利店 SEO Inspector - 網站SEO分析工具',
  description: '輸入網址即可快速分析網站SEO表現，提供詳細分數與修正建議',
  keywords: 'SEO, 網站分析, SEO工具, 搜尋引擎優化, 網站診斷',
  authors: [{ name: '空間便利店 SEO Inspector' }],
  openGraph: {
    title: '空間便利店 SEO Inspector - 網站SEO分析工具',
    description: '輸入網址即可快速分析網站SEO表現，提供詳細分數與修正建議',
    type: 'website',
    locale: 'zh_TW',
  },
  twitter: {
    card: 'summary_large_image',
    title: '空間便利店 SEO Inspector - 網站SEO分析工具',
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
                  空間便利店 SEO Inspector
                </h1>
                <a 
                  href="line://ti/p/@768cpmhz?oat_referrer=PROFILE" 
                  className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                  </svg>
                  <span className="text-sm font-medium">聯絡我們</span>
                </a>
              </div>
            </div>
          </header>

          <main className="flex-1">
            {children}
          </main>

          <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-16">
            <div className="container mx-auto px-4 py-8">
              <div className="text-center text-gray-600">
                <p className="mb-2">© 2024 空間便利店 SEO Inspector. 僅供站長學術用途使用。</p>
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