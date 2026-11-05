import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { SrmAuthController } from './controllers/srmAuthController';
import authRoutes from './routes/authRoutes';
import subjectRoutes from './routes/subjectRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import portalRoutes from './routes/portalRoutes';
import userRoutes from './routes/userRoutes';
import calculatorRoutes from './routes/calculatorRoutes';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health
app.get('/api/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// SRM Real Authentication & Data APIs
app.get('/api/srm/captcha', SrmAuthController.getLiveCaptcha);
app.post('/api/srm/login', SrmAuthController.srmLogin);
app.post('/api/srm/parse-table', SrmAuthController.parseTable);
app.get('/api/srm/attendance', SrmAuthController.getAttendance);
app.get('/api/srm/marks', SrmAuthController.getInternalMarks);
app.post('/api/calculator/simulate', SrmAuthController.simulate);

// Core Application API Routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/calculator', calculatorRoutes);

// Static Client Serving (Production React SPA)
const candidateDistPaths = [
  path.join(__dirname, '../../client/dist'),
  path.join(__dirname, '../client/dist'),
  path.join(process.cwd(), '../client/dist'),
  path.join(process.cwd(), 'client/dist'),
  path.join(process.cwd(), 'dist'),
];

let clientDistPath: string | undefined;
for (const p of candidateDistPaths) {
  if (fs.existsSync(path.join(p, 'index.html'))) {
    clientDistPath = p;
    break;
  }
}

if (clientDistPath) {
  console.log(`[Express] Serving static React app from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  // SPA fallback: Return index.html for non-API client routes like /register, /login
  app.get('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath!, 'index.html'));
  });
}

export default app;
