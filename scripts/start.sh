#!/bin/bash

# OneStep SEO Inspector - Startup Script

echo "🚀 Starting OneStep SEO Inspector..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Create data directory
mkdir -p data

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Install Playwright browsers if needed
if [ ! -d "node_modules/@playwright/browser-chromium" ]; then
    echo "🎭 Installing Playwright browsers..."
    npx playwright install chromium
fi

# Build the application if .next doesn't exist
if [ ! -d ".next" ]; then
    echo "🔨 Building application..."
    npm run build
fi

# Start the application
echo "✅ Starting SEO Inspector on http://localhost:3000"
npm start