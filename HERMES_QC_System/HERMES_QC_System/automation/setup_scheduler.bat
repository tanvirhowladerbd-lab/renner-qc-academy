@echo off
REM ========================================================
REM HERMES QC - Windows Task Scheduler Setup
REM Run this file as Administrator to schedule daily runs
REM ========================================================

echo.
echo ====================================================
echo  HERMES QC AUTOMATION - SCHEDULER SETUP
echo ====================================================
echo.

REM Get the absolute path of the project root (parent of this batch file)
set "PROJECT_ROOT=%~dp0.."
for %%I in ("%PROJECT_ROOT%") do set "PROJECT_ROOT=%%~fI"

echo Project Root: %PROJECT_ROOT%
echo.

REM Path to Python and the runner script
set "PYTHON_EXE=python"
set "RUNNER_SCRIPT=%PROJECT_ROOT%\automation\daily_runner.py"
set "LOG_FILE=%PROJECT_ROOT%\logs\scheduler_output.log"

echo Runner Script: %RUNNER_SCRIPT%
echo Log File: %LOG_FILE%
echo.

REM Delete existing task if it exists (silent fail if not exists)
schtasks /Delete /TN "HERMES_QC_Daily" /F >nul 2>&1

REM Create the scheduled task - runs daily at 10:00 PM
schtasks /Create ^
    /SC DAILY ^
    /TN "HERMES_QC_Daily" ^
    /TR "cmd /c %PYTHON_EXE% \"%RUNNER_SCRIPT%\" >> \"%LOG_FILE%\" 2>&1" ^
    /ST 22:00 ^
    /F

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================
    echo  SUCCESS! Task scheduled successfully.
    echo ====================================================
    echo.
    echo  Task Name: HERMES_QC_Daily
    echo  Schedule:  Every day at 10:00 PM
    echo  Action:    Run automation/daily_runner.py
    echo  Log File:  %LOG_FILE%
    echo.
    echo  To verify, run: schtasks /Query /TN HERMES_QC_Daily
    echo  To test run:   schtasks /Run /TN HERMES_QC_Daily
    echo  To remove:     schtasks /Delete /TN HERMES_QC_Daily /F
    echo.
) else (
    echo.
    echo ====================================================
    echo  ERROR: Failed to create scheduled task.
    echo ====================================================
    echo.
    echo  Please run this batch file as ADMINISTRATOR.
    echo  Right-click on the file and select "Run as administrator"
    echo.
)

pause
