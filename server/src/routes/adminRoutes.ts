
import { Router } from 'express';
import { getOverview, updateArticle, deleteArticle, updateNovel, deleteNovel, updateChapter, deleteChapter, deleteComment, deleteBook, deleteGalleryImage } from '../controllers/adminController.js';
import { authGuard } from '../middleware/authGuard.js';
import { roleGuard } from '../middleware/roleGuard.js';

export const adminRoutes = Router();

// Overview - accessible by admin and editor
adminRoutes.get('/overview', authGuard, roleGuard(['admin', 'editor']), getOverview);

// Article operations - admin only
adminRoutes.put('/articles/:id', authGuard, roleGuard('admin'), updateArticle);
adminRoutes.delete('/articles/:id', authGuard, roleGuard('admin'), deleteArticle);

// Novel operations - admin only
adminRoutes.put('/novels/:id', authGuard, roleGuard('admin'), updateNovel);
adminRoutes.delete('/novels/:id', authGuard, roleGuard('admin'), deleteNovel);

// Chapter operations - admin only
adminRoutes.put('/chapters/:id', authGuard, roleGuard('admin'), updateChapter);
adminRoutes.delete('/chapters/:id', authGuard, roleGuard('admin'), deleteChapter);

// Comment operations - admin only
adminRoutes.delete('/comments/:id', authGuard, roleGuard('admin'), deleteComment);

// Book operations - admin only
adminRoutes.delete('/books/:id', authGuard, roleGuard('admin'), deleteBook);

// Gallery operations - admin only
adminRoutes.delete('/gallery/:id', authGuard, roleGuard('admin'), deleteGalleryImage);
