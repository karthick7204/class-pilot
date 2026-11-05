import puppeteer from 'puppeteer-core';

async function testPuppeteer() {
  console.log('Launching Chrome headlessly...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  console.log('Navigating to SRMIST portal...');
  await page.goto('https://sp.srmist.edu.in/srmiststudentportal/students/loginManager/youLogin.jsp', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  console.log('Page loaded! Title:', await page.title());

  // Wait for captcha image to load
  await page.waitForSelector('#secure_captcha', { timeout: 10000 });
  const captchaElem = await page.$('#secure_captcha');

  if (captchaElem) {
    const screenshotBuffer = await captchaElem.screenshot({ encoding: 'base64' });
    console.log('Captcha screenshot taken! Length:', screenshotBuffer.length);
    console.log('Sample base64:', screenshotBuffer.substring(0, 50));
  } else {
    console.error('Captcha element not found');
  }

  await browser.close();
  console.log('Browser closed cleanly.');
}

testPuppeteer().catch(console.error);

