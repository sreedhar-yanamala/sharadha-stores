import express from 'express';
import {
  createSubscription,
  getMySubscriptions,
  updateSubscriptionStatus,
  getSubscriptions,
} from '../controllers/subscriptionController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createSubscription)
  .get(protect, admin, getSubscriptions);

router.get('/mysubscriptions', protect, getMySubscriptions);
router.put('/:id/status', protect, updateSubscriptionStatus);

export default router;
