import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { trackEvent } from '../lib/analytics';

interface PurchasedOrderItem {
  id: string;
  bookId: string;
  titleSnapshot: string;
  priceAtPurchase: number;
  quantity: number;
  book?: {
    id: string;
    title: string;
    fileUrl?: string | null;
    previewUrl?: string | null;
  };
}

interface PurchasedOrder {
  id: string;
  total: number;
  subtotal?: number;
  discountAmount?: number;
  discountCode?: string | null;
  status: string;
  currency: string;
  createdAt: string;
  items: PurchasedOrderItem[];
}

export function ProfilePage() {
  const { user, loading } = useAuth();
  const { locale } = useLocale();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<PurchasedOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [downloadLoadingBookId, setDownloadLoadingBookId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    axios
      .get('/api/store/orders', { withCredentials: true })
      .then((res) => {
        setOrders(res.data.orders || []);
      })
      .catch((error) => {
        console.error('Failed to load purchase history', error);
      })
      .finally(() => setOrdersLoading(false));
  }, [user]);

  const totalSpent = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    [orders]
  );

  const purchasedBooks = useMemo(() => {
    const map = new Map<string, PurchasedOrderItem>();
    for (const order of orders) {
      for (const item of order.items || []) {
        if (!map.has(item.bookId)) map.set(item.bookId, item);
      }
    }
    return Array.from(map.values());
  }, [orders]);

  const handleDownload = async (bookId: string) => {
    setDownloadLoadingBookId(bookId);
    try {
      const response = await axios.get(`/api/store/download/${bookId}`, { withCredentials: true });
      if (response.data?.allowed && response.data?.book?.fileUrl) {
        window.open(response.data.book.fileUrl, '_blank', 'noopener,noreferrer');
        trackEvent('download_book', { book_id: bookId, source: 'profile', allowed: true });
      } else {
        trackEvent('download_book', { book_id: bookId, source: 'profile', allowed: false });
      }
    } catch {
      trackEvent('download_book', { book_id: bookId, source: 'profile', allowed: false });
    } finally {
      setDownloadLoadingBookId(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-sura-line bg-sura-canvas p-8 text-center text-sura-navy">
        {locale === 'ar' ? 'جارٍ التحميل...' : 'Loading profile...'}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 rounded-3xl border border-sura-line bg-sura-canvas p-8">
      <header className="space-y-3">
        <h1 className="text-4xl font-semibold">{locale === 'ar' ? 'الملف الشخصي' : 'Your Profile'}</h1>
        <p className="text-sura-navy/70">
          {locale === 'ar'
            ? 'عرض معلومات حسابك وتفاصيل تسجيل الدخول.'
            : 'View your account details and Firebase profile information.'}
        </p>
      </header>

      <section className="grid items-start gap-6 md:grid-cols-[200px_1fr]">
        <div className="rounded-3xl border border-sura-line bg-sura-canvas p-5 text-center">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="mx-auto mb-4 h-32 w-32 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-sura-canvas text-4xl text-sura-navy/80">
              {user.name?.charAt(0)}
            </div>
          )}
          <div className="rounded-3xl bg-sura-canvas px-4 py-3 text-left text-sm text-sura-navy/80">
            <div className="mb-2 font-semibold text-sura-teal">{locale === 'ar' ? 'الاسم' : 'Display Name'}</div>
            <div>{user.name}</div>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-sura-line bg-sura-canvas p-6">
          <div className="rounded-3xl bg-sura-canvas p-5 text-left text-sura-navy/80">
            <div className="mb-2 text-sm font-semibold uppercase tracking-widest text-sura-teal">
              {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
            </div>
            <div>{user.email}</div>
          </div>
          <div className="rounded-3xl bg-sura-canvas p-5 text-left text-sura-navy/80">
            <div className="mb-2 text-sm font-semibold uppercase tracking-widest text-sura-teal">
              {locale === 'ar' ? 'الدور' : 'Role'}
            </div>
            <div>{user.role}</div>
          </div>
          <div className="rounded-3xl bg-sura-canvas p-5 text-left text-sura-navy/80">
            <div className="mb-2 text-sm font-semibold uppercase tracking-widest text-sura-teal">
              {locale === 'ar' ? 'النظام' : 'Theme'}
            </div>
            <div>{user.theme}</div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-sura-line bg-sura-canvas p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{locale === 'ar' ? 'سجل المشتريات' : 'Purchase History'}</h2>
            <p className="text-sm text-sura-navy/70">
              {locale === 'ar' ? 'جميع طلباتك والكتب المتاحة للتنزيل.' : 'All your orders and downloadable purchased books.'}
            </p>
          </div>
          <div className="rounded-full border border-sura-line px-4 py-2 text-sm text-sura-navy/80">
            {locale === 'ar' ? 'إجمالي الإنفاق' : 'Total spent'}: ${totalSpent.toFixed(2)}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {ordersLoading ? (
            <div className="text-sm text-sura-navy/70">{locale === 'ar' ? 'جارٍ تحميل الطلبات...' : 'Loading orders...'}</div>
          ) : orders.length === 0 ? (
            <div className="text-sm text-sura-navy/70">{locale === 'ar' ? 'لا توجد مشتريات بعد.' : 'No purchases yet.'}</div>
          ) : (
            orders.map((order) => (
              <article key={order.id} className="rounded-3xl border border-sura-line bg-sura-canvas p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-sura-navy/80">
                    <span className="font-semibold">{locale === 'ar' ? 'طلب' : 'Order'}</span> #{order.id.slice(0, 8)}
                    <span className="mx-2">•</span>
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm text-sura-teal">
                    {order.currency?.toUpperCase()} ${Number(order.total || 0).toFixed(2)} ({order.status})
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {(order.items || []).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-sura-line bg-sura-canvas p-4">
                      <div className="font-semibold">{item.titleSnapshot}</div>
                      <div className="mt-1 text-xs text-sura-navy/70">
                        ${Number(item.priceAtPurchase).toFixed(2)} × {item.quantity}
                      </div>
                      <div className="mt-3 flex gap-2">
                        {item.book?.previewUrl ? (
                          <a
                            href={item.book.previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-sura-line px-3 py-1 text-xs"
                            onClick={() => trackEvent('preview_book', { book_id: item.bookId, source: 'profile' })}
                          >
                            {locale === 'ar' ? 'معاينة' : 'Preview'}
                          </a>
                        ) : null}
                        <button
                          onClick={() => handleDownload(item.bookId)}
                          disabled={downloadLoadingBookId === item.bookId}
                          className="rounded-full border border-sura-line px-3 py-1 text-xs disabled:opacity-60"
                        >
                          {downloadLoadingBookId === item.bookId
                            ? locale === 'ar' ? 'جارٍ التحقق...' : 'Checking...'
                            : locale === 'ar' ? 'تنزيل' : 'Download'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>

        {purchasedBooks.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-sura-line bg-sura-canvas p-4 text-sm text-sura-navy/75">
            {locale === 'ar'
              ? `عدد الكتب المشتراة: ${purchasedBooks.length}`
              : `Purchased books available: ${purchasedBooks.length}`}
          </div>
        ) : null}
      </section>
    </div>
  );
}
