import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import { listUsers } from '../controllers/admin.controller.js';

const router = Router();

// All admin routes require a valid token AND the 'admin' role.
router.get('/users', protect, requireRole('admin'), listUsers);

export default router;
