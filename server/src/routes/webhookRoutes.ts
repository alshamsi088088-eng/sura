
import express, { Router } from 'express';
import { stripeWebhook } from '../controllers/webhookController.js';

export const webhookRoutes = Router();
webhookRoutes.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhook);
