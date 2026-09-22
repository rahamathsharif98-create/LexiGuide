@echo off
echo ===================================================
echo   Starting LexiGuide (Backend + Frontend)
echo ===================================================

echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "LexiGuide Backend" cmd /k "cd /d %~dp0backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Launching Vite Frontend on http://localhost:5173 ...
start "LexiGuide Frontend" cmd /k "cd /d %~dp0 && npm run dev"

timeout /t 3 /nobreak >nul

echo Opening browser...
start http://localhost:5173/child/games

echo ===================================================
echo   LexiGuide is running! Keep the windows open.
echo ===================================================
