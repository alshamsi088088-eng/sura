import { useSeoTags, type SeoOgTwitterImage } from '../hooks/useSeoTags';

export type SeoHeadProps = {
  /** Page title (required) */
  title: string;
  /** Meta description (required) */
  description: string;
  /** Canonical URL — defaults to current window.location.href if omitted */
  canonicalUrl?: string;
  /** Open Graph configuration */
  openGraph?: {
    type?: string;
    image?: SeoOgTwitterImage;
  };
  /** Twitter card configuration */
  twitter?: {
    cardType?: string;
    image?: SeoOgTwitterImage;
  };
  /** JSON-LD structured data (single object or array) */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Set to true to add noindex, nofollow */
  noIndex?: boolean;
  /** Page locale (e.g. "en", "ar") */
  locale?: string;
  /** Alternate locale URLs for hreflang */
  alternateLocales?: { lang: string; url: string }[];
};

/**
 * `<SeoHead />` — The single public API for managing page-level SEO.
 *
 * This component is a declarative wrapper around useSeoTags.
 * It should be used on every page to set `<title>`, meta tags,
 * Open Graph, Twitter cards, JSON-LD structured data, and more.
 *
 * @example
 * 
```
 * <SeoHead
 *   title="About Us - Sura Codex"
 *   description="Learn about our mission."
 *   canonicalUrl="https://sura-codex.com/about"
 *   openGraph={{ image: { url: "/og-about.png", alt: "About Sura Codex" } }}
 *   jsonLd={{
 *     "@context": "https://schema.org",
 *     "@type": "AboutPage",
 *     name: "About Sura Codex",
 *   }}
 * />
 * 
```
 *
 * Migration note:
 * Existing pages that call `useSeoTags()` or `usePageMetadata()` directly
 * will continue to work. New pages should prefer `<SeoHead />`.
 */
export function SeoHead({
  title,
  description,
  canonicalUrl,
  openGraph,
  twitter,
  jsonLd,
  noIndex,
  locale,
  alternateLocales,
}: SeoHeadProps) {
  useSeoTags({
    title,
    description,
    canonicalUrl: canonicalUrl ?? (typeof window !== 'undefined' ? window.location.href : ''),
    openGraph,
    twitter,
    jsonLd,
    noIndex,
    locale,
    alternateLocales,
  });

  // This component does not render any DOM — it only manages <head> tags.
  return null;
}
