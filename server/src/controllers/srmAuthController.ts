import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';
import { SrmPortalService, SrmAttendanceData } from '../services/srmPortalService';
import { TableParserService } from '../services/tableParserService';
import { simulateAttendance, calculateAttendanceMetrics } from '../services/calculationEngine';

const JWT_SECRET = process.env.JWT_SECRET || 'attendwise_super_secure_jwt_secret_key_987654321';

const CACHE_DIR = path.join(process.cwd(), 'scratch');
const CACHE_FILE = path.join(CACHE_DIR, 'student_session_cache.json');

const loadDiskCache = (): Map<string, SrmAttendanceData> => {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf8');
      const obj = JSON.parse(raw);
      return new Map(Object.entries(obj));
    }
  } catch (e) {}
  return new Map();
};

const saveDiskCache = (map: Map<string, SrmAttendanceData>) => {
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    const obj = Object.fromEntries(map.entries());
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj), 'utf8');
  } catch (e) {}
};

// Persistent cache of student attendance data
const studentDataCache = loadDiskCache();

export class SrmAuthController {
  /**
   * Fetches fresh session and live CAPTCHA directly from SRM portal
   */
  static async getLiveCaptcha(req: Request, res: Response): Promise<void> {
    try {
      const captchaData = await SrmPortalService.fetchCaptchaSession();
      res.json(captchaData);
    } catch (err: any) {
      console.error('Error fetching SRM live CAPTCHA:', err);
      res.status(500).json({
        error:
          err.message ||
          'Failed to load CAPTCHA from SRMIST Student Portal. Please check portal status.',
      });
    }
  }

  /**
   * Logs student in with SRMIST credentials and retrieves real attendance
   */
  static async srmLogin(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, username, password, captcha } = req.body;

      if (!sessionId || !username || !password || !captcha) {
        res.status(400).json({
          error: 'Please fill in your SRM NetID, Password, and the CAPTCHA characters.',
        });
        return;
      }

      // Securely connect to SRM portal and extract real student attendance
      const attendanceData = await SrmPortalService.loginAndFetchRealAttendance(
        sessionId,
        username,
        password,
        captcha
      );

      const netIdClean = username.trim().toLowerCase().replace(/@.*$/, '');
      studentDataCache.set(netIdClean, attendanceData);
      saveDiskCache(studentDataCache);

      // Create authenticated JWT session for student
      const token = jwt.sign(
        {
          netId: netIdClean,
          name: attendanceData.studentName,
          regNo: attendanceData.registerNumber,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Successfully authenticated with SRMIST Student Portal!',
        token,
        data: attendanceData,
      });
    } catch (err: any) {
      console.error('SRM Login failed:', err.message);
      res.status(401).json({
        error: err.message || 'Authentication with SRMIST Student Portal failed.',
      });
    }
  }

  /**
   * Returns current authenticated student attendance data
   */
  static async getAttendance(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      const data = studentDataCache.get(decoded.netId);
      if (!data) {
        res.status(401).json({ error: 'Attendance session expired. Please re-login.' });
        return;
      }

      res.json({ data });
    } catch (err) {
      res.status(401).json({ error: 'Invalid or expired session. Please login with SRM NetID.' });
    }
  }

  /**
   * Returns internal marks data for current student
   */
  static async getInternalMarks(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      const data = studentDataCache.get(decoded.netId);
      if (!data) {
        res.status(401).json({ error: 'Session expired. Please re-login.' });
        return;
      }

      res.json({
        studentName: data.studentName,
        registerNumber: data.registerNumber,
        marks: data.marks || [],
      });
    } catch (err) {
      res.status(401).json({ error: 'Invalid or expired session.' });
    }
  }

  /**
   * Parses pasted attendance table and creates authenticated session
   */
  static async parseTable(req: Request, res: Response): Promise<void> {
    try {
      const { rawContent, netId = 'STUDENT' } = req.body;
      if (!rawContent || !rawContent.trim()) {
        res.status(400).json({ error: 'Please paste your attendance table.' });
        return;
      }

      const subjects = TableParserService.parsePastedData(rawContent);

      let total = 0;
      let attended = 0;
      for (const s of subjects) {
        total += s.totalClasses;
        attended += s.attendedClasses;
      }
      const absent = total - attended;
      const pct = total > 0 ? Number(((attended / total) * 100).toFixed(2)) : 100;

      const R = 0.75;
      let reqClasses = 0;
      let margin = 0;
      if (total > 0 && attended / total >= R) {
        margin = Math.floor((attended - R * total) / R);
        if (margin < 0) margin = 0;
      } else if (total > 0) {
        reqClasses = Math.ceil((R * total - attended) / (1 - R));
      }

      const overall: any = {
        totalClasses: total,
        attendedClasses: attended,
        absentClasses: absent,
        percentage: pct,
        targetPercentage: 75.0,
        requiredClasses: reqClasses,
        margin,
        status: pct >= 75 ? 'SAFE' : pct >= 65 ? 'WARNING' : 'CRITICAL',
        statusMessage: pct >= 75 ? `Safe Zone (Margin: ${margin} classes)` : `Shortage (Need: ${reqClasses} classes)`,
      };

      const cleanNetId = String(netId).trim().toLowerCase().replace(/@.*$/, '') || 'student';

      const data: SrmAttendanceData = {
        studentName: cleanNetId.toUpperCase(),
        registerNumber: cleanNetId.toUpperCase(),
        overall,
        subjects,
      };

      studentDataCache.set(cleanNetId, data);
      saveDiskCache(studentDataCache);

      const token = jwt.sign({ netId: cleanNetId, name: cleanNetId.toUpperCase() }, JWT_SECRET, {
        expiresIn: '24h',
      });

      res.json({
        message: 'Successfully loaded attendance data!',
        token,
        data,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to parse attendance table.' });
    }
  }

  /**
   * Future Attendance Simulation (What-If Calculator)
   */
  static simulate(req: Request, res: Response): void {
    try {
      const {
        totalClasses = 0,
        attendedClasses = 0,
        futureMissed = 0,
        futureAttended = 0,
        targetPercentage = 75.0,
      } = req.body;

      const simulation = simulateAttendance(
        Number(totalClasses),
        Number(attendedClasses),
        Number(futureMissed),
        Number(futureAttended),
        Number(targetPercentage)
      );

      const currentMetrics = calculateAttendanceMetrics(
        Number(totalClasses),
        Number(attendedClasses),
        Number(targetPercentage)
      );

      res.json({ simulation, currentMetrics });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Invalid parameters.' });
    }
  }
}

