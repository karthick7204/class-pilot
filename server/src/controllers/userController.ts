import { Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class UserController {
  static async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { name, targetPercentage, collegeName, department, semester } = req.body;

      const dataToUpdate: any = {};
      if (name) dataToUpdate.name = name.trim();
      if (targetPercentage !== undefined) {
        const target = Number(targetPercentage);
        if (target <= 0 || target > 100) {
          res.status(400).json({ error: 'Target percentage must be between 1 and 100.' });
          return;
        }
        dataToUpdate.targetPercentage = target;
      }
      if (collegeName !== undefined) dataToUpdate.collegeName = collegeName.trim();
      if (department !== undefined) dataToUpdate.department = department.trim();
      if (semester !== undefined) dataToUpdate.semester = Number(semester);

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: {
          id: true,
          name: true,
          studentId: true,
          email: true,
          targetPercentage: true,
          collegeName: true,
          department: true,
          semester: true,
        },
      });

      res.json({ message: 'Settings updated successfully.', user: updatedUser });
    } catch (err: any) {
      console.error('Error updating settings:', err);
      res.status(500).json({ error: 'Failed to update user settings.' });
    }
  }
}

