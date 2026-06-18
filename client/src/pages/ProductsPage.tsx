
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocale } from '../context/LocaleContext';

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
  const [products, setProducts] = useState<ProductItem[]>([]);

  useEffect(() => {
    axios.get('/api/products').then((res) => setProducts(res.data.products));
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-sura-line bg-sura-canvas p-8">
        <h1 className="text-4xl font-semibold">{locale === 'ar' ? 'المنتجات الرقمية' : 'Digital Products'}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-sura-navy/80">{locale === 'ar' ? 'قوالب ودورات ومواد رقمية مع ترخيص واضح.' : 'Templates, eBooks, and courses with download delivery after purchase.'}</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        {(Array.isArray(products) ? products : []).map((product) => (
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
    </div>
  );
}
