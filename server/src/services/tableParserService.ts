import * as cheerio from 'cheerio';
import { ParsedSubjectAttendance } from './srmPortalService';

export class TableParserService {
  /**
   * Parses raw copied content (either raw HTML from Ctrl+C on portal, or tab-delimited text)
   */
  static parsePastedData(rawContent: string): ParsedSubjectAttendance[] {
    const trimmed = rawContent.trim();
    if (!trimmed) {
      throw new Error('Please paste attendance text or HTML.');
    }

    // 1. If it looks like HTML (has <table> or <tr> or <td>)
    if (trimmed.includes('<tr') || trimmed.includes('<td') || trimmed.includes('<table')) {
      return this.parseHtmlTable(trimmed);
    }

    // 2. Otherwise parse plain text / CSV / tab-separated rows
    return this.parseDelimitedText(trimmed);
  }

  private static parseHtmlTable(html: string): ParsedSubjectAttendance[] {
    const $ = cheerio.load(html);
    const results: ParsedSubjectAttendance[] = [];

    $('tr').each((_, tr) => {
      const cells: string[] = [];
      $(tr)
        .find('th, td')
        .each((_, td) => {
          cells.push($(td).text().trim());
        });

      if (cells.length >= 3) {
        const parsed = this.interpretRowCells(cells);
        if (parsed) {
          results.push(parsed);
        }
      }
    });

    if (results.length === 0) {
      throw new Error('Could not identify any course attendance rows from the pasted HTML.');
    }

    return results;
  }

  private static parseDelimitedText(text: string): ParsedSubjectAttendance[] {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const results: ParsedSubjectAttendance[] = [];

    for (const line of lines) {
      // Split by tabs or commas or multiple spaces
      const delimiter = line.includes('\t') ? '\t' : line.includes(',') ? ',' : /\s{2,}/;
      const cells = line.split(delimiter).map((c) => c.trim()).filter(Boolean);

      if (cells.length >= 3) {
        const parsed = this.interpretRowCells(cells);
        if (parsed) {
          results.push(parsed);
        }
      }
    }

    if (results.length === 0) {
      throw new Error('Could not parse subject attendance rows. Ensure your text includes subject names, total classes, and attended classes.');
    }

    return results;
  }

  /**
   * Intelligently maps an array of table column strings to subject fields
   */
  private static interpretRowCells(cells: string[]): ParsedSubjectAttendance | null {
    // Exclude common header rows and monthly breakdowns
    const firstCell = cells[0].toLowerCase().trim();
    if (
      firstCell === 's.no' ||
      firstCell === 'sl.no' ||
      firstCell === '#' ||
      firstCell === 'course code' ||
      firstCell === 'subject code' ||
      firstCell === 'subject' ||
      firstCell === 'course title'
    ) {
      return null;
    }

    // Exclude monthly breakdown rows (e.g. Jul-2026, Aug-2026, etc.) and summary rows
    const isMonthString = (str: string): boolean => {
      const clean = str.trim().toLowerCase();
      return /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*([\s\-_/]+(20\d\d|\d{2}))?$/i.test(clean);
    };
    const isTotalKeyword = (str: string): boolean => {
      return /^(total|cumulative|cummulative|overall|grand\s*total|summary)/i.test(str.trim());
    };

    if (
      isMonthString(cells[0]) ||
      isTotalKeyword(cells[0]) ||
      (cells[1] && (isMonthString(cells[1]) || isTotalKeyword(cells[1])))
    ) {
      return null;
    }

    // Find numeric cells (integers and percentages)
    const numbers: number[] = [];
    let nameCandidates: string[] = [];
    let codeCandidate = '';

    for (const cell of cells) {
      // Check if it's a code like "21CSC302J", "21NT0401T", "PSY101"
      if (/^[A-Z0-9\-_]{4,14}$/i.test(cell) && /[A-Z]/.test(cell) && /[0-9]/.test(cell) && !codeCandidate && !isMonthString(cell)) {
        codeCandidate = cell.toUpperCase();
        continue;
      }

      // Check if pure integer or float percentage
      const numMatch = cell.match(/^(\d+(?:\.\d+)?)\s*%?$/);
      if (numMatch) {
        numbers.push(parseFloat(numMatch[1]));
      } else if (cell.length > 2 && isNaN(Number(cell)) && !isMonthString(cell)) {
        nameCandidates.push(cell);
      }
    }

    if (nameCandidates.length === 0 || numbers.length < 2) {
      return null;
    }

    // Exact metrics extraction avoiding S.No confusion
    let metrics: { total: number; attended: number; absent: number; percentage: number } | null = null;
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
            metrics = { total: t, attended: a, absent: expectedAbsent, percentage: Number(expectedPct.toFixed(2)) };
            break;
          }
        }
      }
      if (metrics) break;
    }

    if (!metrics) {
      const validInts = numbers.filter((n) => Number.isInteger(n) && n <= 500 && n >= 0);
      if (validInts.length >= 2) {
        let ints = [...validInts];
        if (ints.length >= 3 && ints[0] <= 25 && (ints[1] > ints[0] || ints[2] > ints[0])) {
          ints = ints.slice(1);
        }
        const t = Math.max(ints[0], ints[1]);
        const a = Math.min(ints[0], ints[1]);
        metrics = { total: t, attended: a, absent: t - a, percentage: t > 0 ? Number(((a / t) * 100).toFixed(2)) : 100.0 };
      }
    }

    if (!metrics || metrics.total === 0) return null;

    const code = codeCandidate || (cells[1] && cells[1].length <= 12 && isNaN(Number(cells[1])) ? cells[1].toUpperCase() : 'COURSE');
    const subjectName = nameCandidates.join(' - ');
    const { total, attended, absent, percentage } = metrics;

    const R = 0.75;
    let requiredClasses = 0;
    let margin = 0;

    if (total > 0 && attended / total >= R) {
      margin = Math.floor((attended - R * total) / R);
      if (margin < 0) margin = 0;
    } else if (total > 0) {
      requiredClasses = Math.ceil((R * total - attended) / (1 - R));
    }

    const status = percentage >= 75 ? 'SAFE' : percentage >= 65 ? 'WARNING' : 'CRITICAL';
    const statusMessage = percentage >= 75 ? 'Safe Zone' : 'Shortage';

    return {
      subjectCode: code,
      subjectName,
      totalClasses: total,
      attendedClasses: attended,
      absentClasses: absent,
      percentage,
      requiredClasses,
      margin,
      status,
      statusMessage,
    };
  }
}

