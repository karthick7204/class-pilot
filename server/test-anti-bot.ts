import puppeteer from 'puppeteer-core';

async function testStealth() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,800',
    ],
  });

  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  await page.goto('https://sp.srmist.edu.in/srmiststudentportal/students/loginManager/youLogin.jsp', {
    waitUntil: 'networkidle2',
  });

  // Move mouse
  await page.mouse.move(100, 100);
  await page.mouse.move(250, 250);
  await page.mouse.move(400, 350);

  // Check telemetry payload
  const telemetry = await page.evaluate(() => {
    if (typeof (window as any).getTelemetryPayload === 'function') {
      const payloadBase64 = (window as any).getTelemetryPayload();
      const decoded = atob(payloadBase64);
      return JSON.parse(decoded);
    }
    return null;
  });

  console.log('Telemetry generated on SRM page:');
  console.log(telemetry);

  await browser.close();
}

testStealth().catch(console.error);

