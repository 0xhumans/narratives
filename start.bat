@echo off
REM ============================================================
REM  Narrative Intelligence Engine (NIE) - System Launcher
REM  Starts the backend API + web UI on http://127.0.0.1:8000
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ============================================================
echo   Narrative Intelligence Engine (NIE)
echo   Starting system...
echo ============================================================
echo.

REM --- Check Python ---
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found on PATH. Install Python 3.11+ from https://python.org
    pause
    exit /b 1
)

REM --- Build frontend (always — keeps UI in sync with source) ---
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found. Install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo [INFO] Building frontend...
pushd frontend
if not exist "node_modules" (
    call npm install
    if errorlevel 1 ( echo [ERROR] npm install failed & popd & pause & exit /b 1 )
)
call npm run build
if errorlevel 1 ( echo [ERROR] frontend build failed & popd & pause & exit /b 1 )
popd
echo [OK] Frontend built.
echo.

REM --- Create backend venv if missing ---
if not exist "backend\.venv\Scripts\python.exe" (
    echo [INFO] Creating Python virtual environment...
    pushd backend
    python -m venv .venv
    if errorlevel 1 ( echo [ERROR] venv creation failed & pause & exit /b 1 )
    .\.venv\Scripts\python.exe -m pip install --upgrade pip -q
    .\.venv\Scripts\python.exe -m pip install -e ".[dev]" -q
    if errorlevel 1 ( echo [ERROR] pip install failed & pause & exit /b 1 )
    popd
    echo [OK] Backend environment ready.
    echo.
)

REM --- Check .env ---
if not exist "backend\.env" (
    echo [WARNING] backend\.env not found. Copying from .env.example.
    copy ".env.example" "backend\.env" >nul
    echo [ACTION REQUIRED] Edit backend\.env and set GLM_API_KEY (OpenRouter key)
    echo                      then re-run this script.
    pause
    exit /b 1
)

REM --- Verify GLM_API_KEY is not placeholder ---
findstr /C:"GLM_API_KEY=placeholder" "backend\.env" >nul
if not errorlevel 1 (
    echo [ERROR] GLM_API_KEY is still 'placeholder' in backend\.env.
    echo          Get a key from https://openrouter.ai/keys and set it.
    pause
    exit /b 1
)

REM --- Seed narratives if DB empty ---
echo [INFO] Verifying database is seeded...
pushd backend
set "ENV=prod"
for /f %%i in ('".venv\Scripts\python.exe" -m nie.scripts.count_narratives 2^>nul') do set NCOUNT=%%i
if not defined NCOUNT set NCOUNT=0
if "%NCOUNT%"=="0" (
    echo [INFO] Seeding narratives...
    ".venv\Scripts\python.exe" -m nie.cli seed
    if errorlevel 1 (
        echo [ERROR] Failed to seed narratives. Check DATABASE_URL in backend\.env
        popd
        pause
        exit /b 1
    )
)
popd
echo [OK] Database ready ^(%NCOUNT% narratives^).
echo.

REM --- Start server ---
echo ============================================================
echo   System ready!
echo.
echo   Web UI:   http://127.0.0.1:8000
echo   API docs: http://127.0.0.1:8000/docs
echo.
echo   Press Ctrl+C to stop the server.
echo ============================================================
echo.

cd backend
set "ENV=prod"
start "" "http://127.0.0.1:8000"
".venv\Scripts\python.exe" -m uvicorn nie.api.main:app --host 127.0.0.1 --port 8000

endlocal
