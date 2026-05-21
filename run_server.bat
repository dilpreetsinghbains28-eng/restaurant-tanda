@echo off
title Galaxy Restaurant Server Watchdog
cls
echo ──────────────────────────────────────────────────────────
echo   🌌 GALAXY RESTAURANT SERVER WATCHDOG
echo   Status: Active ^& Monitoring
echo ──────────────────────────────────────────────────────────

:start
echo [%time%] 🧹 Cleaning up port 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    echo [%time%] 🗡️  Terminating process PID: %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo [%time%] 🚀 Starting Server...
node server.js

echo.
echo ──────────────────────────────────────────────────────────
echo   ⚠️  SERVER CRASHED OR STOPPED!
echo   [%date% %time%]
echo   Restarting in 3 seconds...
echo ──────────────────────────────────────────────────────────
timeout /t 3 /nobreak >nul
goto start
