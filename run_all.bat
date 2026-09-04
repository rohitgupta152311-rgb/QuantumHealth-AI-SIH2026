@echo off
title QuantumHealth AI - Startup
echo ========================================================
echo    Starting QuantumHealth AI (SIH 2026 - PS #26139)
echo ========================================================
echo.

set PROJECT_ROOT=%~dp0
set PATH=C:\Program Files\nodejs;%PATH%

echo [1/2] Launching FastAPI Backend on port 8000...
start "QuantumHealth AI - Backend (Port 8000)" cmd /k "cd /d %PROJECT_ROOT%backend && .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000"

echo [2/2] Launching React Vite Frontend on port 5174...
start "QuantumHealth AI - Frontend (Port 5174)" cmd /k "cd /d %PROJECT_ROOT%frontend && npm run dev"

echo.
echo Both servers are starting!
echo Opening browser in 3 seconds...
timeout /t 3 >nul
start http://localhost:5174
echo.
echo Dashboard: http://localhost:5174
echo Backend API Docs: http://localhost:8000/docs
echo ========================================================
