@echo off
echo ====================================================
echo  HERMES QC - Package Installation
echo ====================================================
echo.
echo Installing required Python packages...
echo.

pip install -r requirements.txt

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================
    echo  SUCCESS! All packages installed.
    echo ====================================================
    echo.
    echo Next steps:
    echo  1. Edit config/config.json - set OneDrive folder path
    echo  2. Copy config/.env.template to config/.env
    echo  3. Add your ANTHROPIC_API_KEY and EMAIL_APP_PASSWORD to .env
    echo  4. Run the app: python app/hermes_app.py
    echo.
) else (
    echo.
    echo  ERROR: Installation failed. Check Python is installed.
    echo.
)

pause
