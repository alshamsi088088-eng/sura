
import { Router } from 'express';
import { homeContent, getArticles, getNovels, getGallery, getTech, getProducts, getDashboard } from '../controllers/contentController.js';
import { authGuard } from '../middleware/authGuard.js';

export const contentRoutes = Router();
contentRoutes.get('/content/home', homeContent);
contentRoutes.get('/articles', getArticles);
contentRoutes.get('/novels', getNovels);
contentRoutes.get('/gallery', getGallery);
contentRoutes.get('/tech', getTech);
contentRoutes.get('/products', getProducts);
contentRoutes.get('/dashboard', authGuard, getDashboard);
