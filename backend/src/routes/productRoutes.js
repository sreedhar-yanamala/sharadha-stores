import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getPersonalizedRecommendations,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect, admin, createProduct);

// Recommendation endpoints (MUST be defined before /:id otherwise /recommendations matches :id)
router.get('/recommendations/personalized', protect, getPersonalizedRecommendations);
router.get('/recommendations/similar/:id', getSimilarProducts);
router.get('/recommendations/frequently-bought-together/:id', getFrequentlyBoughtTogether);

router.route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

router.route('/:id/reviews').post(protect, createProductReview);

export default router;
