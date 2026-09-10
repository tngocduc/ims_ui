#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run linting
echo "🔍 Running lint..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm run test

# Build for production
echo "🏗️  Building for production..."
npm run build

echo "✅ Build complete! Output in dist/"
echo ""
echo "To deploy, you can:"
echo "  - Upload dist/ to your static hosting (Netlify, Vercel, AWS S3, etc.)"
echo "  - Run: npm run preview (to preview locally)"