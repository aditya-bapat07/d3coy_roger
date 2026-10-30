@echo off
cd /d "%~dp0\frontend"
echo Starting CASCADE Frontend on http://localhost:5173...
call npm run dev -- --host
