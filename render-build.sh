#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install server dependencies and compile TypeScript
cd server
npm install
npx puppeteer browsers install chrome
npm run build

