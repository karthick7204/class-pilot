import { Request, Response } from 'express';
import { simulateAttendance, calculateAttendanceMetrics } from '../services/calculationEngine';

export class CalculatorController {
  static simulate(req: Request, res: Response): void {
    try {
      const {
        totalClasses = 0,
        attendedClasses = 0,
        futureMissed = 0,
        futureAttended = 0,
        targetPercentage = 75.0,
      } = req.body;

      const total = Number(totalClasses);
      const attended = Number(attendedClasses);
      const missed = Number(futureMissed);
      const futureAtt = Number(futureAttended);
      const target = Number(targetPercentage);

      const simulation = simulateAttendance(total, attended, missed, futureAtt, target);
      const currentMetrics = calculateAttendanceMetrics(total, attended, target);

      res.json({
        simulation,
        currentMetrics,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Invalid calculation parameters.' });
    }
  }
}

