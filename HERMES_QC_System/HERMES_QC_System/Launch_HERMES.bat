@echo off
REM HERMES QC Desktop App Launcher
cd /d "%~dp0"
python app\hermes_app.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo App crashed or failed to start.
    pause
)
