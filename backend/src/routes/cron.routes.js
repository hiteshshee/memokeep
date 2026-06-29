import { Router } from 'express';
import { warrantyReminders } from '../controllers/cron.controller.js';

const router = Router();

// Vercel Cron issues a GET to this path on a schedule (see backend/vercel.json).
router.get('/warranty-reminders', warrantyReminders);

export default router;
