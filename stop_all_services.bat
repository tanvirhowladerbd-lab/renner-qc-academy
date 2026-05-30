@echo off
echo Stopping all running Node.js background services...
taskkill /f /im node.exe
echo All services stopped successfully.
pause
