import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/prisma.js';
import Stripe from 'stripe';

type CartItem = { id: string; quantity?: number };

type DiscountResult = {
  discountAmount: number;
  discountPercentage: number;
  discountCode: string | null;
};

function requireStripeOrThrow(): Stripe {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    // Fail-fast: Stripe cannot work without this key
    throw Object.assign(new Error('Missing STRIPE_SECRET_KEY env var'), { statusCode: 500 });
  }

  return new Stripe(stripeSecretKey, { apiVersion: '2022-11-15' });
}

function normalizeCouponCode(couponCode?: string | null): string | null {
  if (!couponCode) return null;
  const trimmed = String(couponCode).trim();
  if (!trimmed) return null;
  return trimmed.toUpperCase();
}

function round2(n: number): number {
  return Number(n.toFixed(2));
}

async function computeDiscount(subtotal: number, couponCode?: string | null, bookIds: string[] = []): Promise<DiscountResult> {
  const normalizedCode = normalizeCouponCode(couponCode);

  if (!normalizedCode) {
    return {
      discountAmount: 0,
      discountPercentage: 0,
      discountCode: null
    };
  }

  const coupon = await prisma.coupon.findUnique({ where: { code: normalizedCode } });

  if (!coupon || !coupon.active) {
    throw new Error('Invalid coupon');
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw new Error('Coupon not active yet');
  if (coupon.endsAt && coupon.endsAt < now) throw new Error('Coupon expired');
  if (typeof coupon.maxUses === 'number' && coupon.usedCount >= coupon.maxUses) {
    throw new Error('Coupon usage limit reached');
  }
  if (typeof coupon.minSubtotal === 'number' && subtotal < coupon.minSubtotal) {
    throw new Error('Minimum subtotal not reached');
  }
  if (coupon.applicableBookId && !bookIds.includes(coupon.applicableBookId)) {
    throw new Error('Coupon not applicable to selected items');
  }

  let discountAmount = 0;
  if (coupon.type === 'percent') {
    discountAmount = (subtotal * coupon.value) / 100;
  } else {
    // fixed amount coupon
    discountAmount = coupon.value;
  }

  discountAmount = Math.max(0, Math.min(subtotal, round2(discountAmount)));

  const discountPercentage = subtotal > 0 ? clamp((discountAmount / subtotal) * 100, 0, 100) : 0;

  return {
    discountAmount,
    discountPercentage,
    discountCode: normalizedCode
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function safeStripeErrorPayload(error: any) {
  const statusCode = error?.statusCode || 400;
  const message = error?.message || 'Stripe request failed';

  return {
    statusCode,
    payload: {
      message,
      code: error?.code || undefined,
      type: error?.type || undefined,
      details:
        error?.raw?.message ||
        error?.decline_code ||
        error?.raw?.decline_code ||
        error?.raw?.error?.message ||
        undefined
    }
  };
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

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ valid: false, message: 'No items provided' });
    }

    const normalizedItems = items
      .filter((it) => typeof it?.id === 'string' && it.id.trim().length > 0)
      .map((it) => ({ id: it.id, quantity: Number(it.quantity ?? 1) }))
      .filter((it) => Number.isFinite(it.quantity) && it.quantity > 0);

    if (normalizedItems.length === 0) {
      return res.status(400).json({ valid: false, message: 'No valid items provided' });
    }

    const productIds = Array.from(new Set(normalizedItems.map((it) => it.id)));
    const products = await prisma.book.findMany({ where: { id: { in: productIds } } });

    if (!products.length) {
      return res.status(400).json({ valid: false, message: 'Invalid items' });
    }

    // Always compute financials from DB prices and client quantities.
    const subtotal = round2(
      products.reduce((sum: number, book: { id: string; price: number }) => {
        const quantity = normalizedItems.find((it) => it.id === book.id)?.quantity || 1;
        return sum + book.price * quantity;
      }, 0)
    );

    // Use all selected book ids when checking applicability.
    const { discountAmount, discountPercentage, discountCode } = await computeDiscount(
      subtotal,
      couponCode,
      products.map((p: { id: string }) => p.id)
    );

    const total = round2(Math.max(0, subtotal - discountAmount));

    return res.json({
      valid: true,
      subtotal,
      discountAmount,
      discountPercentage,
      discountCode,
      total
    });
  } catch (error: any) {
    return res.status(400).json({ valid: false, message: error?.message || 'Coupon validation failed' });
  }
}

export async function checkout(req: Request, res: Response, next: NextFunction) {
  try {
    const stripe = requireStripeOrThrow();

    const user = req.user as any;

    const { items = [], couponCode } = req.body as { items: CartItem[]; couponCode?: string };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No checkout items provided' });
    }

    const normalizedItems = items
      .filter((it) => typeof it?.id === 'string' && it.id.trim().length > 0)
      .map((it) => ({ id: it.id, quantity: Number(it.quantity ?? 1) }))
      .filter((it) => Number.isFinite(it.quantity) && it.quantity > 0);

    if (normalizedItems.length === 0) {
      return res.status(400).json({ message: 'No valid checkout items provided' });
    }

    const productIds = Array.from(new Set(normalizedItems.map((it) => it.id)));
    const products = await prisma.book.findMany({ where: { id: { in: productIds } } });

    if (products.length !== productIds.length) {
      return res.status(400).json({ message: 'Invalid checkout items' });
    }

    const subtotal = round2(
      products.reduce((sum: number, book: { id: string; price: number }) => {
        const quantity = normalizedItems.find((it) => it.id === book.id)?.quantity || 1;
        return sum + book.price * quantity;
      }, 0)
    );

    const { discountAmount, discountPercentage, discountCode } = await computeDiscount(
      subtotal,
      couponCode,
      products.map((p: { id: string }) => p.id)
    );

    const total = round2(Math.max(0, subtotal - discountAmount));

    // IMPORTANT: apply discount to Stripe line item pricing.
    // Stripe will calculate the final amount based on unit_amount and quantity.
    // Metadata is only for tracing.
    const lineItems = products.map((book: any) => {
      const quantity = normalizedItems.find((it) => it.id === book.id)?.quantity || 1;

      // Compute discounted unit price (in USD) then convert to cents.
      const discountedUnit = book.price * (1 - discountPercentage / 100);
      const unitAmountCents = Math.max(0, Math.round(round2(discountedUnit) * 100));

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: book.title,
            description: book.summary
          },
          unit_amount: unitAmountCents,
          metadata: {
            // trace only
            discount_percentage: discountPercentage.toString(),
            couponCode: discountCode || '',
            book_id: book.id
          }
        },
        quantity
      };
    });

    const metadata: Record<string, string> = {
      userId: user?.id || '',
      email: user?.email || '',
      // trace only
      discountCode: discountCode || '',
      discountAmount: discountAmount.toString(),
      discountPercentage: discountPercentage.toString(),
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
      line_items: lineItems as any,
      success_url: `${clientUrl}/profile?checkout=success`,
      cancel_url: `${clientUrl}/store`
    });

    return res.json({ url: session.url, subtotal, discountAmount, total, discountCode });
  } catch (error: any) {
    // If it is our own error (missing key, invalid coupon), preserve API behavior.
    const statusCode = error?.statusCode || (error?.message ? 400 : 500);

    // Stripe specific payload improvement.
    if (error?.raw || error?.type || error?.code || error?.statusCode) {
      const { statusCode: stripeStatusCode, payload } = safeStripeErrorPayload(error);
      return res.status(stripeStatusCode).json(payload);
    }

    return res.status(statusCode).json({ message: error?.message || 'Stripe checkout failed' });
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

