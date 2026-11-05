#!/usr/bin/env bash
# Exit on error
set -o errexit

# Build React client if present
if [ -d "../client" ]; then
  cd ../client
  npm install
  npm run build
  cd ../server
fi

npm install
npx puppeteer browsers install chrome
npm run build


