/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
  env: {
    RENDER_TIMEOUT_MS: process.env.RENDER_TIMEOUT_MS || '10000',
    MAX_ANALYSIS_SECONDS: process.env.MAX_ANALYSIS_SECONDS || '60',
    MAX_HTML_MB: process.env.MAX_HTML_MB || '10',
    TARGET_SECONDS: process.env.TARGET_SECONDS || '30',
    COVERAGE_PCT: process.env.COVERAGE_PCT || '80',
  },
}

module.exports = nextConfig;