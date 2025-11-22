#!/bin/bash

# Deploy script for Vercel
# This script builds and deploys the app to Vercel

echo "🚀 Deploying to Vercel..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "📦 Installing Vercel CLI..."
  npm install -g vercel
  echo ""
fi

# Build the app first
echo "⚙️  Building app..."
npm run build

if [ ! -d "build" ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo ""
echo "🌐 Deploying to Vercel..."

# Deploy to Vercel
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Don't forget to:"
echo "  1. Update tonconnect-manifest.json with your Vercel URL"
echo "  2. Update the manifestUrl in src/contexts/TonConnectProvider.js"
echo "  3. Test the deployed app with Telegram Web App"
