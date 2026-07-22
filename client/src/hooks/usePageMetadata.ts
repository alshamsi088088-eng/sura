import { useSeoTags, type SeoOgTwitterImage } from './useSeoTags';

export type PageMetadataOptions = {
  /** Page title */
  title: string;
  /** Meta description */
  description: string;
  /** Canonical URL (defaults to current window location) */
  canonicalUrl?: string;
  /** Open Graph image */
  ogImage?: SeoOgTwitterImage;
  /** Twitter card image (defaults to ogImage if not provided) */
  twitterImage?: SeoOgTwitterImage;
  /** JSON-LD structured data */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Whether to add noindex/nofollow */
  noIndex?: boolean;
  /** Page locale */
  locale?: string;
  /** Alternate locale URLs */
  alternateLocales?: { lang: string; url: string }[];
};

/**
 * Lightweight page metadata hook for simple pages.
 * For advanced SEO needs, use <SeoHead /> component instead.
 */
export function usePageMetadata(options: PageMetadataOptions) {
  const {
    title,
    description,
    canonicalUrl,
    ogImage,
    twitterImage,
    jsonLd,
    noIndex,
    locale,
    alternateLocales,
  } = options;

  useSeoTags({
    title,
    description,
    canonicalUrl: canonicalUrl || (typeof window !== 'undefined' ? window.location.href : ''),
    openGraph: {
      type: 'website',
      ...(ogImage ? { image: ogImage } : {}),
    },
    twitter: {
      cardType: 'summary_large_image',
      ...(twitterImage || ogImage ? { image: twitterImage || ogImage! } : {}),
    },
    ...(jsonLd ? { jsonLd } : {}),
    ...(noIndex !== undefined ? { noIndex } : {}),
    ...(locale ? { locale } : {}),
    ...(alternateLocales ? { alternateLocales } : {}),
  });
}


