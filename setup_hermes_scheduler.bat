@echo off
REM ============================================================
REM HERMES QC - Windows Task Scheduler Setup
REM RIGHT-CLICK → "Run as administrator"
REM ============================================================

echo.
echo ====================================================
echo  HERMES QC AUTOMATION - SCHEDULER SETUP
echo  Runs daily at 9:30 AM
echo ====================================================
echo.

set "PROJECT_ROOT=C:\Users\Tanvir\Office_AI"
set "RUNNER_SCRIPT=%PROJECT_ROOT%\hermes_runner.js"
set "LOG_FILE=%PROJECT_ROOT%\HERMES_QC_System\HERMES_QC_System\logs\scheduler.log"
set "NODE_EXE=C:\Program Files\nodejs\node.exe"

echo Project Root : %PROJECT_ROOT%
echo Node.exe     : %NODE_EXE%
echo Runner Script: %RUNNER_SCRIPT%
echo Log File     : %LOG_FILE%
echo Schedule     : Every day at 09:30 AM
echo.

REM Check node exists
if not exist "%NODE_EXE%" (
    echo ERROR: node.exe not found at %NODE_EXE%
    echo Please check Node.js installation path.
    pause
    exit /b 1
)

REM Create logs folder if not exists
if not exist "%PROJECT_ROOT%\HERMES_QC_System\HERMES_QC_System\logs" (
    mkdir "%PROJECT_ROOT%\HERMES_QC_System\HERMES_QC_System\logs"
)

REM Delete existing task silently
schtasks /Delete /TN "HERMES_QC_Daily" /F >nul 2>&1

REM Create the scheduled task with FULL node path - runs daily at 9:30 AM
schtasks /Create ^
    /SC DAILY ^
    /TN "HERMES_QC_Daily" ^
    /TR "cmd /c cd /d \"%PROJECT_ROOT%\" && \"%NODE_EXE%\" \"%RUNNER_SCRIPT%\" >> \"%LOG_FILE%\" 2>&1" ^
    /ST 09:30 ^
    /RL HIGHEST ^
    /F

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================
    echo  SUCCESS! Task Scheduled.
    echo ====================================================
    echo.
    echo  Task Name : HERMES_QC_Daily
    echo  Schedule  : Every day at 9:30 AM
    echo  Node Path : %NODE_EXE%
    echo  Script    : %RUNNER_SCRIPT%
    echo  Log File  : %LOG_FILE%
    echo.
    echo  --- Verify Task ---
    schtasks /Query /TN "HERMES_QC_Daily" /FO LIST
    echo.
    echo  To test NOW run:
    echo  schtasks /Run /TN HERMES_QC_Daily
    echo.
) else (
    echo.
    echo ====================================================
    echo  ERROR: Could not create task.
    echo ====================================================
    echo.
    echo  Make sure you RIGHT-CLICKED and chose
    echo  "Run as administrator" !
    echo.
)

pause
