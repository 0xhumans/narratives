@echo off
REM ============================================================
REM  NIE - Run Synthesis Pipeline
REM  Synthesizes all narratives via GLM-5.2 (OpenRouter)
REM ============================================================
setlocal
cd /d "%~dp0\backend"

if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Backend venv not found. Run start.bat first.
    pause
    exit /b 1
)
if not exist ".env" (
    echo [ERROR] backend\.env not found. Run start.bat first.
    pause
    exit /b 1
)

echo ============================================================
echo   Narrative Intelligence Engine - Pipeline Runner
echo   Synthesizing all 60 narratives via GLM-5.2...
echo   This will take a while. Press Ctrl+C to abort.
echo ============================================================
echo.

set "ENV=prod"
".venv\Scripts\python.exe" -m nie.cli run

echo.
if errorlevel 1 (
    echo [WARNING] Pipeline completed with errors. Check output above.
) else (
    echo [OK] Pipeline completed successfully.
)
pause
endlocal
