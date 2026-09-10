#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build for production
echo "🏗️  Building for production..."
npm run build

echo "✅ Build complete! Output in dist/"
echo ""
echo "To deploy with nginx:"
echo "  1. Copy nginx.conf to /etc/nginx/sites-available/ims_ui"
echo "  2. Enable site: sudo ln -s /etc/nginx/sites-available/ims_ui /etc/nginx/sites-enabled/"
echo "  3. Test config: sudo nginx -t"
echo "  4. Reload nginx: sudo systemctl reload nginx"
echo "  5. Copy dist/ to /var/www/ims_ui/dist"
echo ""
echo "Or for manual static hosting:"
echo "  - Upload dist/ to your static hosting (Netlify, Vercel, AWS S3, etc.)"
echo "  - Run: npm run preview (to preview locally)"