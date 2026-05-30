@echo off
cd /d "C:\Users\Tanvir\Office_AI"
echo Starting Office AI Telegram Gateway...
start /b node gateway.js

echo Starting Renner QC Academy Backend Server...
start /b node server.js

echo Starting Renner QC Academy Frontend (Vite)...
cd /d "C:\Users\Tanvir\Office_AI\client"
start /b npm run dev
