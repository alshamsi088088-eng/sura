import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { ThreadedComments } from '../components/ThreadedComments';
import { trackPurchaseIntent, trackEvent } from '../lib/analytics';

interface BookItem {
  id: string;
  title: string;
  author: string;
  price: number;
  format: string;
  coverImage: string;
  previewUrl?: string | null;
  fileUrl?: string | null;
}

interface CartItem {
  id: string;
  quantity: number;
}

export function StorePage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const [books, setBooks] = useState<BookItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [activeBook, setActiveBook] = useState<BookItem | null>(null);
  const [downloadLoadingId, setDownloadLoadingId] = useState<string | null>(null);

  useEffect(() => {
    axios.get('/api/store').then((res) => {
      const loadedBooks = res.data.books || [];
      setBooks(loadedBooks);
      setActiveBook(loadedBooks[0] || null);
    });
  }, []);

  const cartBooks = useMemo(
    () => cart.map((item) => ({ ...item, book: books.find((b) => b.id === item.id) })).filter((x) => x.book),
    [cart, books]
  );

  const subtotal = useMemo(
    () => cartBooks.reduce((sum, item) => sum + (item.book?.price || 0) * item.quantity, 0),
    [cartBooks]
  );

  const total = Math.max(0, subtotal - discountAmount);

  const addToCart = (book: BookItem) => {
    setCart((current) => {
      const exists = current.find((item) => item.id === book.id);
      if (exists) {
        return current.map((item) => (item.id === book.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...current, { id: book.id, quantity: 1 }];
    });
    trackEvent('add_to_cart', { item_id: book.id, item_name: book.title, value: book.price });
  };

  const applyCoupon = async () => {
    if (!couponCode.trim() || cart.length === 0) return;
    try {
      const response = await axios.post(
        '/api/store/validate-coupon',
        { items: cart, couponCode },
        { withCredentials: true }
      );
      setDiscountAmount(response.data.discountAmount || 0);
      setCouponMessage(
        locale === 'ar'
          ? `تم تطبيق الخصم: $${Number(response.data.discountAmount || 0).toFixed(2)}`
          : `Discount applied: $${Number(response.data.discountAmount || 0).toFixed(2)}`
      );
      trackEvent('coupon_applied', { code: couponCode.toUpperCase(), discount: response.data.discountAmount || 0 });
    } catch (error: any) {
      setDiscountAmount(0);
      setCouponMessage(
        error?.response?.data?.message ||
          (locale === 'ar' ? 'فشل التحقق من القسيمة' : 'Coupon validation failed')
      );
      trackEvent('coupon_failed', { code: couponCode.toUpperCase() });
    }
  };

  const checkout = async () => {
    trackPurchaseIntent(cart.length, Number(total.toFixed(2)));
    const response = await axios.post(
      '/api/store/checkout',
      { items: cart, couponCode: couponCode.trim() || undefined },
      { withCredentials: true }
    );
    window.location.href = response.data.url;
  };

  const tryDownload = async (bookId: string) => {
    setDownloadLoadingId(bookId);
    try {
      const response = await axios.get(`/api/store/download/${bookId}`, { withCredentials: true });
      if (response.data?.allowed && response.data?.book?.fileUrl) {
        window.open(response.data.book.fileUrl, '_blank', 'noopener,noreferrer');
        trackEvent('download_book', { book_id: bookId, allowed: true });
      } else {
        trackEvent('download_book', { book_id: bookId, allowed: false });
      }
    } catch {
      trackEvent('download_book', { book_id: bookId, allowed: false });
    } finally {
      setDownloadLoadingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">{locale === 'ar' ? 'المتجر' : 'Book Store'}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-sura-navy/80">
              {locale === 'ar'
                ? 'شراء نسخ رقمية ومطبوعة مع تسليم آمن وروابط تنزيل.'
                : 'Purchase digital and physical books with Stripe checkout and downloadable access.'}
            </p>
          </div>
          {user?.role === 'admin' ? (
            <Link
              to="/admin?tab=books"
              className="self-start rounded-full bg-sura-gold px-5 py-2 text-sm font-semibold text-sura-dark transition hover:opacity-95"
            >
              {locale === 'ar' ? 'إدارة الكتب' : 'Manage Books'}
            </Link>
          ) : null}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.8fr_0.9fr]">
        <div className="grid gap-6 md:grid-cols-2">
          {(Array.isArray(books) ? books : []).map((book) => (
            <article
              key={book.id}
              className={`rounded-3xl border p-6 ${activeBook?.id === book.id ? 'border-sura-teal bg-sura-sky/25' : 'border-sura-line bg-sura-canvas'}`}
            >
              <div className="h-52 overflow-hidden rounded-3xl bg-sura-canvas">
                <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover" />
              </div>
              <div className="mt-4">
                <h2 className="text-xl font-semibold">{book.title}</h2>
                <p className="mt-2 text-sm text-sura-navy/70">
                  {book.author} · {book.format}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-lg font-semibold text-sura-teal">${book.price.toFixed(2)}</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveBook(book)}
                      className="rounded-full border border-sura-line px-4 py-2 text-xs text-sura-navy/90"
                    >
                      {locale === 'ar' ? 'عرض التفاصيل' : 'View details'}
                    </button>
                    {book.previewUrl ? (
                      <a
                        href={book.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-sura-line px-4 py-2 text-xs text-sura-navy/90"
                        onClick={() => trackEvent('preview_book', { book_id: book.id })}
                      >
                        {locale === 'ar' ? 'معاينة' : 'Preview'}
                      </a>
                    ) : null}
                    <button
                      onClick={() => addToCart(book)}
                      className="rounded-full bg-sura-gold px-4 py-2 text-sm text-sura-dark"
                    >
                      {locale === 'ar' ? 'أضف إلى السلة' : 'Add to cart'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-4 rounded-3xl border border-sura-line bg-sura-canvas p-6">
          <div className="text-sm uppercase tracking-[0.3em] text-sura-teal">
            {locale === 'ar' ? 'سلة التسوق' : 'Shopping cart'}
          </div>
          <div className="mt-2 space-y-4">
            {cartBooks.length === 0 ? (
              <div className="text-sm text-sura-navy/70">{locale === 'ar' ? 'السلة فارغة.' : 'Your cart is empty.'}</div>
            ) : (
              cartBooks.map((item) => (
                <div key={item.id} className="rounded-3xl border border-sura-line bg-sura-canvas p-4">
                  <div className="font-semibold">{item.book?.title}</div>
                  <div className="text-sm text-sura-navy/70">
                    {(item.book?.format || '')} • ${Number((item.book?.price || 0) * item.quantity).toFixed(2)} • x{item.quantity}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs text-sura-navy/70">{locale === 'ar' ? 'كود الخصم' : 'Coupon code'}</label>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder={locale === 'ar' ? 'أدخل الكود' : 'Enter code'}
                className="w-full rounded-full border border-sura-line bg-sura-canvas px-4 py-2 text-sm outline-none focus:border-sura-gold"
              />
              <button
                onClick={applyCoupon}
                disabled={!couponCode.trim() || cart.length === 0}
                className="rounded-full border border-sura-line px-4 py-2 text-xs disabled:opacity-50"
              >
                {locale === 'ar' ? 'تطبيق' : 'Apply'}
              </button>
            </div>
            {couponMessage ? <p className="text-xs text-sura-navy/70">{couponMessage}</p> : null}
          </div>

          <div className="mt-2 space-y-1 text-sm text-sura-navy/80">
            <div className="flex items-center justify-between">
              <span>{locale === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{locale === 'ar' ? 'الخصم' : 'Discount'}</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold text-sura-teal">
              <span>{locale === 'ar' ? 'الإجمالي' : 'Total'}</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={checkout}
            disabled={cart.length === 0}
            className="mt-2 w-full rounded-full bg-sura-gold px-4 py-3 text-sm font-semibold text-sura-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locale === 'ar' ? 'الدفع' : 'Checkout'}
          </button>

          {activeBook ? (
            <div className="rounded-3xl border border-sura-line bg-sura-canvas p-4">
              <div className="text-sm font-semibold">{activeBook.title}</div>
              <p className="mt-1 text-xs text-sura-navy/70">
                {locale === 'ar' ? 'تنزيل للمشترين فقط' : 'Download available for purchased users only'}
              </p>
              <button
                onClick={() => tryDownload(activeBook.id)}
                disabled={downloadLoadingId === activeBook.id}
                className="mt-3 w-full rounded-full border border-sura-line px-4 py-2 text-xs"
              >
                {downloadLoadingId === activeBook.id
                  ? locale === 'ar' ? 'جارٍ التحقق...' : 'Checking access...'
                  : locale === 'ar' ? 'تنزيل (بعد الشراء)' : 'Download (after purchase)'}
              </button>
            </div>
          ) : null}
        </aside>
      </div>

      {activeBook ? <ThreadedComments entityId={activeBook.id} entityType="book" /> : null}
    </div>
  );
}
