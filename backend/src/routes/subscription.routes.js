import { Router } from 'express';
import {
  listSubscriptions, createSubscription, updateSubscription, deleteSubscription,
} from '../controllers/subscription.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.route('/').get(listSubscriptions).post(createSubscription);
router.route('/:id').put(updateSubscription).delete(deleteSubscription);

export default router;
