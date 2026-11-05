#!/usr/bin/env bash
# Exit on error
set -o errexit

# 1. Build React frontend client
cd client
npm install
npm run build
cd ..

# 2. Build backend server and install Chrome for Puppeteer
cd server
npm install
npx puppeteer browsers install chrome
npm run build


