import express from 'express';
import {
  getInventory,
  getInventoryByProductId,
  addBatch,
  getInventoryAlerts,
} from '../controllers/inventoryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(admin);

router.route('/').get(getInventory);
router.route('/alerts/warnings').get(getInventoryAlerts);
router.route('/:productId').get(getInventoryByProductId);
router.route('/:productId/batches').post(addBatch);

export default router;
