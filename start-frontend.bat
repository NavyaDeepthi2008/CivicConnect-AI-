@echo off
echo Starting CivicConnect AI Frontend...
cd /d "%~dp0frontend"

if not exist "node_modules" (
  echo Installing npm dependencies...
  npm install
)

echo Starting React app on http://localhost:3000
npm start
pause
