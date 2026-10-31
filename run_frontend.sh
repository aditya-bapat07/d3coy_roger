#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/frontend"

echo "Starting Vidura Frontend on http://localhost:5173..."
npm run dev -- --host

