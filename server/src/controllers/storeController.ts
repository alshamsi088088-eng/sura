
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/prisma.js';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  // Fail fast in runtime if Stripe is misconfigured
  console.warn('[storeController] Missing STRIPE_SECRET_KEY env var');
}
const stripe = new Stripe(stripeSecretKey || '', { apiVersion: '2022-11-15' });


type CartItem = { id: string; quantity?: number };

async function computeDiscount(subtotal: number, couponCode?: string | null, bookIds: string[] = []) {
  if (!couponCode) {
    return { discountAmount: 0, discountCode: null as string | null, coupon: null as any };
  }

  const code = couponCode.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.active) {
    throw new Error('Invalid coupon');
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw new Error('Coupon not active yet');
  if (coupon.endsAt && coupon.endsAt < now) throw new Error('Coupon expired');
  if (typeof coupon.maxUses === 'number' && coupon.usedCount >= coupon.maxUses) throw new Error('Coupon usage limit reached');
  if (typeof coupon.minSubtotal === 'number' && subtotal < coupon.minSubtotal) throw new Error('Minimum subtotal not reached');
  if (coupon.applicableBookId && !bookIds.includes(coupon.applicableBookId)) throw new Error('Coupon not applicable to selected items');

  let discountAmount = 0;
  if (coupon.type === 'percent') {
    discountAmount = (subtotal * coupon.value) / 100;
  } else {
    discountAmount = coupon.value;
  }

  discountAmount = Math.max(0, Math.min(subtotal, Number(discountAmount.toFixed(2))));
  return { discountAmount, discountCode: code, coupon };
}

export async function getStoreItems(_req: Request, res: Response) {
  const books = await prisma.book.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ books });
}

export async function getUserOrders(req: Request, res: Response) {
  const user = req.user as any;
  if (!user?.email) return res.status(401).json({ message: 'Unauthorized' });

  const orders = await prisma.order.findMany({
    where: user.id ? { userId: user.id } : { email: user.email },
    include: { items: { include: { book: true } } },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ orders });
}

export async function validateCoupon(req: Request, res: Response) {
  try {
    const { items = [], couponCode } = req.body as { items: CartItem[]; couponCode?: string };
    const products = await prisma.book.findMany({ where: { id: { in: items.map((item) => item.id) } } });

    const subtotal = Number(
      products
        .reduce((sum: number, book: { id: string; price: number }) => {
          const quantity = items.find((it) => it.id === book.id)?.quantity || 1;
          return sum + book.price * quantity;
        }, 0)
        .toFixed(2)
    );

    const { discountAmount, discountCode } = await computeDiscount(
      subtotal,
      couponCode,
      products.map((p: { id: string }) => p.id)
    );
    const total = Number(Math.max(0, subtotal - discountAmount).toFixed(2));

    res.json({ valid: true, subtotal, discountAmount, discountCode, total });
  } catch (error: any) {
    res.status(400).json({ valid: false, message: error?.message || 'Coupon validation failed' });
  }
}

export async function checkout(req: Request, res: Response, next: NextFunction) {
  try {
    if (!stripeSecretKey) {
      return res.status(500).json({ message: 'Stripe is not configured (missing STRIPE_SECRET_KEY)' });
    }

    const user = req.user as any;
    const { items = [], couponCode } = req.body as { items: CartItem[]; couponCode?: string };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No checkout items provided' });
    }

    // Normalize + validate cart quantities
    const normalizedItems = items
      .filter((it) => typeof it?.id === 'string' && it.id.trim().length > 0)
      .map((it) => ({ id: it.id, quantity: Number(it.quantity ?? 1) }))
      .filter((it) => Number.isFinite(it.quantity) && it.quantity > 0);

    if (normalizedItems.length === 0) {
      return res.status(400).json({ message: 'No valid checkout items provided' });
    }

    const productIds = Array.from(new Set(normalizedItems.map((it) => it.id)));
    const products = await prisma.book.findMany({ where: { id: { in: productIds } } });

    if (!products.length) {
      return res.status(400).json({ message: 'Invalid checkout items' });
    }

    const subtotal = Number(
      products
        .reduce((sum: number, book: { id: string; price: number }) => {
          const quantity = normalizedItems.find((it) => it.id === book.id)?.quantity || 1;
          return sum + book.price * quantity;
        }, 0)
        .toFixed(2)
    );

    const { discountAmount, discountCode } = await computeDiscount(
      subtotal,
      couponCode,
      products.map((p: { id: string }) => p.id)
    );

    const total = Number(Math.max(0, subtotal - discountAmount).toFixed(2));

    // Distribute discount across items so Stripe totals match our computed total.
    const productSubtotalMap = new Map<string, number>();
    for (const book of products) {
      const q = normalizedItems.find((it) => it.id === book.id)?.quantity || 1;
      productSubtotalMap.set(book.id, book.price * q);
    }

    const lineItems = products.map((book: any) => {
      const quantity = normalizedItems.find((it) => it.id === book.id)?.quantity || 1;
      const itemSubtotal = productSubtotalMap.get(book.id) || 0;

      const share = subtotal > 0 ? itemSubtotal / subtotal : 0;
      const itemDiscount = Number((discountAmount * share).toFixed(2));
      const discountedUnit = book.price - itemDiscount / (quantity || 1);
      const unitAmountCents = Math.max(0, Math.round(discountedUnit * 100));

      return {
        price_data: {
          currency: 'usd',
          product_data: { name: book.title, description: book.summary },
          unit_amount: unitAmountCents
        },
        quantity
      };
    });

    const metadata: Record<string, string> = {
      userId: user?.id || '',
      email: user?.email || '',
      discountCode: discountCode || '',
      discountAmount: discountAmount.toString(),
      subtotal: subtotal.toString(),
      total: total.toString(),
      items: JSON.stringify(
        products.map((book: { id: string; title: string; price: number }) => ({
          id: book.id,
          title: book.title,
          price: book.price,
          quantity: normalizedItems.find((it) => it.id === book.id)?.quantity || 1
        }))
      )
    };

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user?.email || undefined,
      metadata,
      line_items: lineItems,
      success_url: `${clientUrl}/profile?checkout=success`,
      cancel_url: `${clientUrl}/store`
    });

    res.json({ url: session.url, subtotal, discountAmount, total, discountCode });
  } catch (error) {
    next(error);
  }
}


export async function getDownloadAccess(req: Request, res: Response) {
  const user = req.user as any;
  const { bookId } = req.params;

  if (!user?.id || !bookId) return res.status(401).json({ message: 'Unauthorized' });

  const purchased = await prisma.orderItem.findFirst({
    where: {
      bookId,
      order: {
        userId: user.id,
        status: 'paid'
      }
    },
    include: { book: true }
  });

  if (!purchased) return res.status(403).json({ message: 'Purchase required for download access' });

  res.json({
    allowed: true,
    book: {
      id: purchased.book.id,
      title: purchased.book.title,
      fileUrl: purchased.book.fileUrl,
      previewUrl: purchased.book.previewUrl
    }
  });
}
