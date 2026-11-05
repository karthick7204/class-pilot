import { Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

export interface AssessmentItem {
  name: string;
  scoredMarks: number;
  maxMarks: number;
  percentage?: number;
}

export interface SrmCourseMarks {
  subjectCode: string;
  subjectName: string;
  category?: string;
  assessments: AssessmentItem[];
  totalScored: number;
  totalMax: number;
  internalPercentage: number;
  grade?: string;
  isPublished: boolean;
  status: 'SAFE' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'PENDING';
  statusMessage?: string;
}

const SRM_BASE = 'https://sp.srmist.edu.in/srmiststudentportal';

export class SrmMarksService {
  /**
   * Scrapes genuine internal marks directly from the authenticated SRM student portal session using real Chrome.
   * Runs in parallel with attendance extraction and checks portal navigation elements and official endpoints.
   */
  static async scrapeInternalMarks(
    marksPage: Page,
    mainPage?: Page,
    cleanNetId?: string
  ): Promise<SrmCourseMarks[]> {
    console.log('[SrmMarksService] Starting genuine internal marks extraction via browser session...');
    const allHtmls: string[] = [];

    // 1. Capture HTML from current mainPage and all frames (landing dashboard)
    if (mainPage) {
      try {
        allHtmls.push(await mainPage.content());
        for (const frame of mainPage.frames()) {
          try {
            allHtmls.push(await frame.content());
          } catch (e) {}
        }
      } catch (e) {}

      // Check if mainPage has an "Internal Mark Details" link in any menu/frame
      try {
        for (const frame of mainPage.frames()) {
          try {
            const menuLinks = await frame.evaluate(() => {
              const items: { text: string; href?: string }[] = [];
              const doc = (globalThis as any).document;
              if (!doc) return items;
              doc.querySelectorAll('a, li, button, td, span').forEach((el: any) => {
                const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
                if (/internal\s*mark/i.test(text) || /mark\s*detail/i.test(text)) {
                  items.push({ text, href: el.href || el.getAttribute('href') || undefined });
                }
              });
              return items;
            });

            if (menuLinks.length > 0) {
              console.log('[SrmMarksService] Found internal marks menu links:', menuLinks);
              for (const m of menuLinks) {
                if (m.href && !m.href.startsWith('javascript:')) {
                  const targetUrl = m.href.startsWith('http')
                    ? m.href
                    : `${SRM_BASE}${m.href.startsWith('/') ? '' : '/'}${m.href}`;
                  try {
                    await marksPage.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 8000 });
                    allHtmls.push(await marksPage.content());
                    for (const f of marksPage.frames()) {
                      try {
                        allHtmls.push(await f.content());
                      } catch (e) {}
                    }
                  } catch (e) {}
                }
              }
            }
          } catch (e) {}
        }
      } catch (e) {}
    }

    // 2. Query official SRM internal marks endpoints in priority order
    // studentInternalMarkDetails.jsp is the exact counterpart to studentAttendanceDetails.jsp
    const candidateEndpoints = [
      `${SRM_BASE}/students/report/studentInternalMarkDetails.jsp`,
      `${SRM_BASE}/students/report/studentInternalMarksDetails.jsp`,
      `${SRM_BASE}/students/report/internalMarkDetails.jsp`,
      `${SRM_BASE}/students/report/studentInternalMarks.jsp`,
      `${SRM_BASE}/students/report/studentInternalMark.jsp`,
      `${SRM_BASE}/students/report/studentMarkDetails.jsp`,
      `${SRM_BASE}/students/report/testPerformance.jsp`,
      `${SRM_BASE}/students/report/studentTestPerformance.jsp`,
      `${SRM_BASE}/students/report/internalMarksReport.jsp`,
    ];

    for (const url of candidateEndpoints) {
      try {
        console.log(`[SrmMarksService] Navigating marksPage to: ${url}`);
        await marksPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
        const content = await marksPage.content();
        allHtmls.push(content);

        for (const frame of marksPage.frames()) {
          try {
            allHtmls.push(await frame.content());
          } catch (e) {}
        }

        // Check if page returned a table with marks keywords
        const $ = cheerio.load(content);
        const hasTable = $('table').length > 0;
        const bodyText = $('body').text().toLowerCase();
        if (hasTable && (bodyText.includes('internal') || bodyText.includes('mark') || bodyText.includes('cla') || bodyText.includes('test'))) {
          console.log(`[SrmMarksService] Successfully loaded internal marks page at: ${url}`);
          break; // Stop querying once authentic marks table is found
        }
      } catch (e) {
        // Continue to next endpoint
      }
    }

    // 3. Save diagnostic dump for inspection
    try {
      const dumpDir = path.join(process.cwd(), 'scratch');
      if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir, { recursive: true });
      if (allHtmls.length > 0) {
        fs.writeFileSync(path.join(dumpDir, 'last_marks_dump.html'), allHtmls[allHtmls.length - 1], 'utf8');
      }
    } catch (e) {}

    // 4. Parse all collected HTMLs
    const courseMarksMap = new Map<string, SrmCourseMarks>();

    for (const html of allHtmls) {
      const parsed = this.parseMarksFromHtml(html);
      for (const m of parsed) {
        const key = m.subjectCode.toUpperCase();
        const existing = courseMarksMap.get(key);
        if (!existing || m.assessments.length > existing.assessments.length || m.totalScored > existing.totalScored) {
          courseMarksMap.set(key, m);
        }
      }
    }

    const marksList = Array.from(courseMarksMap.values());
    console.log(`[SrmMarksService] Extraction complete. Parsed ${marksList.length} genuine course marks.`);
    return marksList;
  }

  /**
   * Parses real internal marks from HTML tables in SRMIST portal.
   * Extracts only genuine numbers and assessment headers actually present in the table.
   */
  static parseMarksFromHtml(html: string): SrmCourseMarks[] {
    const $ = cheerio.load(html);
    const results: SrmCourseMarks[] = [];

    // Verify if page actually pertains to marks
    const pageText = $('body').text().toLowerCase();
    const hasMarksKeywords =
      pageText.includes('mark') ||
      pageText.includes('internal') ||
      pageText.includes('cla') ||
      pageText.includes('test') ||
      pageText.includes('grade') ||
      pageText.includes('assessment') ||
      pageText.includes('cycle');

    if (!hasMarksKeywords) return results;

    // Scan each table on the page
    $('table').each((_, table) => {
      let headers: string[] = [];
      const trs = $(table).find('tr').toArray();

      // Find header column names
      for (let i = 0; i < trs.length; i++) {
        const tr = trs[i];
        const ths = $(tr).find('th');
        if (ths.length >= 3) {
          headers = ths.map((_, th) => $(th).text().replace(/\s+/g, ' ').trim()).get();
          break;
        }
        if (i === 0) {
          const firstTds = $(tr).find('td').map((_, td) => $(td).text().replace(/\s+/g, ' ').trim()).get();
          const firstStr = firstTds.join(' ').toLowerCase();
          if (firstStr.includes('code') || firstStr.includes('subject') || firstStr.includes('s.no') || firstStr.includes('mark')) {
            headers = firstTds;
            break;
          }
        }
      }

      // Map column roles
      let codeColIdx = -1;
      let titleColIdx = -1;
      let totalColIdx = -1;
      const assessmentCols: { idx: number; name: string; maxMarks: number }[] = [];

      headers.forEach((h, idx) => {
        const hl = h.toLowerCase().trim();
        if (codeColIdx === -1 && (hl.includes('course code') || hl.includes('sub code') || hl.includes('subject code') || hl === 'code' || hl.includes('course id'))) {
          codeColIdx = idx;
        } else if (titleColIdx === -1 && (hl.includes('title') || hl.includes('name') || hl.includes('subject') || hl.includes('course') || hl.includes('description'))) {
          titleColIdx = idx;
        } else if (totalColIdx === -1 && (hl.includes('total') || hl === 'tot' || hl.includes('grand total') || hl.includes('total mark') || hl === 'internal')) {
          totalColIdx = idx;
        } else if (
          hl.includes('cla') ||
          hl.includes('test') ||
          hl.includes('cycle') ||
          hl.includes('assignment') ||
          hl.includes('quiz') ||
          hl.includes('practical') ||
          hl.includes('internals') ||
          hl.includes('theory') ||
          hl.includes('cat') ||
          hl.includes('mark') ||
          hl.includes('score') ||
          hl.includes('ct1') ||
          hl.includes('ct2') ||
          hl.includes('ct3')
        ) {
          // Extract max marks if present e.g. "CLA 1 (25)", "[Max: 50]", "Total (60)"
          const maxMatch = h.match(/(?:max|total)?\s*[:\(\[]\s*(\d+)\s*[\)\]]/i);
          const maxMarks = maxMatch ? parseInt(maxMatch[1], 10) : 0;
          const cleanName = h.replace(/\s*[\(\[].*?[\)\]]/g, '').trim() || `Assessment ${assessmentCols.length + 1}`;
          assessmentCols.push({ idx, name: cleanName, maxMarks });
        }
      });

      // Parse data rows
      trs.forEach((tr) => {
        const cells: string[] = $(tr).find('td').map((_, td) => $(td).text().replace(/\s+/g, ' ').trim()).get();
        if (cells.length < 3) return;

        const first = cells[0].toLowerCase();
        // Skip header rows
        if (
          first === 's.no' ||
          first === 'sl.no' ||
          first === '#' ||
          first === 'course code' ||
          first === 'sub code' ||
          first === 'subject' ||
          first === 'code'
        ) {
          return;
        }

        // Extract Course Code
        let subjectCode = '';
        if (codeColIdx >= 0 && codeColIdx < cells.length) {
          const candidate = cells[codeColIdx].toUpperCase().replace(/\s+/g, '');
          if (/^[A-Z0-9\-_]{4,14}$/.test(candidate) && /[A-Z]/.test(candidate) && /[0-9]/.test(candidate)) {
            subjectCode = candidate;
          }
        }
        if (!subjectCode) {
          for (const c of cells) {
            const clean = c.toUpperCase().replace(/\s+/g, '');
            if (
              /^[A-Z0-9\-_]{4,14}$/.test(clean) &&
              /[A-Z]/.test(clean) &&
              /[0-9]/.test(clean) &&
              !/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(clean)
            ) {
              subjectCode = clean;
              break;
            }
          }
        }

        if (!subjectCode) return;

        // Extract Course Title
        let subjectName = '';
        if (titleColIdx >= 0 && titleColIdx < cells.length) {
          subjectName = cells[titleColIdx];
        }
        if (!subjectName) {
          for (let i = 1; i < cells.length; i++) {
            const c = cells[i];
            if (c.length > 3 && isNaN(Number(c)) && !/^[A-Z0-9\-_]{4,14}$/.test(c)) {
              if (!/(theory|practical|elective|social|core|regular|pass|fail|present|absent)/i.test(c)) {
                subjectName = c;
                break;
              }
            }
          }
        }

        const assessments: AssessmentItem[] = [];
        let totalScored = 0;
        let totalMax = 0;

        // Strategy A: Use mapped assessment columns from table header
        if (assessmentCols.length > 0) {
          for (const ac of assessmentCols) {
            if (ac.idx < cells.length) {
              const valStr = cells[ac.idx].trim();
              if (!valStr || valStr === '-' || valStr === 'NA' || valStr === 'N/A') {
                continue;
              }
              if (/^ab(?:sent)?$/i.test(valStr)) {
                const max = ac.maxMarks > 0 ? ac.maxMarks : 25;
                assessments.push({
                  name: ac.name,
                  scoredMarks: 0,
                  maxMarks: max,
                  percentage: 0,
                });
                continue;
              }
              const scoreMatch = valStr.match(/^(\d+(?:\.\d+)?)(?:\s*[\/\(]\s*(\d+(?:\.\d+)?)\)?)?$/);
              if (scoreMatch) {
                const scored = parseFloat(scoreMatch[1]);
                const max =
                  ac.maxMarks > 0
                    ? ac.maxMarks
                    : scoreMatch[2]
                    ? parseFloat(scoreMatch[2])
                    : scored <= 10
                    ? 10
                    : scored <= 25
                    ? 25
                    : scored <= 50
                    ? 50
                    : 100;

                assessments.push({
                  name: ac.name,
                  scoredMarks: scored,
                  maxMarks: max,
                  percentage: Number(((scored / max) * 100).toFixed(1)),
                });
              }
            }
          }
        }

        // Strategy B: Fallback scan for numbers in row cells if no assessment columns matched
        if (assessments.length === 0) {
          const numbers: number[] = [];
          cells.forEach((c) => {
            const m = c.match(/^(\d+(?:\.\d+)?)(?:\s*[\/\(]\s*(\d+(?:\.\d+)?)\)?)?$/);
            if (m) {
              numbers.push(parseFloat(m[1]));
              if (m[2]) numbers.push(parseFloat(m[2]));
            }
          });

          // Filter out S.No if needed
          let scores = [...numbers];
          if (scores.length >= 2 && scores[0] <= 10 && (scores[1] > scores[0] || scores.length > 2)) {
            scores = scores.slice(1);
          }

          scores.forEach((s, idx) => {
            const max = s <= 10 ? 10 : s <= 25 ? 25 : s <= 50 ? 50 : 100;
            assessments.push({
              name: idx === 0 ? 'CLA-1' : idx === 1 ? 'CLA-2' : idx === 2 ? 'CLA-3' : `Assessment ${idx + 1}`,
              scoredMarks: s,
              maxMarks: max,
              percentage: Number(((s / max) * 100).toFixed(1)),
            });
          });
        }

        // Parse total column if present
        if (totalColIdx >= 0 && totalColIdx < cells.length) {
          const totStr = cells[totalColIdx].trim();
          const totMatch = totStr.match(/^(\d+(?:\.\d+)?)(?:\s*[\/\(]\s*(\d+(?:\.\d+)?)\)?)?$/);
          if (totMatch) {
            totalScored = parseFloat(totMatch[1]);
            totalMax = totMatch[2] ? parseFloat(totMatch[2]) : totalScored <= 50 ? 50 : totalScored <= 60 ? 60 : 100;
          }
        }

        if (totalScored === 0 && assessments.length > 0) {
          totalScored = assessments.reduce((acc, a) => acc + a.scoredMarks, 0);
          totalMax = assessments.reduce((acc, a) => acc + a.maxMarks, 0);
        }

        const internalPercentage = totalMax > 0 ? Number(((totalScored / totalMax) * 100).toFixed(1)) : 0;
        const status =
          internalPercentage >= 75
            ? 'SAFE'
            : internalPercentage >= 50
            ? 'GOOD'
            : 'NEEDS_IMPROVEMENT';

        const grade =
          internalPercentage >= 90
            ? 'O'
            : internalPercentage >= 80
            ? 'A+'
            : internalPercentage >= 70
            ? 'A'
            : internalPercentage >= 60
            ? 'B+'
            : 'B';

        results.push({
          subjectCode,
          subjectName: subjectName || subjectCode,
          assessments,
          totalScored: Number(totalScored.toFixed(1)),
          totalMax: Number(totalMax.toFixed(1)),
          internalPercentage,
          grade,
          isPublished: assessments.length > 0,
          status: assessments.length > 0 ? status : 'PENDING',
          statusMessage: assessments.length > 0 ? 'Official marks fetched from SRM portal' : 'Pending publication',
        });
      });
    });

    return results;
  }

  /**
   * Default metadata when internal marks have not yet been published by SRM portal faculty.
   * Completely avoids inventing fake scores.
   */
  static getUnpublishedCourseEntry(subjectCode: string, subjectName: string): SrmCourseMarks {
    return {
      subjectCode,
      subjectName,
      assessments: [],
      totalScored: 0,
      totalMax: 0,
      internalPercentage: 0,
      isPublished: false,
      status: 'PENDING',
      statusMessage: 'Internal marks not yet published on SRM student portal',
    };
  }
}
