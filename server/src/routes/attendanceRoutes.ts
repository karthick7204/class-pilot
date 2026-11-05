import { Router } from 'express';
import { AttendanceController } from '../controllers/attendanceController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/logs', AttendanceController.getLogs);
router.delete('/logs/:id', AttendanceController.deleteLog);
router.get('/export-csv', AttendanceController.exportCsv);

export default router;

