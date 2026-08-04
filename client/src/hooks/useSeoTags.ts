import { useEffect } from 'react';

export type SeoOgTwitterImage = {
  url?: string;
  alt?: string;
};

export type SeoTagsInput = {
  title: string;
  description: string;
  canonicalUrl: string;
  openGraph?: {
    type?: string;
    image?: SeoOgTwitterImage;
  };
  twitter?: {
    cardType?: string;
    image?: SeoOgTwitterImage;
  };
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noIndex?: boolean;
  locale?: string;
  alternateLocales?: { lang: string; url: string }[];
};

function ensureMetaTag(selector: string, create: () => HTMLMetaElement) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

function ensureLinkTag(selector: string, create: () => HTMLLinkElement) {
  let el = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

export function useSeoTags(input: SeoTagsInput) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const title = input.title ?? '';
    const description = input.description ?? '';
    const canonicalUrl = input.canonicalUrl ?? '';

    document.title = title;

    // Ensure canonical
    ensureLinkTag('link[rel="canonical"]', () => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      return link;
    }).setAttribute('href', canonicalUrl);

    // Description
    ensureMetaTag('meta[name="description"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      return meta;
    }).setAttribute('content', description);

    // Open Graph
    const ogTitle = ensureMetaTag('meta[property="og:title"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:title');
      return meta;
    });
    ogTitle.setAttribute('content', title);

    const ogDescription = ensureMetaTag('meta[property="og:description"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:description');
      return meta;
    });
    ogDescription.setAttribute('content', description);

    const ogUrl = ensureMetaTag('meta[property="og:url"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:url');
      return meta;
    });
    ogUrl.setAttribute('content', canonicalUrl);

    const ogType = ensureMetaTag('meta[property="og:type"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:type');
      return meta;
    });
    ogType.setAttribute('content', input.openGraph?.type ?? 'website');

    const ogSiteName = ensureMetaTag('meta[property="og:site_name"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:site_name');
      return meta;
    });
    ogSiteName.setAttribute('content', 'Sura Codex');

    // og:locale
    if (input.locale) {
      const ogLocale = ensureMetaTag('meta[property="og:locale"]', () => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:locale');
        return meta;
      });
      ogLocale.setAttribute('content', input.locale === 'ar' ? 'ar_AR' : 'en_US');
    }

    // Clear all existing og:image and twitter:image meta tags first
    // This prevents stale images from previous page navigations
    document.querySelectorAll('meta[property="og:image"]').forEach(el => el.remove());
    document.querySelectorAll('meta[property="og:image:alt"]').forEach(el => el.remove());
    document.querySelectorAll('meta[property="og:image:width"]').forEach(el => el.remove());
    document.querySelectorAll('meta[property="og:image:height"]').forEach(el => el.remove());
    const twImgEl = document.querySelector('meta[name="twitter:image"]');
    if (twImgEl) twImgEl.remove();

    // og:image - only set if explicitly provided
    if (input.openGraph?.image?.url) {
      const ogImage = ensureMetaTag('meta[property="og:image"]', () => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:image');
        return meta;
      });
      ogImage.setAttribute('content', input.openGraph.image.url);

      const ogImageAlt = ensureMetaTag('meta[property="og:image:alt"]', () => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:image:alt');
        return meta;
      });
      ogImageAlt.setAttribute('content', input.openGraph.image.alt ?? title);

      // Set image dimensions (default 1200x630 for optimal social sharing)
      const ogWidth = ensureMetaTag('meta[property="og:image:width"]', () => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:image:width');
        return meta;
      });
      ogWidth.setAttribute('content', '1200');

      const ogHeight = ensureMetaTag('meta[property="og:image:height"]', () => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:image:height');
        return meta;
      });
      ogHeight.setAttribute('content', '630');
    }

    // Twitter
    const twCard = ensureMetaTag('meta[name="twitter:card"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'twitter:card');
      return meta;
    });
    twCard.setAttribute('content', input.twitter?.cardType ?? 'summary_large_image');

    const twTitle = ensureMetaTag('meta[name="twitter:title"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'twitter:title');
      return meta;
    });
    twTitle.setAttribute('content', title);

    const twDescription = ensureMetaTag('meta[name="twitter:description"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'twitter:description');
      return meta;
    });
    twDescription.setAttribute('content', description);

const twUrl = ensureMetaTag('meta[name="twitter:url"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'twitter:url');
      return meta;
    });
    twUrl.setAttribute('content', canonicalUrl);

    // twitter:site and twitter:creator
    const twSite = ensureMetaTag('meta[name="twitter:site"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'twitter:site');
      return meta;
    });
    twSite.setAttribute('content', '@suracodex');

    const twCreator = ensureMetaTag('meta[name="twitter:creator"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'twitter:creator');
      return meta;
    });
    twCreator.setAttribute('content', '@suracodex');

    // twitter:image - only set if explicitly provided
    if (input.twitter?.image?.url) {
      const twImage = ensureMetaTag('meta[name="twitter:image"]', () => {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'twitter:image');
        return meta;
      });
      twImage.setAttribute('content', input.twitter.image.url);
    } else {
      const existingTwImage = document.querySelector('meta[name="twitter:image"]');
      if (existingTwImage) existingTwImage.remove();
    }

    // NoIndex / NoFollow
    if (input.noIndex) {
      const robots = ensureMetaTag('meta[name="robots"]', () => {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'robots');
        return meta;
      });
      robots.setAttribute('content', 'noindex, nofollow');
    } else {
      const existingRobots = document.head.querySelector('meta[name="robots"]');
      if (existingRobots) {
        existingRobots.setAttribute('content', 'index, follow');
      }
    }

    // Hreflang / locale alternates
    if (input.locale) {
      document.documentElement.setAttribute('lang', input.locale);
    }
    if (input.alternateLocales && Array.isArray(input.alternateLocales)) {
      input.alternateLocales.forEach((alt) => {
        ensureLinkTag(`link[rel="alternate"][hreflang="${alt.lang}"]`, () => {
          const link = document.createElement('link');
          link.setAttribute('rel', 'alternate');
          link.setAttribute('hreflang', alt.lang);
          return link;
        }).setAttribute('href', alt.url);
      });
    }

    // JSON-LD Structured Data (single object or array)
    if (input.jsonLd) {
      // Remove any existing JSON-LD scripts we control (by data attribute)
      const existingScripts = document.head.querySelectorAll('script[type="application/ld+json"]');
      existingScripts.forEach((s) => s.remove());

      const schemas = Array.isArray(input.jsonLd) ? input.jsonLd : [input.jsonLd];
      schemas.forEach((schema) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo', 'true');
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
      });
    }

  }, [
    input.title,
    input.description,
    input.canonicalUrl,
    input.openGraph?.type,
    input.openGraph?.image?.url,
    input.openGraph?.image?.alt,
    input.twitter?.cardType,
    input.twitter?.image?.url,
    input.jsonLd,
    input.noIndex,
    input.locale,
    input.alternateLocales,
  ]);
}

