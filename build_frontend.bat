@echo off
REM ============================================================
REM  NIE - Rebuild Frontend
REM  Rebuilds the React production bundle after UI changes
REM ============================================================
setlocal
cd /d "%~dp0\frontend"

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found. Install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [INFO] Installing frontend dependencies (if needed)...
call npm install
if errorlevel 1 ( echo [ERROR] npm install failed & pause & exit /b 1 )

echo [INFO] Building frontend...
call npm run build
if errorlevel 1 ( echo [ERROR] build failed & pause & exit /b 1 )

echo.
echo [OK] Frontend rebuilt. Restart the server (start.bat) to serve the new build.
pause
endlocal
