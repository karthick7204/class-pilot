import { Router } from 'express';
import { PortalController } from '../controllers/portalController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Retrieve fresh SRMIST session and CAPTCHA
router.get('/srm/captcha', requireAuth, PortalController.getSrmCaptcha);

// Submit credentials & CAPTCHA to sync SRMIST attendance
router.post('/srm/sync', requireAuth, PortalController.syncSrm);

// Parse pasted HTML/text attendance table
router.post('/parse-table', requireAuth, PortalController.parsePastedTable);

export default router;

