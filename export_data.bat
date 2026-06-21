@echo off
REM Export Neon DB snapshot to frontend/public/data for GitHub + Vercel static deploy.
cd /d "%~dp0backend"
if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Run start.bat once to create the Python venv.
    pause
    exit /b 1
)
echo [INFO] Exporting public data snapshot...
".venv\Scripts\python.exe" scripts\export_static_data.py
if errorlevel 1 ( pause & exit /b 1 )
echo.
echo [OK] Data written to frontend\public\data
echo      Commit and push to GitHub, then deploy on Vercel.
pause
