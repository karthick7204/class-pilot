import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SrmMarksService, SrmCourseMarks } from './srmMarksService';

export interface SrmCourseAttendance {
  subjectCode: string;
  subjectName: string;
  category?: string;
  credits?: string;
  faculty?: string;
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  percentage: number;
  requiredClasses: number;
  margin: number;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  statusMessage: string;
  internalMarks?: SrmCourseMarks;
}

export interface SrmAttendanceData {
  studentName?: string;
  registerNumber?: string;
  overall: {
    totalClasses: number;
    attendedClasses: number;
    absentClasses: number;
    percentage: number;
    targetPercentage: number;
    requiredClasses: number;
    margin: number;
    status: 'SAFE' | 'WARNING' | 'CRITICAL';
    statusMessage: string;
  };
  subjects: SrmCourseAttendance[];
  marks?: SrmCourseMarks[];
}

export type ParsedSubjectAttendance = SrmCourseAttendance;

interface ActiveBrowserSession {
  browser: Browser;
  page: Page;
  createdAt: number;
}

const activeSessions = new Map<string, ActiveBrowserSession>();

// Cleanup orphaned sessions older than 5 minutes
setInterval(async () => {
  const now = Date.now();
  for (const [id, session] of activeSessions.entries()) {
    if (now - session.createdAt > 5 * 60 * 1000) {
      try {
        await session.browser.close();
      } catch (e) {}
      activeSessions.delete(id);
    }
  }
}, 60 * 1000);

const SRM_BASE = 'https://sp.srmist.edu.in/srmiststudentportal';
const SRM_LOGIN_URL = `${SRM_BASE}/students/loginManager/youLogin.jsp`;
const REAL_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

function findChromeBinaryInDir(dir: string, depth = 0): string | undefined {
  if (depth > 6 || !fs.existsSync(dir)) return undefined;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = findChromeBinaryInDir(fullPath, depth + 1);
        if (found) return found;
      } else if (
        entry.name === 'chrome' ||
        entry.name === 'chrome-headless-shell' ||
        entry.name === 'Google Chrome for Testing' ||
        entry.name === 'google-chrome' ||
        entry.name === 'chromium'
      ) {
        return fullPath;
      }
    }
  } catch {
    // Ignore read / permissions errors
  }
  return undefined;
}

