import { useEffect, useState, useCallback } from 'react';
import { fetchSlotAds, trackAdEvent, AdRenderPayload, AdPosition } from '../../services/adService';
import { useLocale } from '../../context/LocaleContext';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let adsenseScriptPromise: Promise<void> | null = null;
let adsenseScriptLoaded = false;
let adsensePushAttempted = false;

async function ensureAdsenseScript(publisherId: string) {
  if (typeof window === 'undefined' || !publisherId) return;
  if (adsenseScriptLoaded) return;

  const existing = document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');
  if (existing) {
    adsenseScriptLoaded = true;
    return;
  }

  if (!adsenseScriptPromise) {
    adsenseScriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(publisherId)}`;
      script.crossOrigin = 'anonymous';
      script.onload = () => { adsenseScriptLoaded = true; resolve(); };
      script.onerror = () => { adsenseScriptPromise = null; reject(new Error('Failed to load AdSense script')); };
      document.head.appendChild(script);
    });
  }

  await adsenseScriptPromise;
}

interface AdSlotProps {
  position: AdPosition;
  category?: string;
  minHeightPx?: number;
  className?: string;
}

/**
 * Provider-aware ad slot renderer. Fetches the active, scheduled ads for a
 * given position from the backend and renders them via the correct provider
 * (AdSense, custom banner, or external redirect). Publisher/slot IDs are
 * never hardcoded — they come from DB records and env vars via the provider
 * adapter.
 */
export function AdSlot({ position, category, minHeightPx = 250, className = '' }: AdSlotProps) {
  const { locale } = useLocale();
  const [ads, setAds] = useState<AdRenderPayload[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    setAds([]);
    setLoaded(false);

    fetchSlotAds(position, { category, locale })
      .then((result) => {
        if (!mounted) return;
        setAds(result);
      })
      .catch(() => {
        // Ad loading must never break the page
        if (mounted) setAds([]);
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });

    return () => { mounted = false; };
  }, [position, category, locale]);

  const handleImpression = useCallback((ad: AdRenderPayload) => {
    void trackAdEvent(ad.id, 'impression', { position, category });
  }, [position, category]);

  const handleClick = useCallback((ad: AdRenderPayload) => {
    void trackAdEvent(ad.id, 'click', { position, category });
  }, [position, category]);

  if (!loaded) return null;

  if (ads.length === 0) return null;

  return (
    <div className={`my-8 ${className}`} aria-hidden="true">
      {ads.map((ad) => (
        <AdSlotRenderer key={ad.id} ad={ad} minHeightPx={minHeightPx} onImpression={handleImpression} onClick={handleClick} />
      ))}
    </div>
  );
}

function AdSlotRenderer({
  ad,
  minHeightPx,
  onImpression,
  onClick,
}: {
  ad: AdRenderPayload;
  minHeightPx: number;
  onImpression: (ad: AdRenderPayload) => void;
  onClick: (ad: AdRenderPayload) => void;
}) {
  const [pushed, setPushed] = useState(false);

  useEffect(() => {
    if (ad.creativeType === 'adsense') {
      // Ensure the AdSense script is loaded once, then push the ad unit.
      const publisherId = ad.providerPayload?.publisherId as string | undefined;
      const metaTag = document.querySelector('meta[name="google-adsense-account"]') as HTMLMetaElement | null;
      if (publisherId) {
        if (metaTag) {
          metaTag.setAttribute('content', publisherId);
        } else {
          const newMeta = document.createElement('meta');
          newMeta.setAttribute('name', 'google-adsense-account');
          newMeta.setAttribute('content', publisherId);
          document.head.appendChild(newMeta);
        }
      }

      if (publisherId && !adsensePushAttempted) {
        void ensureAdsenseScript(publisherId)
          .then(() => {
            try {
              window.adsbygoogle = window.adsbygoogle || [];
              window.adsbygoogle.push({});
              adsensePushAttempted = true;
              setPushed(true);
            } catch {
              /* ignore */
            }
          })
          .catch(() => {
            /* ignore */
          });
      }
    }

    onImpression(ad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad.id]);

  if (ad.creativeType === 'adsense') {
    // data-ad-client = publisher ID, data-ad-slot = placement key (slot ID).
    const publisherId = ad.providerPayload?.publisherId as string | undefined;
    const slotKey = ad.providerPayload?.placementKey as string | undefined;
    if (!publisherId || !slotKey) return null;

    return (
      <div className="my-4 block overflow-hidden" style={{ minHeight: `${minHeightPx}px` }}>
        <ins
          className="adsbygoogle block overflow-hidden"
          style={{ display: 'block', minHeight: `${minHeightPx}px` }}
          data-ad-client={publisherId}
          data-ad-slot={slotKey}
          data-ad-format="auto"
          data-full-width-responsive="true"
          aria-label="Advertisement"
        />
      </div>
    );
  }

  // Custom banner / external redirect
  if (ad.creativeType === 'banner' && ad.bannerUrl) {
    const content = (
      <a
        href={ad.clickUrl || '#'}
        target={ad.clickUrl ? '_blank' : undefined}
        rel="noreferrer noopener"
        onClick={() => onClick(ad)}
        style={{ minHeight: `${minHeightPx}px` }}
        className="block overflow-hidden rounded-2xl border border-sura-line bg-sura-canvas"
        aria-label={ad.altText || 'Advertisement'}
      >
        <img
          src={ad.bannerUrl}
          alt={ad.altText || ''}
          loading="lazy"
          className="h-auto w-full object-contain"
        />
      </a>
    );

    return <div className="my-4">{content}</div>;
  }

  return null;
}
