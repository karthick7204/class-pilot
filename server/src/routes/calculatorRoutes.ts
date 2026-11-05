import { Router } from 'express';
import { CalculatorController } from '../controllers/calculatorController';

const router = Router();

router.post('/simulate', CalculatorController.simulate);

export default router;