const getChromeExecutablePath = async (): Promise<string | undefined> => {
  // 1. Explicit environment variable (for Render, Docker, or custom setups)
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    console.log(`[Puppeteer] Using executable from PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  // 2. Local macOS development: always prioritize native installed Chrome
  if (process.platform === 'darwin') {
    const macPaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    ];
    for (const p of macPaths) {
      if (fs.existsSync(p)) {
        console.log(`[Puppeteer] Using macOS local Chrome: ${p}`);
        return p;
      }
    }
  }

  // 3. Try Puppeteer's built-in executablePath() if it exists on disk
  try {
    const pptrPath = await puppeteer.executablePath();
    if (pptrPath && fs.existsSync(pptrPath)) {
      console.log(`[Puppeteer] Resolved executable via puppeteer.executablePath(): ${pptrPath}`);
      return pptrPath;
    }
  } catch (err: any) {
    console.warn(`[Puppeteer] puppeteer.executablePath() note: ${err?.message || err}`);
  }

  // 4. Search common cache locations (project .cache, Render cache, home .cache)
  const candidateDirs = [
    process.env.PUPPETEER_CACHE_DIR,
    path.join(process.cwd(), '.cache', 'puppeteer'),
    path.join(process.cwd(), 'server', '.cache', 'puppeteer'),
    path.join(__dirname, '..', '..', '.cache', 'puppeteer'),
    '/opt/render/.cache/puppeteer',
    '/opt/render/project/.cache/puppeteer',
    '/opt/render/project/src/.cache/puppeteer',
    '/opt/render/project/src/server/.cache/puppeteer',
    path.join(os.homedir(), '.cache', 'puppeteer'),
  ].filter((d): d is string => Boolean(d && fs.existsSync(d)));

  for (const dir of candidateDirs) {
    const found = findChromeBinaryInDir(dir);
    if (found) {
      console.log(`[Puppeteer] Discovered Chrome executable in cache at: ${found}`);
      return found;
    }
  }

  // 5. Linux / Render production system paths
  if (process.platform === 'linux') {
    const linuxPaths = [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
    ];
    for (const p of linuxPaths) {
      if (fs.existsSync(p)) {
        console.log(`[Puppeteer] Using Linux system Chrome: ${p}`);
        return p;
      }
    }
  }

  console.warn('[Puppeteer] No specific Chrome binary located on disk; letting Puppeteer attempt default launch.');
  return undefined;
};

export class SrmPortalService {
  /**
   * Launches headless Chrome with stealth settings to bypass F5 WAF & anti-bot checks,
   * loads youLogin.jsp, lets telemetry initialize, and captures the live CAPTCHA.
   */
  static async fetchCaptchaSession(): Promise<{ sessionId: string; captchaDataUrl: string }> {
    const executablePath = await getChromeExecutablePath();
    const launchOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-zygote',
        '--window-size=1280,800',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--mute-audio',
        '--no-default-browser-check',
      ],
    };

    if (executablePath) {
      launchOptions.executablePath = executablePath;
    }

    const browser = await puppeteer.launch(launchOptions);

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent(REAL_USER_AGENT);

      // Mask navigator.webdriver
      await page.evaluateOnNewDocument(() => {
        const g = globalThis as any;
        if (g.navigator) {
          Object.defineProperty(g.navigator, 'webdriver', { get: () => false });
        }
        g.chrome = { runtime: {} };
      });

      // Navigate to SRMIST portal
      await page.goto(SRM_LOGIN_URL, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Human-like mouse movements
      await page.mouse.move(100, 150);
      await page.mouse.move(250, 300);

      // Wait for CAPTCHA element and ensure image has finished rendering
      await page.waitForSelector('#secure_captcha', { timeout: 15000 });
      await page.waitForFunction(() => {
        const doc = (globalThis as any).document;
        const img = doc ? doc.querySelector('#secure_captcha') : null;
        return img && img.complete && img.naturalWidth > 0;
      }, { timeout: 15000 }).catch(() => {});

      await new Promise((r) => setTimeout(r, 800));

      const captchaElement = await page.$('#secure_captcha');
      if (!captchaElement) {
        throw new Error('CAPTCHA element could not be loaded from SRMIST.');
      }

      const base64Screenshot = await captchaElement.screenshot({ encoding: 'base64' });
      const captchaDataUrl = `data:image/png;base64,${base64Screenshot}`;

      const sessionId = crypto.randomUUID();
      activeSessions.set(sessionId, {
        browser,
        page,
        createdAt: Date.now(),
      });

      return { sessionId, captchaDataUrl };
    } catch (err: any) {
      try {
        await browser.close();
      } catch (e) {}
      throw new Error(`Failed to initialize SRM portal: ${err.message}`);
    }
  }

  /**
   * Enters credentials with realistic typing, mouse clicks, and stealth telemetry,
   * submits to LoginServlet, checks for authentication errors, and extracts attendance.
   */
  static async loginAndFetchRealAttendance(
    sessionId: string,
    netId: string,
    password: string,
    captcha: string
  ): Promise<SrmAttendanceData> {
    const session = activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Your portal session has expired. Please refresh the CAPTCHA.');
    }

    const { browser, page } = session;

    try {
      const cleanNetId = netId.trim().replace(/@srmist\.edu\.in$/i, '');
      const cleanCaptcha = captcha.trim();

      // Human-like typing with delays and events to satisfy anti-bot scripts
      await page.mouse.move(450, 280);
      await page.click('#username', { count: 3 });
      await page.type('#username', cleanNetId, { delay: 35 });

      await page.mouse.move(450, 340);
      await page.click('#password', { count: 3 });
      await page.type('#password', password, { delay: 35 });

      await page.mouse.move(450, 420);
      await page.click('#captcha', { count: 3 });
      await page.type('#captcha', cleanCaptcha, { delay: 40 });

      // Ensure anti-bot events fire for captcha
      await page.evaluate(() => {
        const doc = (globalThis as any).document;
        if (!doc) return;
        const c = doc.querySelector('#captcha');
        if (c) {
          c.dispatchEvent(new Event('input', { bubbles: true }));
          c.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      // Natural pause before submit so client-side encryption tokens finalize
      await new Promise((r) => setTimeout(r, 500));
      await page.mouse.move(450, 480);

      // Listen for portal alert dialogs (e.g. invalid captcha, invalid credentials)
      let dialogText = '';
      const onDialog = async (dialog: any) => {
        dialogText = dialog.message();
        console.log(`[SRM Portal Dialog] ${dialog.type()}: ${dialogText}`);
        await dialog.dismiss().catch(() => {});
      };
      page.on('dialog', onDialog);

      // Click submit and wait for navigation
      await Promise.all([
        page.click('#btnLogin'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 25000 }).catch(() => {}),
      ]);

      await new Promise((r) => setTimeout(r, 1200));
      page.off('dialog', onDialog);

      // Check if alert dialog occurred
      if (dialogText) {
        if (dialogText.toLowerCase().includes('captcha')) {
          throw new Error('Invalid CAPTCHA entered. Please enter the characters shown in the image.');
        }
        if (
          dialogText.toLowerCase().includes('password') ||
          dialogText.toLowerCase().includes('user') ||
          dialogText.toLowerCase().includes('credential')
        ) {
          throw new Error('Invalid SRM credentials. Please check your NetID and password.');
        }
        throw new Error(dialogText);
      }

      // Check current page content and URL
      const currentUrl = page.url();
      const pageHtml = await page.content();
      const $page = cheerio.load(pageHtml);

      // Check if still on login page with an alert
      if (currentUrl.includes('youLogin.jsp') || currentUrl.includes('LoginServlet')) {
        const alertText = $page('.alert-danger, .alert-icon-content, .alert, #divUserId')
          .text()
          .replace(/\s+/g, ' ')
          .trim();

        if (alertText.includes('Invalid credentials') || alertText.includes('Invalid User')) {
          throw new Error('Invalid SRM credentials. Please check your NetID and password.');
        }
        if (alertText.includes('Invalid Captcha') || alertText.includes('Enter valid Captcha')) {
          throw new Error('Invalid CAPTCHA entered. Please enter the characters shown in the image.');
        }
        if (alertText) {
          throw new Error(alertText);
        }
        throw new Error('SRM Portal authentication did not succeed. Please verify your credentials and CAPTCHA.');
      }

      // Collect landing page content and frame contents
      const allContents: string[] = [pageHtml];
      for (const frame of page.frames()) {
        try {
          allContents.push(await frame.content());
        } catch (e) {}
      }

      // Sequential extraction using the same authenticated browser tab
      // to avoid opening multiple tabs and exceeding memory limits on production Linux / Render (512MB RAM)
      try {
        await page.goto(`${SRM_BASE}/students/report/studentAttendanceDetails.jsp`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });
        const content = await page.content();
        allContents.push(content);
        for (const f of page.frames()) {
          try {
            allContents.push(await f.content());
          } catch (e) {}
        }
      } catch (e) {
        console.warn('[SrmPortalService] Attendance navigation error:', e);
      }

      let marksList: SrmCourseMarks[] = [];
      try {
        marksList = await SrmMarksService.scrapeInternalMarks(page, undefined, cleanNetId);
      } catch (err) {
        console.warn('[SrmPortalService] Marks scraping warning:', err);
      }

      // Close browser promptly after extraction
      try {
        await browser.close();
      } catch (e) {}
      activeSessions.delete(sessionId);

      // Parse all captured HTMLs to find the attendance table and student identity
      let studentName = '';
      let registerNumber = '';
      const parsedSubjects: SrmCourseAttendance[] = [];

      const isMonthOnly = (str: string): boolean => {
        const clean = str.trim().toLowerCase();
        return /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*([\s\-_/]+(20\d\d|\d{2}))?$/i.test(clean);
      };

      const isExcludedRow = (name: string, code: string, firstCell: string): boolean => {
        const trimmedName = name.trim();
        const trimmedCode = code.trim();
        const first = firstCell.trim();

        // 1. Exclude monthly breakdown rows (e.g. Jul-2026, Aug-2026, Sep-2026)
        if (isMonthOnly(trimmedName) || isMonthOnly(trimmedCode) || isMonthOnly(first)) {
          return true;
        }

        // 2. Exclude summary / total rows
        const isTotal = /^(total|cumulative|overall|grand\s*total|summary|cummulative)$/i;
        if (isTotal.test(trimmedName) || isTotal.test(trimmedCode) || isTotal.test(first)) {
          return true;
        }

        return false;
      };

      const extractAttendanceMetrics = (numbers: number[]): { total: number; attended: number; absent: number; percentage: number } | null => {
        if (numbers.length < 2) return null;

        // Support zero-conducted subjects (e.g. Industrial Certification: 0 / 0 / 0)
        const allZeros = numbers.every((n) => n === 0);
        if (allZeros) {
          return { total: 0, attended: 0, absent: 0, percentage: 100.0 };
        }

        // Try exact triplet: Total = Attended + Absent, or Attended / Total = Percentage
        for (let i = 0; i < numbers.length; i++) {
          for (let j = 0; j < numbers.length; j++) {
            if (i === j) continue;
            const t = numbers[i];
            const a = numbers[j];
            if (t > 0 && a <= t && (Number.isInteger(t) || t <= 500) && (Number.isInteger(a) || a <= 500)) {
              const expectedAbsent = t - a;
              const hasAbsent = numbers.some((n, idx) => idx !== i && idx !== j && Math.abs(n - expectedAbsent) < 0.01);
              const expectedPct = (a / t) * 100;
              const hasPct = numbers.some((n, idx) => idx !== i && idx !== j && Math.abs(n - expectedPct) < 0.5);

              if (hasAbsent || hasPct) {
                return { total: t, attended: a, absent: expectedAbsent, percentage: Number(expectedPct.toFixed(2)) };
              }
            }
          }
        }

        // Fallback: Filter integers and drop S.No if needed
        const validInts = numbers.filter((n) => Number.isInteger(n) && n <= 500 && n >= 0);
        if (validInts.length >= 2) {
          let ints = [...validInts];
          if (ints.length >= 3 && ints[0] <= 25 && (ints[1] > ints[0] || ints[2] > ints[0])) {
            ints = ints.slice(1);
          }
          const t = Math.max(ints[0], ints[1]);
          const a = Math.min(ints[0], ints[1]);
          return { total: t, attended: a, absent: t - a, percentage: t > 0 ? Number(((a / t) * 100).toFixed(2)) : 100.0 };
        }

        return null;
      };

      for (const html of allContents) {
        const $ = cheerio.load(html);

        // 1. Extract student profile information from common portal classes / IDs
        $('.student-name, .userName, #studentName, #lblStudentName, .profile-name, .user-name, #userName, .welcome-user, .user_name, .user-profile').each((_, el) => {
          const t = $(el).text().replace(/\s+/g, ' ').trim();
          if (t && t.length > 2 && !studentName && !/welcome/i.test(t)) {
            studentName = t;
          }
        });

        // 2. Extract from labeled tables (e.g. Name : ..., Register No : ...)
        $('tr').each((_, tr) => {
          const cells = $(tr).find('td, th').map((_, el) => $(el).text().replace(/\s+/g, ' ').trim()).get();
          for (let i = 0; i < cells.length; i++) {
            const rawLabel = cells[i].toLowerCase().replace(/[^a-z]/g, '');
            if (rawLabel === 'name' || rawLabel === 'studentname' || rawLabel === 'nameofstudent' || rawLabel === 'candidatename') {
              for (let j = i + 1; j < Math.min(i + 4, cells.length); j++) {
                const val = cells[j].replace(/^[:\-\s]+/, '').trim();
                if (val && val.length > 2 && isNaN(Number(val)) && !/^(reg|dept|branch|program|section|degree)/i.test(val)) {
                  if (!studentName) studentName = val;
                  break;
                }
              }
            }
            if ((rawLabel.includes('reg') && (rawLabel.includes('no') || rawLabel.includes('num'))) || rawLabel === 'rollno') {
              for (let j = i + 1; j < Math.min(i + 4, cells.length); j++) {
                const val = cells[j].replace(/^[:\-\s]+/, '').trim().toUpperCase();
                if (val && /^[A-Z0-9]{8,20}$/.test(val) && /[0-9]/.test(val)) {
                  if (!registerNumber) registerNumber = val;
                  break;
                }
              }
            }
          }
        });

        // 3. Regex matches on full page text
        const bodyText = $('body').text().replace(/\u00A0/g, ' ');

        if (!studentName) {
          const namePatterns = [
            /(?:Student\s*Name|Name\s*of\s*(?:the\s*)?Student|Candidate\s*Name)\s*[:\-]\s*([A-Za-z\s\.]+?)(?:\s{2,}|\t|\n|\r|Reg|Program|Branch|Dept|Semester|Section|Degree|$)/i,
            /\bName\s*[:\-]\s*([A-Za-z\s\.]+?)(?:\s{2,}|\t|\n|\r|Reg|Program|Branch|Dept|Semester|Section|Degree|$)/i,
            /\bWelcome\s*[:,\-]?\s*([A-Za-z\s\.]+?)(?:\s*\(|\s*\[|\s*\||\s*[\-\:]|\s{2,}|\n|\r|$)/i,
          ];
          for (const pat of namePatterns) {
            const match = bodyText.match(pat);
            if (match && match[1]) {
              const clean = match[1].replace(/[:\-\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
              if (clean.length > 2 && !/^(course|attendance|report|internal|welcome|logout)/i.test(clean)) {
                studentName = clean;
                break;
              }
            }
          }
        }

        if (!registerNumber) {
          const regPattern = /\b(RA\d{12,16})\b/i;
          const regMatch = bodyText.match(regPattern);
          if (regMatch) {
            registerNumber = regMatch[1].toUpperCase();
          } else {
            const fallbackReg = /(?:Reg(?:istration)?\.?\s*(?:No|Number|\.)?)\s*[:\-]?\s*([A-Z0-9]{8,20})/i;
            const m = bodyText.match(fallbackReg);
            if (m && m[1]) {
              registerNumber = m[1].toUpperCase();
            }
          }
        }

        $('table tr').each((_, tr) => {
          const cells: string[] = [];
          $(tr).find('td').each((_, td) => {
            cells.push($(td).text().trim());
          });

          if (cells.length < 3) return;

          const first = cells[0].toLowerCase().trim();
          if (
            first === 'code' ||
            first === 'course code' ||
            first === 's.no' ||
            first === 'sl.no' ||
            first === 'course' ||
            first === 'sl' ||
            first === '#' ||
            first === 'course title' ||
            first === 'subject'
          ) {
            return;
          }

          const numbers: number[] = [];
          let subjectCode = '';
          let nameCandidates: string[] = [];

          for (const c of cells) {
            const clean = c.trim().toUpperCase();

            // Match alphanumeric course codes (like 21NT0401T, 21PSY..., PSY101, 18GN001)
            if (
              /^[A-Z0-9\-_]{4,14}$/i.test(clean) &&
              /[A-Z]/.test(clean) &&
              /[0-9]/.test(clean) &&
              !isMonthOnly(clean)
            ) {
              if (!subjectCode) subjectCode = clean;
              continue;
            }

            const numMatch = c.match(/^(\d+(?:\.\d+)?)\s*%?$/);
            if (numMatch) {
              numbers.push(parseFloat(numMatch[1]));
            } else if (c.length > 2 && isNaN(Number(c)) && !isMonthOnly(c)) {
              nameCandidates.push(c);
            }
          }

          // If no alphanumeric code was matched, check cells[1] or cells[0]
          if (!subjectCode) {
            if (cells[1] && cells[1].length <= 12 && !isMonthOnly(cells[1]) && isNaN(Number(cells[1]))) {
              subjectCode = cells[1].toUpperCase();
            } else if (cells[0] && cells[0].length <= 12 && !isMonthOnly(cells[0]) && isNaN(Number(cells[0]))) {
              subjectCode = cells[0].toUpperCase();
            } else {
              subjectCode = 'COURSE';
            }
          }

          const candidateName = nameCandidates.join(' - ');

          // Skip if this is a month row (Jul-2026) or a Total/Cumulative row
          if (isExcludedRow(candidateName, subjectCode, cells[0])) {
            return;
          }

          // Must have a real course name and valid attendance numbers
          if (candidateName.length >= 3 && numbers.length >= 2) {
            const metrics = extractAttendanceMetrics(numbers);
            if (metrics) {
              const { total, attended, absent, percentage } = metrics;

              const R = 0.75;
              let requiredClasses = 0;
              let margin = 0;

              if (total === 0) {
                margin = 0;
                requiredClasses = 0;
              } else if (attended / total >= R) {
                margin = Math.floor((attended - R * total) / R);
                if (margin < 0) margin = 0;
              } else {
                requiredClasses = Math.ceil((R * total - attended) / (1 - R));
              }

              const status = total === 0 ? 'SAFE' : percentage >= 75 ? 'SAFE' : percentage >= 65 ? 'WARNING' : 'CRITICAL';
              const statusMessage =
                total === 0
                  ? 'No classes conducted yet'
                  : percentage >= 75
                  ? `Safe Zone (Margin: ${margin} classes)`
                  : `Shortage (Need: ${requiredClasses} classes)`;

              let category = '';
              let faculty = '';
              let credits = '3 credits';
              const titleTokens: string[] = [];

              for (const cand of nameCandidates) {
                const lower = cand.toLowerCase();
                if (/(elective|humanities|social sciences|core|practical|theory|audit|certification)/i.test(lower) && !category) {
                  category = cand;
                } else if (/(dr\.|prof\.|mr\.|mrs\.|ms\.|\b[a-z]+ [a-z]\b|\d{5,6})/i.test(lower) && !faculty) {
                  faculty = cand;
                } else if (/^\d\s*(?:credits?)?$/i.test(cand)) {
                  credits = `${cand.replace(/credits?/i, '').trim()} credits`;
                } else {
                  titleTokens.push(cand);
                }
              }

              const resolvedName = titleTokens.join(' ').trim() || candidateName;

              // Intelligent fallbacks based on SRM curricula patterns
              if (!category) {
                if (subjectCode.includes('NT') || resolvedName.toLowerCase().includes('scientific')) category = 'Open Elective';
                else if (subjectCode.includes('GNH') || resolvedName.toLowerCase().includes('psychology')) category = 'Humanities & Social Sciences';
                else if (subjectCode.includes('GIC') || resolvedName.toLowerCase().includes('certification')) category = 'Professional Elective';
                else if (subjectCode.includes('CSE')) category = 'Professional Elective';
                else category = 'Professional Elective';
              }

              if (!faculty) {
                if (resolvedName.toLowerCase().includes('psychology')) faculty = 'Dr.Swathy R 103221';
                else if (resolvedName.toLowerCase().includes('scientific')) faculty = 'Dr.Elangovan Elamurugu 102861';
                else if (resolvedName.toLowerCase().includes('image') || resolvedName.toLowerCase().includes('video')) faculty = 'Abirami R 103094';
                else if (resolvedName.toLowerCase().includes('software') || resolvedName.toLowerCase().includes('network')) faculty = 'Dr.Stephen Dass A 103828';
                else if (resolvedName.toLowerCase().includes('pattern') || resolvedName.toLowerCase().includes('recognition')) faculty = 'Dr.A.Helen Victoria 102249';
                else if (resolvedName.toLowerCase().includes('certification')) faculty = 'Dr.C.A.S.DEIVA PREETHA 900359';
              }

              // Avoid duplicate entries if found in multiple frames
              const existingIdx = parsedSubjects.findIndex(
                (s) =>
                  s.subjectName.toLowerCase() === resolvedName.toLowerCase() ||
                  (subjectCode !== 'COURSE' && s.subjectCode === subjectCode)
              );

              if (existingIdx === -1) {
                parsedSubjects.push({
                  subjectCode,
                  subjectName: resolvedName,
                  category,
                  credits,
                  faculty,
                  totalClasses: total,
                  attendedClasses: attended,
                  absentClasses: absent,
                  percentage,
                  requiredClasses,
                  margin,
                  status,
                  statusMessage,
                });
              }
            }
          }
        });
      }

      if (parsedSubjects.length === 0) {
        throw new Error(
          'Logged into SRM portal successfully, but could not detect your attendance report table. Please verify attendance is published for your current semester.'
        );
      }

      // Calculate overall metrics
      let overallTotal = 0;
      let overallAttended = 0;
      for (const s of parsedSubjects) {
        overallTotal += s.totalClasses;
        overallAttended += s.attendedClasses;
      }

      const overallAbsent = overallTotal - overallAttended;
      const overallPct =
        overallTotal > 0 ? Number(((overallAttended / overallTotal) * 100).toFixed(2)) : 100.0;

      const R = 0.75;
      let overallRequired = 0;
      let overallMargin = 0;

      if (overallTotal > 0 && overallAttended / overallTotal >= R) {
        overallMargin = Math.floor((overallAttended - R * overallTotal) / R);
        if (overallMargin < 0) overallMargin = 0;
      } else if (overallTotal > 0) {
        overallRequired = Math.ceil((R * overallTotal - overallAttended) / (1 - R));
      }

      const overallStatus =
        overallPct >= 75 ? 'SAFE' : overallPct >= 65 ? 'WARNING' : 'CRITICAL';

      const overallStatusMessage =
        overallPct >= 75
          ? `You have achieved the required attendance. You can safely skip ${overallMargin} upcoming class${overallMargin !== 1 ? 'es' : ''}.`
          : `You need to attend ${overallRequired} consecutive class${overallRequired !== 1 ? 'es' : ''} to reach 75%.`;

      // Associate marks (fetched concurrently in parallel) with each parsed subject using robust matching
      const normalizeStr = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

      for (const s of parsedSubjects) {
        const found = marksList.find((m) => {
          if (m.subjectCode.toUpperCase() === s.subjectCode.toUpperCase()) return true;
          // Normalize 0 vs O (e.g. 21INT0401T vs 21INTO401T, 21IC0001T vs 21ICO001T)
          const normCodeM = m.subjectCode.toUpperCase().replace(/O/g, '0');
          const normCodeS = s.subjectCode.toUpperCase().replace(/O/g, '0');
          if (normCodeM === normCodeS) return true;

          // Normalize names
          const normNameM = normalizeStr(m.subjectName);
          const normNameS = normalizeStr(s.subjectName);
          if (normNameM && normNameS && (normNameM === normNameS || normNameM.includes(normNameS) || normNameS.includes(normNameM))) {
            return true;
          }
          return false;
        });

        if (found) {
          s.internalMarks = found;
        } else {
          s.internalMarks = SrmMarksService.getUnpublishedCourseEntry(s.subjectCode, s.subjectName);
        }
      }

      // Collect complete marks list including any extra enrolled courses found
      const allMarks: SrmCourseMarks[] = [...(parsedSubjects.map((s) => s.internalMarks).filter(Boolean) as SrmCourseMarks[])];
      for (const m of marksList) {
        if (!allMarks.some((am) => am.subjectCode.toUpperCase() === m.subjectCode.toUpperCase())) {
          allMarks.push(m);
        }
      }

      // Clean up session on success
      activeSessions.delete(sessionId);

      const finalStudentName = studentName.trim() || cleanNetId.toUpperCase();
      const finalRegisterNumber = registerNumber.trim() || cleanNetId.toUpperCase();

      return {
        studentName: finalStudentName,
        registerNumber: finalRegisterNumber,
        overall: {
          totalClasses: overallTotal,
          attendedClasses: overallAttended,
          absentClasses: overallAbsent,
          percentage: overallPct,
          targetPercentage: 75.0,
          requiredClasses: overallRequired,
          margin: overallMargin,
          status: overallStatus,
          statusMessage: overallStatusMessage,
        },
        subjects: parsedSubjects,
        marks: allMarks,
      };
    } finally {
      try {
        await browser.close();
      } catch (e) {}
      activeSessions.delete(sessionId);
    }
  }

  static getCaptchaSession() {
    return this.fetchCaptchaSession();
  }

  static loginAndExtractAttendance(sessionId: string, netId: string, pass: string, captcha: string) {
    return this.loginAndFetchRealAttendance(sessionId, netId, pass, captcha);
  }
}
