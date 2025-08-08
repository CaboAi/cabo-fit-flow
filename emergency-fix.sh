#!/bin/bash
# EMERGENCY FIX FOR BROKEN SITE

echo "🚨 EMERGENCY FIX - SITE IS BROKEN! 🚨"
echo "====================================="

# First, check what's in the build
echo "Checking dist folder..."
ls -la dist/
ls -la dist/assets/

# Check if index.css exists
echo "Checking for CSS files..."
find . -name "*.css" -type f

# Rebuild with verbose output
echo "Rebuilding site..."
npm run build

# Check the build output
echo "Checking build output..."
cat dist/index.html | head -20

# Look for CSS references
echo "CSS references in index.html:"
grep -i "stylesheet" dist/index.html
grep -i ".css" dist/index.html

# Check if Tailwind is working
echo "Checking if Tailwind CSS is being generated..."
if [ -f "dist/assets/index*.css" ]; then
    echo "✅ CSS file exists in dist"
    ls -lh dist/assets/*.css
else
    echo "❌ NO CSS FILE IN DIST!"
fi

# QUICK FIX - Ensure Tailwind is imported
echo "Checking main CSS import..."
head -20 src/index.css

# Check main.tsx for CSS import
echo "Checking if CSS is imported in main.tsx..."
grep "index.css" src/main.tsx

# If CSS import is missing, add it
if ! grep -q "index.css" src/main.tsx; then
    echo "❌ CSS NOT IMPORTED! Fixing..."
    sed -i '1s/^/import ".\/index.css";\n/' src/main.tsx
fi

# Rebuild after fix
npm run build

echo "Pushing emergency fix..."
git add -A
git commit -m "EMERGENCY FIX: CSS not loading - rebuild with proper imports"
git push origin main

echo "✅ Emergency fix pushed! Site should rebuild in 1-2 minutes"