#!/bin/bash

# Build script for WajoB Telegram Mini App
# This script builds the app for production deployment

echo "🚀 Building WajoB for Production..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

# Clean previous build
if [ -d "build" ]; then
  echo "🧹 Cleaning previous build..."
  rm -rf build
  echo ""
fi

# Build the app
echo "⚙️  Building React app..."
npm run build

# Check if build was successful
if [ -d "build" ]; then
  echo ""
  echo "✅ Build completed successfully!"
  echo ""
  echo "📊 Build statistics:"
  du -sh build
  echo ""
  echo "📁 Build contents:"
  ls -lh build/
  echo ""
  echo "🌐 Ready for deployment to:"
  echo "  - Vercel"
  echo "  - Netlify"
  echo "  - GitHub Pages"
  echo "  - Any static hosting"
  echo ""
  echo "📝 Next steps:"
  echo "  1. Test the build locally: npx serve -s build"
  echo "  2. Deploy to your hosting platform"
  echo "  3. Update TON Connect manifest URL"
else
  echo ""
  echo "❌ Build failed! Check errors above."
  exit 1
fi
