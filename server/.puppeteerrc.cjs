const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Store the browser cache inside the project directory so Render bundles it with the app
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
