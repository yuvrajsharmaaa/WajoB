#!/bin/bash

# Deploy script for Netlify
# This script builds and deploys the app to Netlify

echo "🚀 Deploying to Netlify..."
echo ""

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
  echo "📦 Installing Netlify CLI..."
  npm install -g netlify-cli
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
echo "🌐 Deploying to Netlify..."

# Deploy to Netlify
netlify deploy --prod --dir=build

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Don't forget to:"
echo "  1. Update tonconnect-manifest.json with your Netlify URL"
echo "  2. Update the manifestUrl in src/contexts/TonConnectProvider.js"
echo "  3. Test the deployed app with Telegram Web App"
