#!/usr/bin/env bash
set -e

# Change to repository root
cd "$(dirname "$0")"

# Activate virtual environment if present
if [ -d ".venv" ]; then
    source .venv/bin/activate
elif [ -d "venv" ]; then
    source venv/bin/activate
fi

export PYTHONPATH=.
echo "Starting CASCADE Backend API on http://127.0.0.1:8000..."
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

