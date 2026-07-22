
import { useEffect, useState, useMemo, Component, ReactNode } from 'react';
import axios from 'axios';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AdminMenu } from '../components/AdminMenu';
import { useSeoTags } from '../hooks/useSeoTags';

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  albumId?: string;
  image: string;
}

interface Album {
  id: string;
  name: string;
  coverImage?: string;
}

// Error Boundary component
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class GalleryErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Gallery error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex h-72 w-full items-center justify-center rounded-3xl border border-sura-line bg-sura-canvas">
          <p className="text-sura-navy/50">{this.props.children ? 'Image failed to load' : 'Content not available'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Image with fallback
function GalleryImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-sura-navy/10 ${className || ''}`}>
        <span className="text-4xl">🖼️</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`${className || ''} ${loaded ? '' : 'hidden'}`}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
    />
  );
}

export function GalleryPage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  useSeoTags({
    title: locale === 'ar' ? 'المعرض | سُرى' : 'Gallery | Sura Codex',
    description: locale === 'ar'
      ? 'قصص مرئية وصور تجمع الجو الأدبي والثقافي في سُرى.'
      : 'Browse editorial images and creative visual stories on Sura Codex.',
    canonicalUrl: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/gallery`,
    openGraph: {
      type: 'website',
      },
    twitter: {
      cardType: 'summary_large_image',
    },
    locale,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: locale === 'ar' ? 'المعرض | سُرى' : 'Gallery | Sura Codex',
        description: locale === 'ar'
          ? 'قصص مرئية وصور تجمع الجو الأدبي والثقافي في سُرى.'
          : 'Browse editorial images and creative visual stories on Sura Codex.',
        url: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/gallery`,
        inLanguage: locale === 'ar' ? 'ar' : 'en',
      },
    ],
  });

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [active, setActive] = useState<GalleryItem | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  useEffect(() => {
    setIsLoading(true);
    axios.get('/api/gallery').then((res) => {
      setItems(res.data?.items ?? []);
    }).catch(() => {
      setItems([]);
    }).finally(() => setIsLoading(false));
    // Load albums from Supabase
    if (supabase) {
      supabase!.from('Album').select('*').order('name').then(({ data }) => {
        if (data) setAlbums(data);
      });
    }
  }, []);

  const categories = useMemo(() => ['All', ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))], [items]);

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (selectedAlbum !== 'all') {
      filtered = filtered.filter((item) => item.albumId === selectedAlbum);
    }
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }
    return filtered;
  }, [items, selectedAlbum, selectedCategory]);

  const handleUpload = async () => {
    if (!selectedFiles?.length || !newTitle.trim()) return;
    setUploading(true);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileName = `${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase!.storage.from('gallery').upload(fileName, file);
        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }
        const { data: urlData } = supabase!.storage.from('gallery').getPublicUrl(fileName);
        await supabase!.from('GalleryItem').insert({
          title: newTitle.trim() + (i > 0 ? ` (${i + 1})` : ''),
          description: newDescription.trim(),
          category: selectedCategory !== 'All' ? selectedCategory : 'General',
          albumId: selectedAlbum !== 'all' ? selectedAlbum : null,
          image: urlData.publicUrl,
        });
      }
      // Reload
      axios.get('/api/gallery').then((res) => setItems(res.data.items));
      setNewTitle('');
      setNewDescription('');
      setSelectedFiles(null);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">{locale === 'ar' ? 'المعرض' : 'Gallery'}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-sura-navy/80">{locale === 'ar' ? 'قصص مرئية وصور تجمع الجو الأدبي والثقافي.' : 'Browse editorial images and creative visual stories with categories and tags.'}</p>
          </div>
          {user && (
            <button
              onClick={() => document.getElementById('upload-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="self-start rounded-full bg-sura-gold px-5 py-2 text-sm font-semibold text-sura-dark transition hover:opacity-95"
            >
              {locale === 'ar' ? 'رفع صور' : 'Upload Images'}
            </button>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-3xl border border-sura-line bg-sura-canvas p-4">
        <select
          value={selectedAlbum}
          onChange={(e) => setSelectedAlbum(e.target.value)}
          className="rounded-full border border-sura-line bg-sura-canvas px-4 py-2 text-sm"
        >
          <option value="all">{locale === 'ar' ? 'كل الألبومات' : 'All Albums'}</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>{album.name}</option>
          ))}
        </select>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-full border border-sura-line bg-sura-canvas px-4 py-2 text-sm"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Upload Form */}
      {user && (
        <div id="upload-form" className="rounded-3xl border border-sura-line bg-sura-canvas p-6 space-y-4">
          <h3 className="text-lg font-semibold">{locale === 'ar' ? 'رفع صور جديدة' : 'Upload New Images'}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={locale === 'ar' ? 'عنوان الصورة' : 'Image title'}
              className="w-full rounded-3xl border border-sura-line bg-sura-canvas px-4 py-3 text-sura-navy"
            />
            <input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder={locale === 'ar' ? 'الوصف (اختياري)' : 'Description (optional)'}
              className="w-full rounded-3xl border border-sura-line bg-sura-canvas px-4 py-3 text-sura-navy"
            />
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setSelectedFiles(e.target.files)}
            className="w-full rounded-3xl border border-sura-line bg-sura-canvas px-4 py-3 text-sura-navy file:mr-4 file:rounded-full file:border-0 file:bg-sura-teal file:px-4 file:py-1 file:text-sm file:font-semibold file:text-white"
          />
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFiles?.length || !newTitle.trim()}
            className="rounded-full bg-sura-gold px-6 py-2 text-sm font-semibold text-sura-dark disabled:opacity-60"
          >
            {uploading ? (locale === 'ar' ? 'جاري الرفع...' : 'Uploading...') : (locale === 'ar' ? 'رفع' : 'Upload')}
          </button>
        </div>
      )}

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-3xl bg-sura-navy/20" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-3xl border border-sura-line bg-sura-canvas">
          <p className="text-sura-navy/50">{locale === 'ar' ? 'لا توجد صور بعد.' : 'No images yet.'}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <GalleryErrorBoundary key={item.id}>
              <div className="group relative overflow-hidden rounded-3xl border border-sura-line bg-sura-canvas transition hover:-translate-y-1">
                <button onClick={() => setActive(item)} className="w-full text-left">
                  <GalleryImage src={item.image} alt={item.title} className="h-72 w-full object-cover transition duration-500 group-hover:scale-105" />
                </button>
                <div className="p-4 text-left">
                  <div className="flex items-start justify-between">
                    <div className="text-xs uppercase tracking-[0.2em] text-sura-teal">{item.category}</div>
                    <AdminMenu
                      entityType="gallery"
                      entityId={item.id}
                      onDeleteSuccess={() => {
                        setItems((prev) => prev.filter((i) => i.id !== item.id));
                      }}
                    />
                  </div>
                  <h2 className="mt-2 text-xl font-semibold">{item.title}</h2>
                  {item.description && <p className="mt-1 text-sm text-sura-navy/70 line-clamp-2">{item.description}</p>}
                </div>
              </div>
            </GalleryErrorBoundary>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" onClick={() => setActive(null)}>
          <div className="relative max-w-4xl overflow-hidden rounded-3xl bg-sura-beige p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActive(null)} className="absolute right-4 top-4 rounded-full border border-sura-line px-3 py-2 text-sm">Close</button>
            <GalleryErrorBoundary>
              <GalleryImage src={active.image} alt={active.title} className="h-[520px] w-full object-cover" />
            </GalleryErrorBoundary>
            <div className="mt-4 text-center">
              <h3 className="text-2xl font-semibold">{active.title}</h3>
              {active.description && <p className="mt-2 text-sm text-sura-navy/70">{active.description}</p>}
              <p className="mt-2 text-sm text-sura-navy/50">{locale === 'ar' ? 'عرض كامل للقطعة المختارة.' : 'Full-screen view of the selected image.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
