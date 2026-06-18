import { Router } from 'express';
import { submitContact } from '../controllers/contactController.js';

export const contactRoutes = Router();
contactRoutes.post('/', submitContact);
