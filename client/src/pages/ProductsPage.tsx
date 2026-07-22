
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocale } from '../context/LocaleContext';
import { useSeoTags } from '../hooks/useSeoTags';

interface ProductItem {
  id: string;
  title: string;
  description: string;
  price: number;
  license: string;
  type: string;
}

export function ProductsPage() {
  const { locale } = useLocale();
  useSeoTags({
    title: locale === 'ar' ? 'المنتجات الرقمية | سُرى' : 'Digital Products | Sura Codex',
    description: locale === 'ar'
      ? 'قوالب ودورات ومواد رقمية مع ترخيص واضح وتحميل آمن.'
      : 'Templates, eBooks, and courses with clear licensing and secure download delivery.',
    canonicalUrl: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/products`,
    openGraph: {
      type: 'website',
      // TODO: Add dedicated 1200×630 OG image when available
    },
    twitter: {
      cardType: 'summary_large_image',
      // TODO: Add dedicated Twitter image when available
    },
    locale,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: locale === 'ar' ? 'المنتجات الرقمية | سُرى' : 'Digital Products | Sura Codex',
        description: locale === 'ar'
          ? 'قوالب ودورات ومواد رقمية مع ترخيص واضح وتحميل آمن.'
          : 'Templates, eBooks, and courses with clear licensing and secure download delivery.',
        url: `${import.meta.env.VITE_PUBLIC_BASE_URL || ''}/products`,
        inLanguage: locale === 'ar' ? 'ar' : 'en',
      },
    ],
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/products')
      .then((res) => setProducts(res.data.products || []))
      .catch(() => setError(locale === 'ar' ? 'فشل تحميل المنتجات' : 'Failed to load products'))
      .finally(() => setLoading(false));
  }, [locale]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-3xl bg-sura-line/50" />
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 rounded-3xl bg-sura-line/50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-8">
        <div className="rounded-3xl border border-red-500/50 bg-red-500/10 p-8 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <h1 className="text-4xl font-semibold">{locale === 'ar' ? 'المنتجات الرقمية' : 'Digital Products'}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-sura-navy/80">{locale === 'ar' ? 'قوالب ودورات ومواد رقمية مع ترخيص واضح.' : 'Templates, eBooks, and courses with download delivery after purchase.'}</p>
      </header>
      {!products?.length ? (
        <div className="rounded-3xl border border-sura-line bg-sura-canvas p-8 text-center">
          <p className="text-sura-navy/60">{locale === 'ar' ? 'لا توجد منتجات متاحة' : 'No products available'}</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {products.map((product) => (
            <article key={product.id} className="rounded-3xl border border-sura-line bg-sura-canvas p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-sura-teal">{product.type}</div>
                  <h2 className="mt-2 text-2xl font-semibold">{product.title}</h2>
                </div>
                <div className="rounded-full bg-sura-gold px-4 py-2 text-sm font-semibold text-sura-dark">{product.license}</div>
              </div>
              <p className="mt-4 text-sm leading-7 text-sura-navy/80">{product.description}</p>
              <div className="mt-6 flex items-center justify-between gap-3">
                <span className="text-lg font-semibold text-sura-teal">${product.price.toFixed(2)}</span>
                <button className="rounded-full bg-sura-gold px-4 py-2 text-sm font-semibold text-sura-dark">{locale === 'ar' ? 'اشترِ الآن' : 'Buy now'}</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
