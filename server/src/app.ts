import express from 'express';
import cors from 'cors';
import { SrmAuthController } from './controllers/srmAuthController';

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

export default app;
