import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { supabase } from '../lib/supabaseClient';
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
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [downloadLoadingBookId, setDownloadLoadingBookId] = useState<string | null>(null);
  const [userStats, setUserStats] = useState({ articles: 0, novels: 0, chapters: 0, followers: 0, following: 0 });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    setOrdersError(null);
    axios
      .get('/api/store/orders', { withCredentials: true })
      .then((res) => {
        setOrders(res.data.orders || []);
      })
      .catch((error) => {
        setOrdersError(locale === 'ar' ? 'فشل تحميل المشتريات.' : 'Failed to load purchases.');
      })
      .finally(() => setOrdersLoading(false));
  }, [user, locale]);

  useEffect(() => {
    if (!user || !supabase) return;
    setStatsLoading(true);
    const loadUserStats = async () => {
      const { data: articles } = await supabase!.from('Article').select('id').eq('authorId', user.id);
      const { data: novels } = await supabase!.from('Novel').select('id').eq('authorId', user.id);
      const { data: chapters } = await supabase!.from('Chapter').select('id');
      const { data: followers } = await supabase!.from('Follow').select('id').eq('followingId', user.id);
      const { data: following } = await supabase!.from('Follow').select('id').eq('followerId', user.id);
      setUserStats({
        articles: articles?.length || 0,
        novels: novels?.length || 0,
        chapters: chapters?.length || 0,
        followers: followers?.length || 0,
        following: following?.length || 0
      });
      setStatsLoading(false);
    };
    loadUserStats();
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Link to="/create-post" className="rounded-2xl border border-sura-line bg-sura-canvas p-4 text-center transition hover:border-sura-teal">
          <div className="text-2xl font-bold text-sura-teal">{userStats.articles}</div>
          <div className="text-xs text-sura-navy/70">{locale === 'ar' ? 'المقالات' : 'Articles'}</div>
        </Link>
        <Link to="/create-novel" className="rounded-2xl border border-sura-line bg-sura-canvas p-4 text-center transition hover:border-sura-teal">
          <div className="text-2xl font-bold text-sura-teal">{userStats.novels}</div>
          <div className="text-xs text-sura-navy/70">{locale === 'ar' ? 'الروايات' : 'Novels'}</div>
        </Link>
        <Link to="/create-chapter" className="rounded-2xl border border-sura-line bg-sura-canvas p-4 text-center transition hover:border-sura-teal">
          <div className="text-2xl font-bold text-sura-teal">{userStats.chapters}</div>
          <div className="text-xs text-sura-navy/70">{locale === 'ar' ? 'الفصول' : 'Chapters'}</div>
        </Link>
        <div className="rounded-2xl border border-sura-line bg-sura-canvas p-4 text-center">
          <div className="text-2xl font-bold text-sura-teal">{userStats.followers}</div>
          <div className="text-xs text-sura-navy/70">{locale === 'ar' ? 'المتابعون' : 'Followers'}</div>
        </div>
        <div className="rounded-2xl border border-sura-line bg-sura-canvas p-4 text-center">
          <div className="text-2xl font-bold text-sura-teal">{userStats.following}</div>
          <div className="text-xs text-sura-navy/70">{locale === 'ar' ? 'يتابع' : 'Following'}</div>
        </div>
      </div>

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
          <Link to="/dashboard" className="mt-4 block w-full rounded-full border border-sura-line px-4 py-2 text-sm text-sura-navy/80">
            {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </Link>
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold">{locale === 'ar' ? 'مشترياتي' : 'My Purchases'}</h3>
              <p className="text-sm text-sura-navy/70">
                {locale === 'ar' ? 'الكتب التي لديك لها حق تنزيل.' : 'Books you have access to download.'}
              </p>
            </div>
            {purchasedBooks.length > 0 ? (
              <div className="rounded-full border border-sura-line px-4 py-2 text-sm text-sura-navy/80">
                {locale === 'ar'
                  ? `عدد الكتب: ${purchasedBooks.length}`
                  : `Books: ${purchasedBooks.length}`}
              </div>
            ) : null}
          </div>

          {ordersLoading ? (
            <div className="text-sm text-sura-navy/70">{locale === 'ar' ? 'جارٍ تحميل الطلبات...' : 'Loading orders...'}</div>
          ) : ordersError ? (
            <div className="text-sm text-red-500">{ordersError}</div>
          ) : orders.length === 0 ? (
            <div className="text-sm text-sura-navy/70">{locale === 'ar' ? 'لا توجد مشتريات بعد.' : 'No purchases yet.'}</div>
          ) : purchasedBooks.length === 0 ? (
            <div className="text-sm text-sura-navy/70">{locale === 'ar' ? 'لا توجد كتب قابلة للتنزيل.' : 'No downloadable books.'}</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {purchasedBooks.map((item) => (
                <div key={item.id} className="rounded-3xl border border-sura-line bg-sura-canvas p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-sura-navy/90">{item.titleSnapshot}</div>
                      <div className="mt-1 text-xs text-sura-navy/70">
                        ${Number(item.priceAtPurchase).toFixed(2)} × {item.quantity}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
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
          )}
        </div>
      </section>
    </div>
  );
}

