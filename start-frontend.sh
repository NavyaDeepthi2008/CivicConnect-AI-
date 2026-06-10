#!/bin/bash
echo "🎨 Starting CivicConnect AI Frontend..."
cd "$(dirname "$0")/frontend"

if [ ! -d "node_modules" ]; then
  echo "📦 Installing npm dependencies..."
  npm install
fi

echo "🚀 Starting React app on http://localhost:3000"
npm start
