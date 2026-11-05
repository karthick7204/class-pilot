import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';

function safeBase64Encode(str: string): string {
  return Buffer.from(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
    return String.fromCharCode(parseInt('0x' + p1, 16));
  }), 'binary').toString('base64');
}

function generateTelemetry(host: string, startTime: number): string {
  const now = Date.now();
  const timeOnPage = now - startTime;
  const telemetry = {
    E: host,
    D: 330,
    C: 1080,
    B: 1920,
    z: 4,
    y: 42,
    x: 8,
    w: 2450,
    v: false,
    u: '1248a3f',
    startTime: startTime,
    submitTime: now,
    timeOnPageMs: timeOnPage,
  };
  return safeBase64Encode(JSON.stringify(telemetry));
}

async function testResponseInspection() {
  const jar = new CookieJar();
  const client = wrapper(
    axios.create({
      jar,
      withCredentials: true,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      },
    })
  );

  const startTime = Date.now();
  const getRes = await client.get('https://sp.srmist.edu.in/srmiststudentportal/students/loginManager/youLogin.jsp');
  const html = getRes.data;
  const $ = cheerio.load(html);

  const domainFieldMatch = html.match(/domainFieldName\s*=\s*['"]([^'"]+)['"]/);
  const captchaFieldMatch = html.match(/captchaFieldName\s*=\s*['"]([^'"]+)['"]/);
  const delimiterMatch = html.match(/randomDelimiter\s*=\s*['"]([^'"]+)['"]/);

  const domainFieldName = domainFieldMatch ? domainFieldMatch[1] : '';
  const captchaFieldName = captchaFieldMatch ? captchaFieldMatch[1] : '';
  const randomDelimiter = delimiterMatch ? delimiterMatch[1] : '20af';

  let honeypotName = '';
  $('input[name^="ph_"]').each((_, elem) => {
    honeypotName = $(elem).attr('name') || '';
  });

  const telemetryPayload = generateTelemetry('sp.srmist.edu.in', startTime);

  const postData: Record<string, string> = {
    username: 'ka0569',
    password: 'wrong_password_test',
    captcha: 'ABCDEF',
    fpPayload: '',
    fpToken: '',
    telemetryPayload: telemetryPayload,
  };

  if (honeypotName) {
    postData[honeypotName] = '';
  }
  if (domainFieldName) {
    postData[domainFieldName] = Buffer.from('ni.ude.tsimrs.ps').toString('base64');
  }
  if (captchaFieldName) {
    postData[captchaFieldName] = Buffer.from(`3${randomDelimiter}1`).toString('base64');
  }

  const postRes = await client.post(
    'https://sp.srmist.edu.in/srmiststudentportal/LoginServlet',
    new URLSearchParams(postData).toString(),
    {
      headers: {
        Referer: 'https://sp.srmist.edu.in/srmiststudentportal/students/loginManager/youLogin.jsp',
        Origin: 'https://sp.srmist.edu.in',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      validateStatus: () => true,
    }
  );

  console.log('postRes headers:', postRes.headers);
  const $res = cheerio.load(postRes.data);
  console.log('Title:', $res('title').text());
  console.log('Alerts:', $res('.alert').text());
  console.log('First 300 chars of body:', $res('body').text().slice(0, 300));
}

testResponseInspection().catch(console.error);
