import { Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class AttendanceController {
  static async getLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { subjectId, limit = 50 } = req.query;

      const whereClause: any = { userId };
      if (subjectId && typeof subjectId === 'string') {
        whereClause.subjectId = subjectId;
      }

      const logs = await prisma.attendanceLog.findMany({
        where: whereClause,
        include: {
          subject: {
            select: {
              id: true,
              subjectName: true,
              subjectCode: true,
              color: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        take: Number(limit),
      });

      res.json({ logs });
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      res.status(500).json({ error: 'Failed to retrieve attendance logs.' });
    }
  }

  static async deleteLog(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const log = await prisma.attendanceLog.findFirst({
        where: { id, userId },
        include: { subject: true },
      });

      if (!log) {
        res.status(404).json({ error: 'Attendance log entry not found.' });
        return;
      }

      // Revert subject counts if PRESENT or ABSENT
      if (log.subject) {
        let newTotal = log.subject.totalClasses;
        let newAttended = log.subject.attendedClasses;

        if (log.status === 'PRESENT') {
          newTotal = Math.max(0, newTotal - 1);
          newAttended = Math.max(0, newAttended - 1);
        } else if (log.status === 'ABSENT') {
          newTotal = Math.max(0, newTotal - 1);
        }

        await prisma.subject.update({
          where: { id: log.subjectId },
          data: {
            totalClasses: newTotal,
            attendedClasses: newAttended,
          },
        });
      }

      await prisma.attendanceLog.delete({ where: { id } });

      res.json({ message: 'Attendance log entry removed and class counts reverted.' });
    } catch (err: any) {
      console.error('Error reverting log:', err);
      res.status(500).json({ error: 'Failed to delete attendance log.' });
    }
  }

  static async exportCsv(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const subjects = await prisma.subject.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });

      const header = 'Subject Code,Subject Name,Total Classes,Attended Classes,Absent Classes,Attendance Percentage\n';
      const rows = subjects
        .map((s) => {
          const absent = s.totalClasses - s.attendedClasses;
          const pct = s.totalClasses > 0 ? ((s.attendedClasses / s.totalClasses) * 100).toFixed(2) : '100.00';
          return `"${s.subjectCode || ''}","${s.subjectName.replace(/"/g, '""')}",${s.totalClasses},${s.attendedClasses},${absent},${pct}%`;
        })
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="attendwise_attendance.csv"');
      res.status(200).send(header + rows);
    } catch (err: any) {
      console.error('Error exporting CSV:', err);
      res.status(500).json({ error: 'Failed to export attendance CSV.' });
    }
  }
}

