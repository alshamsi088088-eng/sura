
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../services/prisma.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

type CheckoutMetaItem = {
  id: string;
  title: string;
  price: number;
  quantity?: number;
};

function parseMetadataItems(itemsRaw?: string): CheckoutMetaItem[] {
  if (!itemsRaw) return [];
  try {
    const parsed = JSON.parse(itemsRaw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function stripeWebhook(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !signature) return res.status(400).send('Webhook signature missing');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    return res.status(400).send(`Webhook error: ${(error as Error).message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};

    const stripeSessionId = session.id;
    const userId = metadata.userId || null;
    const email = metadata.email || session.customer_email || '';
    const subtotal = Number(metadata.subtotal || 0);
    const discountCode = metadata.discountCode || null;
    const discountAmount = Number(metadata.discountAmount || 0);
    const total = Number(session.amount_total || 0) / 100;
    const currency = (session.currency || 'usd').toLowerCase();

    const items = parseMetadataItems(metadata.items);

    const existing = await prisma.order.findUnique({ where: { stripeSessionId } });
    if (!existing) {
      await prisma.order.create({
        data: {
          stripeSessionId,
          email,
          userId: userId || undefined,
          subtotal,
          total,
          discountCode,
          discountAmount,
          currency,
          status: 'paid',
          items: {
            create: items.map((item) => ({
              bookId: item.id,
              titleSnapshot: item.title,
              priceAtPurchase: item.price,
              quantity: item.quantity || 1
            }))
          }
        }
      });
    }

    // Write purchase history to Supabase database (instead of Firestore)
    try {
      await prisma.purchaseHistory.create({
        data: {
          stripeSessionId,
          userId: userId || undefined,
          email,
          subtotal,
          total,
          discountCode,
          discountAmount,
          currency,
          status: 'paid',
          items: JSON.stringify(items),
          createdAt: new Date()
        }
      });
    } catch (Error) {
      console.warn('Failed to write purchase history to database', Error);
    }
  }

  res.json({ received: true });
}
