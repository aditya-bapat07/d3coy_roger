@echo off
cd /d "%~dp0"
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
) else if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)
set PYTHONPATH=.
echo Starting Vidura Backend API on http://127.0.0.1:8000...
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

