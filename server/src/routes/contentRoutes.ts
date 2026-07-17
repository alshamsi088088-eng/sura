
import { Router } from 'express';
import { homeContent, getArticles, getArticleBySlug, getNovels, getGallery, getTech, getProducts, getDashboard } from '../controllers/contentController.js';
import { authGuard } from '../middleware/authGuard.js';

export const contentRoutes = Router();

contentRoutes.get('/content/home', homeContent);

contentRoutes.get('/articles', getArticles);
// Frontend expects /api/articles/slug/:slug
contentRoutes.get('/articles/slug/:slug', getArticleBySlug);
// Also support /api/articles/:slug (in case other parts of the app use it)
contentRoutes.get('/articles/:slug', getArticleBySlug);

contentRoutes.get('/novels', getNovels);
contentRoutes.get('/gallery', getGallery);
contentRoutes.get('/tech', getTech);
contentRoutes.get('/products', getProducts);
contentRoutes.get('/dashboard', authGuard, getDashboard);

