#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/frontend"

echo "Starting CASCADE Frontend on http://localhost:5173..."
npm run dev -- --host

