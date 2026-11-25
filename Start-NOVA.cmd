@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
    echo Install Node.js first, then run this file again.
    pause
    exit /b 1
)
echo Open http://127.0.0.1:4318/ in your browser.
node serve.cjs --open
pause
