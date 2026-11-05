import { Router } from 'express';
import { SubjectController } from '../controllers/subjectController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/', SubjectController.getSubjects);
router.post('/', SubjectController.createSubject);
router.put('/:id', SubjectController.updateSubject);
router.delete('/:id', SubjectController.deleteSubject);
router.post('/:id/quick-log', SubjectController.quickLog);

export default router;

