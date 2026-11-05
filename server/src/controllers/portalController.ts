import { Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { SrmPortalService, ParsedSubjectAttendance } from '../services/srmPortalService';
import { TableParserService } from '../services/tableParserService';

const SUBJECT_COLORS = [
  '#3B82F6',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#EC4899',
  '#06B6D4',
  '#6366F1',
];

export class PortalController {
  /**
   * Fetches the live CAPTCHA image and creates a portal session
   */
  static async getSrmCaptcha(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const captchaInfo = await SrmPortalService.getCaptchaSession();
      res.json(captchaInfo);
    } catch (err: any) {
      console.error('Error getting SRM captcha:', err);
      res.status(500).json({ error: 'Failed to connect to SRMIST portal. Please try again.' });
    }
  }

  /**
   * Submits credentials & CAPTCHA to SRMIST portal and syncs attendance
   */
  static async syncSrm(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { sessionId, netId, password, captcha } = req.body;

      if (!sessionId || !netId || !password || !captcha) {
        res.status(400).json({ error: 'Session ID, NetID, Password, and CAPTCHA are required.' });
        return;
      }

      const result = await SrmPortalService.loginAndExtractAttendance(
        sessionId,
        netId,
        password,
        captcha
      );

      const savedSubjects = await PortalController.upsertParsedSubjects(userId, result.subjects);

      res.json({
        message: 'Successfully synced attendance from SRMIST Student Portal!',
        studentName: result.studentName,
        rollNumber: result.registerNumber,
        isSimulated: false,
        syncedCount: savedSubjects.length,
        subjects: savedSubjects,
      });
    } catch (err: any) {
      console.error('Error syncing with SRM portal:', err);
      res.status(400).json({ error: err.message || 'Failed to authenticate with SRMIST portal.' });
    }
  }

  /**
   * Parses user-copied attendance table or CSV and syncs into database
   */
  static async parsePastedTable(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { rawContent } = req.body;

      if (!rawContent || !rawContent.trim()) {
        res.status(400).json({ error: 'Please paste your portal table text or HTML.' });
        return;
      }

      const parsed = TableParserService.parsePastedData(rawContent);
      const savedSubjects = await PortalController.upsertParsedSubjects(userId, parsed);

      res.json({
        message: `Successfully imported ${savedSubjects.length} subject attendance records!`,
        syncedCount: savedSubjects.length,
        subjects: savedSubjects,
      });
    } catch (err: any) {
      console.error('Error parsing pasted table:', err);
      res.status(400).json({ error: err.message || 'Failed to parse attendance table data.' });
    }
  }

  /**
   * Helper to upsert parsed subjects without duplicating existing ones
   */
  private static async upsertParsedSubjects(
    userId: string,
    parsedList: ParsedSubjectAttendance[]
  ): Promise<any[]> {
    const existing = await prisma.subject.findMany({ where: { userId } });
    const existingByCode = new Map(existing.filter((s) => s.subjectCode).map((s) => [s.subjectCode!.toUpperCase(), s]));
    const existingByName = new Map(existing.map((s) => [s.subjectName.toLowerCase().trim(), s]));

    const results: any[] = [];

    for (let i = 0; i < parsedList.length; i++) {
      const p = parsedList[i];
      const match =
        (p.subjectCode ? existingByCode.get(p.subjectCode.toUpperCase()) : null) ||
        existingByName.get(p.subjectName.toLowerCase().trim());

      if (match) {
        // Update existing subject
        const updated = await prisma.subject.update({
          where: { id: match.id },
          data: {
            subjectCode: p.subjectCode || match.subjectCode,
            totalClasses: p.totalClasses,
            attendedClasses: p.attendedClasses,
          },
        });
        results.push(updated);
      } else {
        // Create new subject
        const color = SUBJECT_COLORS[(existing.length + i) % SUBJECT_COLORS.length];
        const created = await prisma.subject.create({
          data: {
            userId,
            subjectCode: p.subjectCode || null,
            subjectName: p.subjectName,
            totalClasses: p.totalClasses,
            attendedClasses: p.attendedClasses,
            color,
          },
        });
        results.push(created);
      }
    }

    return results;
  }
}

