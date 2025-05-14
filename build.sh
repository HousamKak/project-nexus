#!/bin/bash

# Build script for Project Nexus

echo "🚀 Building Project Nexus..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Type check
echo "✅ Type checking..."
npm run type-check

# Run linter
echo "🔍 Linting code..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm test

# Build for production
echo "🏗️ Building for production..."
npm run build

# Generate service worker
echo "📱 Generating service worker..."
cp public/service-worker.js dist/

# Copy static assets
echo "📂 Copying static assets..."
cp -r public/assets dist/
cp manifest.json dist/

# Optimize images
echo "🖼️ Optimizing images..."
# Add image optimization command here if needed

# Generate documentation
echo "📚 Generating documentation..."
# Add documentation generation if needed

echo "✨ Build complete! Output in dist/ directory"
echo "📊 Build stats:"
du -sh dist/

# Optional: Deploy to hosting
# echo "🌐 Deploying to hosting..."
# Add deployment commands here