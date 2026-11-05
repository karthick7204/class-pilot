import { Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { calculateAttendanceMetrics } from '../services/calculationEngine';

const SUBJECT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

export class SubjectController {
  static async getSubjects(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { targetPercentage: true },
      });

      const userTarget = user?.targetPercentage || 75.0;

      const subjects = await prisma.subject.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });

      let overallTotal = 0;
      let overallAttended = 0;

      const enhancedSubjects = subjects.map((sub) => {
        overallTotal += sub.totalClasses;
        overallAttended += sub.attendedClasses;

        const effectiveTarget = sub.targetOverride || userTarget;
        const metrics = calculateAttendanceMetrics(
          sub.totalClasses,
          sub.attendedClasses,
          effectiveTarget
        );

        return {
          id: sub.id,
          subjectCode: sub.subjectCode,
          subjectName: sub.subjectName,
          teacherName: sub.teacherName,
          color: sub.color || '#3B82F6',
          targetOverride: sub.targetOverride,
          ...metrics,
          updatedAt: sub.updatedAt,
        };
      });

      const overallMetrics = calculateAttendanceMetrics(
        overallTotal,
        overallAttended,
        userTarget
      );

      res.json({
        subjects: enhancedSubjects,
        overall: overallMetrics,
      });
    } catch (err: any) {
      console.error('Error fetching subjects:', err);
      res.status(500).json({ error: 'Failed to retrieve subject attendance data.' });
    }
  }

  static async createSubject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { subjectName, subjectCode, teacherName, totalClasses, attendedClasses, targetOverride, color } = req.body;

      if (!subjectName || !subjectName.trim()) {
        res.status(400).json({ error: 'Subject name is required.' });
        return;
      }

      const total = Number(totalClasses) || 0;
      const attended = Number(attendedClasses) || 0;

      if (attended > total) {
        res.status(400).json({ error: 'Attended classes cannot exceed total classes conducted.' });
        return;
      }

      // Pick a rotating default color if none provided
      const existingCount = await prisma.subject.count({ where: { userId } });
      const chosenColor = color || SUBJECT_COLORS[existingCount % SUBJECT_COLORS.length];

      const newSubject = await prisma.subject.create({
        data: {
          userId,
          subjectName: subjectName.trim(),
          subjectCode: subjectCode?.trim() || null,
          teacherName: teacherName?.trim() || null,
          totalClasses: total,
          attendedClasses: attended,
          targetOverride: targetOverride ? Number(targetOverride) : null,
          color: chosenColor,
        },
      });

      res.status(201).json({ message: 'Subject created successfully.', subject: newSubject });
    } catch (err: any) {
      console.error('Error creating subject:', err);
      res.status(500).json({ error: 'Failed to create subject.' });
    }
  }

  static async updateSubject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { subjectName, subjectCode, teacherName, totalClasses, attendedClasses, targetOverride, color } = req.body;

      const existing = await prisma.subject.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Subject not found.' });
        return;
      }

      const total = totalClasses !== undefined ? Number(totalClasses) : existing.totalClasses;
      const attended = attendedClasses !== undefined ? Number(attendedClasses) : existing.attendedClasses;

      if (attended > total) {
        res.status(400).json({ error: 'Attended classes cannot exceed total classes conducted.' });
        return;
      }

      const updated = await prisma.subject.update({
        where: { id },
        data: {
          subjectName: subjectName ? subjectName.trim() : existing.subjectName,
          subjectCode: subjectCode !== undefined ? (subjectCode?.trim() || null) : existing.subjectCode,
          teacherName: teacherName !== undefined ? (teacherName?.trim() || null) : existing.teacherName,
          totalClasses: total,
          attendedClasses: attended,
          targetOverride: targetOverride !== undefined ? (targetOverride ? Number(targetOverride) : null) : existing.targetOverride,
          color: color || existing.color,
        },
      });

      res.json({ message: 'Subject updated successfully.', subject: updated });
    } catch (err: any) {
      console.error('Error updating subject:', err);
      res.status(500).json({ error: 'Failed to update subject.' });
    }
  }

  static async deleteSubject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const existing = await prisma.subject.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Subject not found.' });
        return;
      }

      await prisma.subject.delete({ where: { id } });
      res.json({ message: 'Subject deleted successfully.' });
    } catch (err: any) {
      console.error('Error deleting subject:', err);
      res.status(500).json({ error: 'Failed to delete subject.' });
    }
  }

  /**
   * Quick-logs a session (e.g. today's class) as PRESENT, ABSENT, or CANCELLED
   */
  static async quickLog(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { status, notes, date } = req.body; // status: "PRESENT" | "ABSENT" | "CANCELLED"

      if (!status || !['PRESENT', 'ABSENT', 'CANCELLED'].includes(status)) {
        res.status(400).json({ error: 'Status must be PRESENT, ABSENT, or CANCELLED.' });
        return;
      }

      const subject = await prisma.subject.findFirst({
        where: { id, userId },
      });

      if (!subject) {
        res.status(404).json({ error: 'Subject not found.' });
        return;
      }

      // Record log entry
      const log = await prisma.attendanceLog.create({
        data: {
          userId,
          subjectId: id,
          status,
          notes: notes?.trim() || null,
          date: date ? new Date(date) : new Date(),
        },
      });

      // Update subject counts
      let updatedTotal = subject.totalClasses;
      let updatedAttended = subject.attendedClasses;

      if (status === 'PRESENT') {
        updatedTotal += 1;
        updatedAttended += 1;
      } else if (status === 'ABSENT') {
        updatedTotal += 1;
      } // If CANCELLED, neither conducted nor attended changes

      const updatedSubject = await prisma.subject.update({
        where: { id },
        data: {
          totalClasses: updatedTotal,
          attendedClasses: updatedAttended,
        },
      });

      res.json({
        message: `Marked class as ${status}`,
        subject: updatedSubject,
        log,
      });
    } catch (err: any) {
      console.error('Error in quickLog:', err);
      res.status(500).json({ error: 'Failed to record attendance session.' });
    }
  }
}

