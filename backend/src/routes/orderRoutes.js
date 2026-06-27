import express from 'express';
import {
  addOrderItems,
  getOrderById,
  updateOrderStatus,
  getMyOrders,
  getOrders,
  getDashboardSummary,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, addOrderItems)
  .get(protect, admin, getOrders);

// Admin statistics summary
router.get('/stats/summary', protect, admin, getDashboardSummary);

// User-specific orders list
router.get('/myorders', protect, getMyOrders);

router.route('/:id').get(protect, getOrderById);
router.route('/:id/status').put(protect, admin, updateOrderStatus);

export default router;
