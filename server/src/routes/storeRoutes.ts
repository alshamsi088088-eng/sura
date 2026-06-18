
import { Router } from 'express';
import {
  checkout,
  getDownloadAccess,
  getStoreItems,
  getUserOrders,
  validateCoupon
} from '../controllers/storeController.js';
import { authGuard } from '../middleware/authGuard.js';

export const storeRoutes = Router();
storeRoutes.get('/', getStoreItems);
storeRoutes.get('/orders', authGuard, getUserOrders);
storeRoutes.post('/validate-coupon', authGuard, validateCoupon);
storeRoutes.get('/download/:bookId', authGuard, getDownloadAccess);
storeRoutes.post('/checkout', authGuard, checkout);
