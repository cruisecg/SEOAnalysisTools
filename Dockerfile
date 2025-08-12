FROM node:20-slim

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Install Playwright browsers
RUN npx playwright install-deps chromium
RUN npx playwright install chromium

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Create data directory
RUN mkdir -p /app/data

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create playwright cache directory for nextjs user and set ownership
RUN mkdir -p /home/nextjs/.cache/ms-playwright
RUN cp -r /root/.cache/ms-playwright/* /home/nextjs/.cache/ms-playwright/ || true
RUN chown -R nextjs:nodejs /app
RUN chown -R nextjs:nodejs /home/nextjs/.cache

# Switch to nextjs user
USER nextjs

# Set Playwright cache path for nextjs user
ENV PLAYWRIGHT_BROWSERS_PATH=/home/nextjs/.cache/ms-playwright

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]