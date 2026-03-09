#!/bin/bash
# Pre-commit hook: run linting and type checks before committing

set -e

echo "Running pre-commit checks..."

# Backend lint check
if [ -d "backend" ]; then
  echo "Checking backend..."
  cd backend && npm run lint --if-present && cd ..
fi

# Web dashboard lint check
if [ -d "web-dashboard" ]; then
  echo "Checking web-dashboard..."
  cd web-dashboard && npm run lint --if-present && cd ..
fi

echo "Pre-commit checks passed."
