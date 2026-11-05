import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';

async function diagnose() {
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

  const res1 = await client.get('https://sp.srmist.edu.in/srmiststudentportal/students/loginManager/youLogin.jsp');
  console.log('GET youLogin.jsp status:', res1.status);
  const html = res1.data;
  const $ = cheerio.load(html);

  const nonceMatch = html.match(/nonce:\s*['"]([^'"]+)['"]/);
  const domainFieldMatch = html.match(/domainFieldName\s*=\s*['"]([^'"]+)['"]/);
  const captchaFieldMatch = html.match(/captchaFieldName\s*=\s*['"]([^'"]+)['"]/);
  const delimiterMatch = html.match(/randomDelimiter\s*=\s*['"]([^'"]+)['"]/);

  console.log('Parsed tokens:', {
    nonce: nonceMatch ? nonceMatch[1] : null,
    domainFieldName: domainFieldMatch ? domainFieldMatch[1] : null,
    captchaFieldName: captchaFieldMatch ? captchaFieldMatch[1] : null,
    randomDelimiter: delimiterMatch ? delimiterMatch[1] : null,
  });

  const captchaDataSrc = $('#secure_captcha').attr('data-src') || '';
  console.log('captchaDataSrc:', captchaDataSrc);

  let honeypotName = '';
  $('input[name^="ph_"]').each((_, elem) => {
    honeypotName = $(elem).attr('name') || '';
  });
  console.log('honeypotName:', honeypotName);

  // Check form action
  const formAction = $('#login_form').attr('action');
  console.log('Form action:', formAction);

  // List all form inputs
  const inputs: any[] = [];
  $('#login_form input').each((_, el) => {
    inputs.push({ name: $(el).attr('name'), id: $(el).attr('id'), type: $(el).attr('type'), value: $(el).val() });
  });
  console.log('Form inputs:', inputs);
}

diagnose().catch(console.error);

