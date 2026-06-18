
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocale } from '../context/LocaleContext';

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
}

export function GalleryPage() {
  const { locale } = useLocale();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [active, setActive] = useState<GalleryItem | null>(null);

  useEffect(() => {
    axios.get('/api/gallery').then((res) => setItems(res.data.items));
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <h1 className="text-4xl font-semibold">{locale === 'ar' ? 'المعرض' : 'Gallery'}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-sura-navy/80">{locale === 'ar' ? 'قصص مرئية وصور تجمع الجو الأدبي والثقافي.' : 'Browse editorial images and creative visual stories with categories and tags.'}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(Array.isArray(items) ? items : []).map((item) => (
          <button key={item.id} onClick={() => setActive(item)} className="group overflow-hidden rounded-3xl border border-sura-line bg-sura-canvas transition hover:-translate-y-1">
            <img src={item.image} alt={item.title} className="h-72 w-full object-cover transition duration-500 group-hover:scale-105" />
            <div className="p-4 text-left">
              <div className="text-xs uppercase tracking-[0.2em] text-sura-teal">{item.category}</div>
              <h2 className="mt-2 text-xl font-semibold">{item.title}</h2>
            </div>
          </button>
        ))}
      </div>
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <div className="relative max-w-4xl overflow-hidden rounded-3xl bg-sura-beige p-6 shadow-2xl">
            <button onClick={() => setActive(null)} className="absolute right-4 top-4 rounded-full border border-sura-line px-3 py-2 text-sm">Close</button>
            <img src={active.image} alt={active.title} className="h-[520px] w-full object-cover" />
            <div className="mt-4 text-center">
              <h3 className="text-2xl font-semibold">{active.title}</h3>
              <p className="mt-2 text-sm text-sura-navy/70">{locale === 'ar' ? 'عرض كامل للقطعة المختارة.' : 'Full-screen view of the selected image.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
