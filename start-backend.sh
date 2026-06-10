#!/bin/bash
echo "🏛️ Starting CivicConnect AI Backend..."
cd "$(dirname "$0")/backend"

if [ ! -d "venv" ]; then
  echo "📦 Creating virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

echo "📦 Installing dependencies..."
pip install -r requirements.txt -q

echo "🚀 Starting Flask server on http://localhost:5000"
python app.py
