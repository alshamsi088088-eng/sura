import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { trackEvent } from '../lib/analytics';
import { AvatarUpload } from '../components/AvatarUpload';

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

interface DownloadStatus {
  loading: boolean;
  allowed?: boolean;
  error?: string;
}

export function ProfilePage() {
  const { user, loading } = useAuth();
  const { locale } = useLocale();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<PurchasedOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // bookId -> status
  const [downloadStatusByBookId, setDownloadStatusByBookId] = useState<Record<string, DownloadStatus>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  // Fetch orders
  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        const response = await axios.get('/api/store/orders');
        setOrders(response.data.orders || []);
        trackEvent('view_purchase_history');
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // Aggregate purchased books without duplication
  const purchasedBooks = useMemo(() => {
    const booksMap = new Map<
      string,
      {
        book?: PurchasedOrderItem['book'];
        priceAtPurchase: number;
        quantity: number;
        purchaseDate: string;
        orderId: string;
      }
    >();

    // No duplication: keep first occurrence (earliest/latest depending on API ordering).
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!booksMap.has(item.bookId)) {
          booksMap.set(item.bookId, {
            book: item.book,
            priceAtPurchase: item.priceAtPurchase,
            quantity: item.quantity,
            purchaseDate: order.createdAt,
            orderId: order.id
          });
        }
      });
    });

    return Array.from(booksMap.values());
  }, [orders]);

  // Download verification + triggering file download
  const handleDownload = async (bookId: string) => {
    if (!bookId) return;

    setDownloadStatusByBookId((prev) => ({
      ...prev,
      [bookId]: { loading: true }
    }));

    try {
      const response = await axios.get(`/api/store/download/${bookId}`, { withCredentials: true });

      if (response.data?.allowed && response.data?.book?.fileUrl) {
        const { fileUrl, title } = response.data.book;

        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = `${title || 'book'}.pdf`;
        link.click();

        setDownloadStatusByBookId((prev) => ({
          ...prev,
          [bookId]: { loading: false, allowed: true }
        }));

        trackEvent('book_download', { book_id: bookId });
      } else {
        setDownloadStatusByBookId((prev) => ({
          ...prev,
          [bookId]: {
            loading: false,
            allowed: false,
            error: locale === 'ar' ? 'غير مسموح بالتنزيل' : 'Download not allowed'
          }
        }));
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setDownloadStatusByBookId((prev) => ({
        ...prev,
        [bookId]: {
          loading: false,
          allowed: false,
          error: err.response?.data?.message || (locale === 'ar' ? 'فشل التنزيل' : 'Failed to download')
        }
      }));
    }
  };

  // Preview (still verifies access)
  const handlePreview = async (bookId: string) => {
    if (!bookId) return;

    try {
      const response = await axios.get(`/api/store/download/${bookId}`, { withCredentials: true });

      if (response.data?.allowed && response.data?.book?.previewUrl) {
        window.open(response.data.book.previewUrl, '_blank', 'noopener,noreferrer');
        trackEvent('book_preview', { book_id: bookId });
      }
    } catch (error) {
      console.error('Failed to preview:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div>
      </div>
    );
  }

  const t = {
    en: {
      myProfile: 'My Profile',
      myPurchases: 'My Purchases',
      noPurchases: 'No purchases yet',
      startShopping: 'Start Shopping',
      purchaseDate: 'Purchase Date',
      price: 'Price',
      actions: 'Actions',
      download: 'Download',
      preview: 'Preview',
      downloading: 'Downloading...',
      error: 'Error'
    },
    ar: {
      myProfile: 'ملفي الشخصي',
      myPurchases: 'مشترياتي',
      noPurchases: 'لا توجد مشتريات بعد',
      startShopping: 'ابدأ التسوق',
      purchaseDate: 'تاريخ الشراء',
      price: 'السعر',
      actions: 'الإجراءات',
      download: 'تحميل',
      preview: 'معاينة',
      downloading: 'جاري التحميل...',
      error: 'خطأ'
    }
  };

  const lang = locale === 'ar' ? t.ar : t.en;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Avatar */}
        <div className="mb-8 flex items-center gap-6">
          <AvatarUpload size="xl" onAvatarChange={() => {}} />
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{lang.myProfile}</h1>
            <p className="text-slate-400">Welcome, {user?.name || 'User'}</p>
          </div>
        </div>

        {/* ✅ My Purchases Section */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-2xl font-bold text-white mb-6">{lang.myPurchases}</h2>

          {ordersLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-purple-500"></div>
            </div>
          ) : purchasedBooks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">{lang.noPurchases}</p>
              <button
                onClick={() => navigate('/store')}
                className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
              >
                {lang.startShopping}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="pb-3 text-slate-300 font-semibold">{locale === 'ar' ? 'اسم الكتاب' : 'Book'}</th>
                    <th className="pb-3 text-slate-300 font-semibold">{lang.purchaseDate}</th>
                    <th className="pb-3 text-slate-300 font-semibold">{lang.price}</th>
                    <th className="pb-3 text-slate-300 font-semibold">{lang.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {purchasedBooks.map((purchase) => {
                    const bookId = purchase.book?.id || '';
                    const status = bookId ? downloadStatusByBookId[bookId] : undefined;

                    return (
                      <tr key={bookId} className="border-b border-slate-700 hover:bg-slate-700/30 transition">
                        <td className="py-4 text-white">{purchase.book?.title || 'Unknown'}</td>
                        <td className="py-4 text-slate-400">
                          {purchase.purchaseDate
                            ? new Date(purchase.purchaseDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')
                            : '-'}
                        </td>
                        <td className="py-4 text-white font-medium">${purchase.priceAtPurchase.toFixed(2)}</td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-3">
                            {/* ✅ Download Button */}
                            <button
                              onClick={() => handleDownload(bookId)}
                              disabled={!bookId || status?.loading}
                              className={`px-3 py-1 rounded text-sm font-medium transition ${
                                !bookId
                                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                  : status?.loading
                                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                  : status?.error
                                  ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                                  : 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30'
                              }`}
                            >
                              {status?.loading ? lang.downloading : status?.error ? lang.error : lang.download}
                            </button>

                            {/* ✅ Preview Button */}
                            {purchase.book?.previewUrl && (
                              <button
                                onClick={() => handlePreview(bookId)}
                                disabled={!bookId}
                                className="px-3 py-1 rounded text-sm font-medium bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition"
                              >
                                {lang.preview}
                              </button>
                            )}
                          </div>

                          {/* Error message */}
                          {status?.error ? <p className="text-red-400 text-xs mt-1">{status.error}</p> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order history (optional) - kept minimal */}
        {orders.length > 0 && (
          <div className="mt-8 bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">{locale === 'ar' ? 'سجل الطلبات' : 'Order History'}</h2>
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-slate-700/50 rounded p-4 border border-slate-600">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-white font-medium">
                        {locale === 'ar' ? 'الطلب' : 'Order'} #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {new Date(order.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">${order.total.toFixed(2)}</p>
                      <p
                        className={`text-xs font-medium ${
                          order.status === 'paid' ? 'text-green-400' : 'text-yellow-400'
                        }`}
                      >
                        {order.status === 'paid'
                          ? locale === 'ar'
                            ? 'مدفوع'
                            : 'Paid'
                          : locale === 'ar'
                          ? 'معلق'
                          : 'Pending'}
                      </p>
                    </div>
                  </div>
                  {order.discountCode ? (
                    <p className="text-slate-400 text-sm">
                      {locale === 'ar' ? 'الكود' : 'Code'}: {order.discountCode}
                      {order.discountAmount ? ` (-$${order.discountAmount.toFixed(2)})` : ''}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

