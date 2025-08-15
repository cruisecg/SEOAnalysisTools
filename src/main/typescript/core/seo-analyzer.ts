import { chromium, Browser, Page } from 'playwright';
import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';
import lighthouse from 'lighthouse';
import { AnalysisContext, SEOCheckGroup, SEOCheckItem, AnalysisConfig } from './types';

export class SEOAnalyzer {
  private browser: Browser | null = null;
  private config: AnalysisConfig;

  constructor(config: AnalysisConfig) {
    this.config = config;
  }

  async initialize() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
  }

  async analyze(url: string): Promise<{ context: AnalysisContext; checks: SEOCheckGroup[] }> {
    if (!this.browser) {
      await this.initialize();
    }

    const context = await this.crawlAndRender(url);
    const checks = await this.performChecks(context);

    return { context, checks };
  }

  private async crawlAndRender(url: string): Promise<AnalysisContext> {
    const page = await this.browser!.newPage();
    const redirectChain: string[] = [];
    
    try {
      // Set user agent
      await page.route('**/*', (route) => {
        route.continue({
          headers: {
            ...route.request().headers(),
            'User-Agent': '空間便利店 SEO Inspector Bot 1.0 (+https://seo.onestep.place/bot)'
          }
        });
      });
      
      // Track redirects
      page.on('response', (response) => {
        if ([301, 302, 307, 308].includes(response.status())) {
          redirectChain.push(response.url());
        }
      });

      const response = await page.goto(url, { 
        waitUntil: 'networkidle', 
        timeout: this.config.renderTimeoutMs 
      });

      if (!response) {
        throw new Error('Failed to load page');
      }

      const finalUrl = page.url();
      const statusCode = response.status();
      const headers: Record<string, string> = {};
      
      for (const [key, value] of Object.entries(response.headers())) {
        headers[key] = value;
      }

      // Get rendered HTML
      const html = await page.content();
      
      // Check HTML size
      const htmlSizeMb = Buffer.byteLength(html, 'utf8') / (1024 * 1024);
      if (htmlSizeMb > this.config.maxHtmlMb) {
        throw new Error(`HTML size ${htmlSizeMb.toFixed(2)}MB exceeds limit of ${this.config.maxHtmlMb}MB`);
      }

      // Get additional resources
      const robotsTxt = await this.fetchRobotsTxt(finalUrl);
      const sitemapXml = await this.fetchSitemapXml(finalUrl);

      await page.close();

      return {
        html,
        url,
        finalUrl,
        statusCode,
        headers,
        redirectChain,
        robotsTxt,
        sitemapXml
      };
    } catch (error) {
      await page.close();
      throw error;
    }
  }

  private async performChecks(context: AnalysisContext): Promise<SEOCheckGroup[]> {
    const $ = cheerio.load(context.html);
    
    return [
      await this.checkTechnicalFoundation(context, $ as any),
      await this.checkContentStructure(context, $ as any),
      await this.checkStructuredData(context, $ as any),
      await this.checkPerformance(context, $ as any),
      await this.checkSocialMarkup(context, $ as any)
    ];
  }

  private async checkTechnicalFoundation(context: AnalysisContext, $: cheerio.CheerioAPI): Promise<SEOCheckGroup> {
    const items: SEOCheckItem[] = [];

    // HTTP Status Code
    items.push({
      id: 'http_status',
      label: 'HTTP 狀態碼',
      weight: 5,
      score: context.statusCode === 200 ? 5 : context.statusCode >= 300 && context.statusCode < 400 ? 3 : 0,
      evidence: { status_code: context.statusCode },
      advice: context.statusCode === 200 ? '狀態碼正常' : `狀態碼 ${context.statusCode}，請檢查頁面是否正常`,
      priority: context.statusCode !== 200 ? 'high' : 'low'
    });

    // HTTPS
    const isHttps = context.finalUrl.startsWith('https://');
    items.push({
      id: 'https_usage',
      label: 'HTTPS 使用',
      weight: 5,
      score: isHttps ? 5 : 0,
      evidence: { is_https: isHttps, url: context.finalUrl },
      advice: isHttps ? '已使用 HTTPS' : '建議使用 HTTPS 加密連線',
      priority: isHttps ? 'low' : 'high'
    });

    // Robots.txt
    const robotsExists = !!context.robotsTxt;
    items.push({
      id: 'robots_txt',
      label: 'Robots.txt',
      weight: 3,
      score: robotsExists ? 3 : 0,
      evidence: { exists: robotsExists, content: context.robotsTxt?.substring(0, 200) },
      advice: robotsExists ? 'Robots.txt 存在' : '建議添加 robots.txt 文件',
      priority: 'medium'
    });

    // Sitemap
    const sitemapExists = !!context.sitemapXml;
    items.push({
      id: 'sitemap_xml',
      label: 'Sitemap.xml',
      weight: 3,
      score: sitemapExists ? 3 : 0,
      evidence: { exists: sitemapExists },
      advice: sitemapExists ? 'Sitemap.xml 存在' : '建議添加 sitemap.xml 文件',
      priority: 'medium'
    });

    // Canonical URL
    const canonical = $('link[rel="canonical"]').attr('href');
    const canonicalScore = canonical ? 4 : 0;
    items.push({
      id: 'canonical_url',
      label: 'Canonical URL',
      weight: 4,
      score: canonicalScore,
      evidence: { canonical_url: canonical },
      advice: canonical ? 'Canonical URL 設定正確' : '建議設定 canonical URL',
      priority: canonical ? 'low' : 'medium'
    });

    // Meta robots
    const metaRobots = $('meta[name="robots"]').attr('content') || '';
    const hasNoindex = metaRobots.includes('noindex');
    items.push({
      id: 'indexability',
      label: '可索引性',
      weight: 5,
      score: hasNoindex ? 0 : 5,
      evidence: { meta_robots: metaRobots, has_noindex: hasNoindex },
      advice: hasNoindex ? '頁面設為不可索引 (noindex)' : '頁面可被搜索引擎索引',
      priority: hasNoindex ? 'high' : 'low'
    });

    const totalScore = items.reduce((sum, item) => sum + item.score, 0);
    return {
      group: 'Technical Foundation',
      weight: this.config.weights.technical,
      score: totalScore,
      items
    };
  }

  private async checkContentStructure(context: AnalysisContext, $: cheerio.CheerioAPI): Promise<SEOCheckGroup> {
    const items: SEOCheckItem[] = [];

    // Title tag
    const title = $('title').text().trim();
    const titleLength = title.length;
    const titleScore = titleLength >= 30 && titleLength <= 60 ? 5 : titleLength > 0 ? 3 : 0;
    items.push({
      id: 'title_tag',
      label: 'Title 標籤',
      weight: 5,
      score: titleScore,
      evidence: { title, length: titleLength },
      advice: titleLength === 0 ? '缺少 title 標籤' : 
               titleLength < 30 ? 'Title 太短，建議 30-60 字元' :
               titleLength > 60 ? 'Title 太長，建議 30-60 字元' : 'Title 長度適中',
      priority: titleScore < 5 ? 'high' : 'low'
    });

    // Meta description
    const description = $('meta[name="description"]').attr('content')?.trim() || '';
    const descLength = description.length;
    const descScore = descLength >= 120 && descLength <= 160 ? 5 : descLength > 0 ? 3 : 0;
    items.push({
      id: 'meta_description',
      label: 'Meta Description',
      weight: 5,
      score: descScore,
      evidence: { description, length: descLength },
      advice: descLength === 0 ? '缺少 meta description' :
               descLength < 120 ? 'Description 太短，建議 120-160 字元' :
               descLength > 160 ? 'Description 太長，建議 120-160 字元' : 'Description 長度適中',
      priority: descScore < 5 ? 'high' : 'low'
    });

    // H1 tag
    const h1Elements = $('h1');
    const h1Count = h1Elements.length;
    const h1Text = h1Elements.first().text().trim();
    const h1Score = h1Count === 1 && h1Text.length > 0 ? 5 : h1Count > 1 ? 3 : 0;
    items.push({
      id: 'h1_tag',
      label: 'H1 標籤',
      weight: 5,
      score: h1Score,
      evidence: { h1_count: h1Count, h1_text: h1Text },
      advice: h1Count === 0 ? '缺少 H1 標籤' :
               h1Count > 1 ? '有多個 H1 標籤，建議只使用一個' : 'H1 標籤設定正確',
      priority: h1Score < 5 ? 'high' : 'low'
    });

    // Heading hierarchy
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;
    const hierarchyScore = h2Count > 0 ? 5 : 2;
    items.push({
      id: 'heading_hierarchy',
      label: '標題階層',
      weight: 5,
      score: hierarchyScore,
      evidence: { h1_count: h1Count, h2_count: h2Count, h3_count: h3Count },
      advice: h2Count === 0 ? '建議使用 H2 標籤組織內容' : '標題階層結構良好',
      priority: hierarchyScore < 5 ? 'medium' : 'low'
    });

    // Image alt attributes
    const images = $('img');
    const imagesWithAlt = $('img[alt]');
    const altCoverage = images.length > 0 ? (imagesWithAlt.length / images.length) * 100 : 100;
    const altScore = altCoverage >= 90 ? 5 : altCoverage >= 70 ? 4 : altCoverage >= 50 ? 3 : altCoverage > 0 ? 2 : 0;
    items.push({
      id: 'image_alt_attributes',
      label: '圖片 Alt 屬性',
      weight: 5,
      score: altScore,
      evidence: { total_images: images.length, images_with_alt: imagesWithAlt.length, coverage_percent: Math.round(altCoverage) },
      advice: altCoverage < 90 ? `${Math.round(100 - altCoverage)}% 圖片缺少 alt 屬性，建議補齊` : '所有圖片都有 alt 屬性',
      priority: altCoverage < 70 ? 'medium' : 'low'
    });

    const totalScore = items.reduce((sum, item) => sum + item.score, 0);
    return {
      group: 'Content & Structure',
      weight: this.config.weights.content,
      score: totalScore,
      items
    };
  }

  private async checkStructuredData(context: AnalysisContext, $: cheerio.CheerioAPI): Promise<SEOCheckGroup> {
    const items: SEOCheckItem[] = [];

    // JSON-LD structured data
    const jsonLdScripts = $('script[type="application/ld+json"]');
    const hasStructuredData = jsonLdScripts.length > 0;
    let validJsonLd = 0;
    const structuredDataTypes: string[] = [];

    jsonLdScripts.each((_, element) => {
      try {
        const content = $(element).html();
        if (content) {
          const data = JSON.parse(content);
          validJsonLd++;
          if (data['@type']) {
            structuredDataTypes.push(data['@type']);
          }
        }
      } catch (e) {
        // Invalid JSON-LD
      }
    });

    const structuredDataScore = validJsonLd > 0 ? 5 : 0;
    items.push({
      id: 'structured_data_presence',
      label: '結構化資料存在',
      weight: 5,
      score: structuredDataScore,
      evidence: { 
        total_scripts: jsonLdScripts.length, 
        valid_json_ld: validJsonLd,
        types: structuredDataTypes
      },
      advice: validJsonLd > 0 ? 
        `發現 ${validJsonLd} 個有效的結構化資料` : 
        '建議添加 JSON-LD 結構化資料',
      priority: validJsonLd === 0 ? 'medium' : 'low'
    });

    // Schema.org compliance
    const hasRelevantSchema = structuredDataTypes.some(type => 
      ['Organization', 'WebSite', 'WebPage', 'Article', 'Product', 'LocalBusiness'].includes(type)
    );
    const schemaScore = hasRelevantSchema ? 5 : hasStructuredData ? 3 : 0;
    items.push({
      id: 'schema_compliance',
      label: 'Schema.org 合規性',
      weight: 5,
      score: schemaScore,
      evidence: { has_relevant_schema: hasRelevantSchema, detected_types: structuredDataTypes },
      advice: hasRelevantSchema ? 
        '檢測到相關的 Schema.org 類型' : 
        hasStructuredData ? '建議使用更相關的 Schema.org 類型' : '建議添加適當的 Schema.org 標記',
      priority: schemaScore < 5 ? 'medium' : 'low'
    });

    const totalScore = items.reduce((sum, item) => sum + item.score, 0);
    return {
      group: 'Structured Data',
      weight: this.config.weights.structuredData,
      score: totalScore,
      items
    };
  }

  private async checkPerformance(context: AnalysisContext, $: cheerio.CheerioAPI): Promise<SEOCheckGroup> {
    const items: SEOCheckItem[] = [];

    // Note: This is a simplified performance check
    // In a real implementation, you'd run Lighthouse here
    
    // Resource optimization
    const hasGzip = context.headers['content-encoding']?.includes('gzip') || 
                    context.headers['content-encoding']?.includes('br');
    items.push({
      id: 'compression',
      label: '內容壓縮',
      weight: 5,
      score: hasGzip ? 5 : 0,
      evidence: { content_encoding: context.headers['content-encoding'] },
      advice: hasGzip ? '已啟用內容壓縮' : '建議啟用 Gzip 或 Brotli 壓縮',
      priority: hasGzip ? 'low' : 'medium'
    });

    // Caching headers
    const cacheControl = context.headers['cache-control'];
    const hasCaching = !!cacheControl && !cacheControl.includes('no-cache');
    items.push({
      id: 'caching_headers',
      label: '快取設定',
      weight: 5,
      score: hasCaching ? 5 : 0,
      evidence: { cache_control: cacheControl },
      advice: hasCaching ? '已設定適當的快取策略' : '建議設定適當的 Cache-Control 標頭',
      priority: hasCaching ? 'low' : 'medium'
    });

    // Image optimization (basic check)
    const images = $('img');
    let modernImageFormats = 0;
    images.each((_, element) => {
      const src = $(element).attr('src') || '';
      if (src.includes('.webp') || src.includes('.avif')) {
        modernImageFormats++;
      }
    });

    const imageOptScore = images.length === 0 ? 5 : (modernImageFormats / images.length) * 5;
    items.push({
      id: 'image_optimization',
      label: '圖片最佳化',
      weight: 5,
      score: Math.round(imageOptScore),
      evidence: { 
        total_images: images.length, 
        modern_format_images: modernImageFormats,
        modern_format_percentage: Math.round((modernImageFormats / Math.max(images.length, 1)) * 100)
      },
      advice: modernImageFormats === images.length ? 
        '所有圖片都使用現代格式' : 
        `建議將更多圖片轉換為 WebP 或 AVIF 格式 (目前: ${Math.round((modernImageFormats / Math.max(images.length, 1)) * 100)}%)`,
      priority: imageOptScore < 3 ? 'medium' : 'low'
    });

    // Lazy loading
    const lazyImages = $('img[loading="lazy"]');
    const lazyLoadScore = images.length === 0 ? 5 : Math.min(5, (lazyImages.length / images.length) * 10);
    items.push({
      id: 'lazy_loading',
      label: '延遲載入',
      weight: 5,
      score: Math.round(lazyLoadScore),
      evidence: { images_with_lazy: lazyImages.length, total_images: images.length },
      advice: lazyImages.length > 0 ? 
        `${lazyImages.length} 張圖片使用延遲載入` : 
        '建議為非關鍵圖片添加 loading="lazy" 屬性',
      priority: lazyLoadScore < 3 ? 'medium' : 'low'
    });

    // Placeholder for actual Core Web Vitals (would need Lighthouse)
    items.push({
      id: 'core_web_vitals',
      label: '核心網頁生命力',
      weight: 15,
      score: 10, // Placeholder score
      evidence: { note: '需要 Lighthouse 實際測量' },
      advice: '建議使用 PageSpeed Insights 檢測實際的 CWV 指標',
      priority: 'high'
    });

    const totalScore = items.reduce((sum, item) => sum + item.score, 0);
    return {
      group: 'Performance & CWV',
      weight: this.config.weights.performance,
      score: totalScore,
      items
    };
  }

  private async checkSocialMarkup(context: AnalysisContext, $: cheerio.CheerioAPI): Promise<SEOCheckGroup> {
    const items: SEOCheckItem[] = [];

    // Open Graph tags
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const ogDescription = $('meta[property="og:description"]').attr('content');
    const ogImage = $('meta[property="og:image"]').attr('content');
    const ogUrl = $('meta[property="og:url"]').attr('content');
    const ogType = $('meta[property="og:type"]').attr('content');

    const ogTags = [ogTitle, ogDescription, ogImage, ogUrl, ogType].filter(Boolean).length;
    const ogScore = Math.round((ogTags / 5) * 6);
    
    items.push({
      id: 'open_graph_tags',
      label: 'Open Graph 標籤',
      weight: 6,
      score: ogScore,
      evidence: {
        og_title: ogTitle,
        og_description: ogDescription,
        og_image: ogImage,
        og_url: ogUrl,
        og_type: ogType,
        complete_tags: ogTags
      },
      advice: ogTags === 5 ? 
        '所有主要 Open Graph 標籤都已設定' : 
        `缺少 ${5 - ogTags} 個主要 Open Graph 標籤 (title, description, image, url, type)`,
      priority: ogScore < 4 ? 'medium' : 'low'
    });

    // Twitter Cards
    const twitterCard = $('meta[name="twitter:card"]').attr('content');
    const twitterTitle = $('meta[name="twitter:title"]').attr('content');
    const twitterDescription = $('meta[name="twitter:description"]').attr('content');
    const twitterImage = $('meta[name="twitter:image"]').attr('content');

    const twitterTags = [twitterCard, twitterTitle, twitterDescription, twitterImage].filter(Boolean).length;
    const twitterScore = Math.round((twitterTags / 4) * 4);
    
    items.push({
      id: 'twitter_cards',
      label: 'Twitter Cards',
      weight: 4,
      score: twitterScore,
      evidence: {
        twitter_card: twitterCard,
        twitter_title: twitterTitle,
        twitter_description: twitterDescription,
        twitter_image: twitterImage,
        complete_tags: twitterTags
      },
      advice: twitterTags === 4 ? 
        'Twitter Cards 設定完整' : 
        `建議補齊 Twitter Cards 標籤 (目前: ${twitterTags}/4)`,
      priority: twitterScore < 3 ? 'medium' : 'low'
    });

    const totalScore = items.reduce((sum, item) => sum + item.score, 0);
    return {
      group: 'Social Markup',
      weight: this.config.weights.social,
      score: totalScore,
      items
    };
  }

  private async fetchRobotsTxt(url: string): Promise<string | null> {
    try {
      const robotsUrl = new URL('/robots.txt', url).toString();
      const response = await fetch(robotsUrl);
      if (response.ok) {
        return await response.text();
      }
    } catch (e) {
      // Robots.txt not found or error
    }
    return null;
  }

  private async fetchSitemapXml(url: string): Promise<string | null> {
    try {
      const sitemapUrl = new URL('/sitemap.xml', url).toString();
      const response = await fetch(sitemapUrl);
      if (response.ok) {
        return await response.text();
      }
    } catch (e) {
      // Sitemap not found or error
    }
    return null;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}