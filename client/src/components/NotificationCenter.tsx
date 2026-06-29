import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  actorName: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
}

export function NotificationCenter({ isOpen, onClose, onUnreadChange }: NotificationCenterProps) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isArabic = locale === 'ar';

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/engagement/notifications`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        const unread = (data.notifications || []).filter((n: Notification) => !n.isRead).length;
        onUnreadChange?.(unread);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
    }
  }, [isOpen, user]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/engagement/notifications/${id}/read`, {
        method: 'POST',
        credentials: 'include'
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      const unread = notifications.filter((n) => !n.isRead && n.id !== id).length;
      onUnreadChange?.(unread);
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await fetch(`${API_URL}/api/engagement/notifications/read-all`, {
        method: 'POST',
        credentials: 'include'
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onUnreadChange?.(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return (
          <svg className="h-5 w-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.668 3.5 3.5 5.667 3.5 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        );
      case 'comment':
      case 'reply':
        return (
          <svg className="h-5 w-5 text-sura-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M12 0a.375.375 0 01-.375 0 .375.375 0 01.375 0zm0 0v7.5m-3.75-4.5h-.375M12 12a.375.375 0 01-.375 0 .375.375 0 01.375 0zm0 0h.375M4.5 12a.375.375 0 01-.375 0 .375.375 0 01.375 0zm0 0h.375m11.25 0a.375.375 0 01-.375 0 .375.375 0 01.375 0zm0 0h.375" />
          </svg>
        );
      case 'reaction':
        return (
          <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        );
      case 'follow':
        return (
          <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766a49.393 49.393 0 001.476-7.467 9.342 9.342 0 012.563-4.51M15 19.128a9.342 9.342 0 012.563-4.51" />
          </svg>
        );
      case 'newChapter':
      case 'newArticle':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 19.5l6.75 6.75M3.75 7.5h7.5m-7.5 3h6.428" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m0 0h2a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8 0h.008v.008H12v-.008zM9 21h6" />
          </svg>
        );
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return isArabic ? 'الآن' : 'Just now';
    if (minutes < 60) return `${minutes}${isArabic ? 'د' : 'm'}`;
    if (hours < 24) return `${hours}${isArabic ? 'س' : 'h'}`;
    if (days < 7) return `${days}${isArabic ? 'ي' : 'd'}`;
    return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US');
  };

  if (!isOpen) return null;

  return (
    <div className="glass-card absolute top-[calc(100%+10px)] z-50 w-80 sm:w-96 max-h-[500px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <h3 className="text-sm font-semibold text-sura-ivory">
          {isArabic ? 'الإشعارات' : 'Notifications'}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="rounded-lg p-1.5 text-sura-ivory/60 hover:bg-white/5 hover:text-sura-ivory"
            title={isArabic ? 'الإعدادات' : 'Settings'}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-sura-ivory/60 hover:bg-white/5 hover:text-sura-ivory"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mark all as read */}
      {notifications.some((n) => !n.isRead) && (
        <button
          onClick={markAllAsRead}
          className="mx-4 mt-2 text-xs text-sura-teal hover:underline"
        >
          {isArabic ? 'تحديد الكل كمقروء' : 'Mark all as read'}
        </button>
      )}

      {/* Settings Panel */}
      {settingsOpen && (
        <div className="border-b border-white/10 p-4">
          <NotificationSettingsForm onClose={() => setSettingsOpen(false)} />
        </div>
      )}

      {/* List */}
      {!settingsOpen && (
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sura-ivory/50">
              {isArabic ? 'لا توجد إشعارات' : 'No notifications'}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  icon={getNotificationIcon(notification.type)}
                  timeAgo={formatTime(notification.createdAt)}
                  isArabic={isArabic}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.id);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  icon: React.ReactNode;
  timeAgo: string;
  isArabic: boolean;
  onClick: () => void;
}

function NotificationItem({ notification, icon, timeAgo, isArabic, onClick }: NotificationItemProps) {
  const content = (
    <div
      className={`flex gap-3 p-3 transition hover:bg-white/5 ${
        !notification.isRead ? 'bg-pink-500/5' : ''
      }`}
    >
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${notification.isRead ? 'text-sura-ivory/70' : 'text-sura-ivory'}`}>
          <span className="font-medium">{notification.title}</span>
          {notification.body && <span className="text-sura-ivory/60"> - {notification.body}</span>}
        </p>
        {notification.actorName && (
          <p className="text-xs text-sura-ivory/50 mt-0.5">{notification.actorName}</p>
        )}
        <p className="text-xs text-sura-ivory/40 mt-1">{timeAgo}</p>
      </div>
      {!notification.isRead && (
        <div className="shrink-0">
          <div className="h-2 w-2 rounded-full bg-pink-500" />
        </div>
      )}
    </div>
  );

  if (notification.link) {
    return (
      <Link to={notification.link} onClick={onClick} className="block">
        {content}
      </Link>
    );
  }

  return <div onClick={onClick}>{content}</div>;
}

function NotificationSettingsForm({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [settings, setSettings] = useState({
    likes: true,
    comments: true,
    replies: true,
    reactions: true,
    pollVotes: true,
    newChapter: true,
    newArticle: true
  });
  const [loading, setLoading] = useState(false);

  const isArabic = locale === 'ar';

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      const res = await fetch(`${API_URL}/api/engagement/notifications/settings`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings({
            likes: data.settings.likes,
            comments: data.settings.comments,
            replies: data.settings.replies,
            reactions: data.settings.reactions,
            pollVotes: data.settings.pollVotes,
            newChapter: data.settings.newChapter,
            newArticle: data.settings.newArticle
          });
        }
      }
    };
    fetchSettings();
  }, [user]);

  const saveSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/engagement/notifications/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      onClose();
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const labels = {
    likes: isArabic ? 'الإعجابات' : 'Likes',
    comments: isArabic ? 'التعليقات' : 'Comments',
    replies: isArabic ? 'الردود' : 'Replies',
    reactions: isArabic ? 'التفاعلات' : 'Reactions',
    pollVotes: isArabic ? 'تصويتات الاستطلاع' : 'Poll Votes',
    newChapter: isArabic ? 'فصل جديد' : 'New Chapter',
    newArticle: isArabic ? 'مقال جديد' : 'New Article'
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-sura-ivory">
        {isArabic ? 'إعدادات الإشعارات' : 'Notification Settings'}
      </h4>
      <div className="space-y-2">
        {Object.entries(settings).map(([key, value]) => (
          <label key={key} className="flex items-center justify-between">
            <span className="text-sm text-sura-ivory/70">
              {labels[key as keyof typeof labels]}
            </span>
            <button
              onClick={() => toggleSetting(key as keyof typeof settings)}
              className={`relative h-5 w-9 rounded-full transition ${
                value ? 'bg-pink-500' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                  value ? 'left-4.5' : 'left-0.5'
                }`}
              />
            </button>
          </label>
        ))}
      </div>
      <button
        onClick={saveSettings}
        disabled={loading}
        className="w-full rounded-lg bg-purple-600 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? (isArabic ? 'جاري...' : 'Saving...') : (isArabic ? 'حفظ' : 'Save')}
      </button>
    </div>
  );
}

export default NotificationCenter;