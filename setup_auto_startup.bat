@echo off
echo =======================================================
echo  OFFICE AI GATEWAY - SILENT STARTUP SETUP
echo =======================================================
echo.

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_SCRIPT=C:\Users\Tanvir\Office_AI\start_gateway_silent.vbs"
set "SHORTCUT_NAME=OfficeAIGateway.vbs"

echo Copying startup script to Windows Startup folder...
copy /Y "%VBS_SCRIPT%" "%STARTUP_FOLDER%\%SHORTCUT_NAME%" >nul

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SUCCESS! Office AI Gateway is now set to start
    echo    automatically in the background every time your PC turns on.
    echo.
    echo No black terminal windows will stay open! Everything will run silently.
) else (
    echo ❌ ERROR: Could not copy file to Startup folder.
)
echo.
pause
