import { useEffect, useMemo } from 'react';

interface AdsenseAdProps {
  adSlot?: string;
  className?: string;
  /**
   * Helps AdSense with layout stability before ad loads.
   */
  minHeightPx?: number;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let adsenseScriptPromise: Promise<void> | null = null;
let adsenseScriptLoaded = false;
let adsensePushAttempted = false;

async function ensureAdsenseScript(clientId: string) {
  if (typeof window === 'undefined' || !clientId) return;
  if (adsenseScriptLoaded) return;

  const existingScript = document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');
  if (existingScript) {
    adsenseScriptLoaded = true;
    return;
  }

  if (!adsenseScriptPromise) {
    adsenseScriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        adsenseScriptLoaded = true;
        resolve();
      };
      script.onerror = () => {
        adsenseScriptPromise = null;
        reject(new Error('Failed to load AdSense script'));
      };
      document.head.appendChild(script);
    });
  }

  await adsenseScriptPromise;
}

export function AdsenseAd({ adSlot, className = '', minHeightPx = 250 }: AdsenseAdProps) {
  const client = (import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT || import.meta.env.VITE_ADSENSE_CLIENT) as string | undefined;
  const fallbackSlot = (import.meta.env.VITE_GOOGLE_ADSENSE_SLOT || import.meta.env.VITE_ADSENSE_SLOT) as string | undefined;
  const resolvedSlot = (adSlot || fallbackSlot || '').trim();

  const isReady = useMemo(() => {
    const slotOk = resolvedSlot.length > 0;
    const clientOk = typeof client === 'string' && client.trim().length > 0;
    return clientOk && slotOk && !resolvedSlot.includes('PLACEHOLDER');
  }, [client, resolvedSlot]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!client || !resolvedSlot || !isReady || adsensePushAttempted) return;

    const metaTag = document.querySelector('meta[name="google-adsense-account"]') as HTMLMetaElement | null;
    if (metaTag) {
      metaTag.setAttribute('content', client);
    } else {
      const newMetaTag = document.createElement('meta');
      newMetaTag.setAttribute('name', 'google-adsense-account');
      newMetaTag.setAttribute('content', client);
      document.head.appendChild(newMetaTag);
    }

    void ensureAdsenseScript(client)
      .then(() => {
        try {
          window.adsbygoogle = window.adsbygoogle || [];
          window.adsbygoogle.push({});
          adsensePushAttempted = true;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('AdSense initialization failed', error);
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.warn('AdSense script failed to load', error);
      });
  }, [client, isReady, resolvedSlot]);

  if (!client || !isReady) return null;

  return (
    <div className={`my-8 ${className}`}>
      <ins
        className="adsbygoogle block overflow-hidden"
        style={{ display: 'block', minHeight: `${minHeightPx}px` }}
        data-ad-client={client}
        data-ad-slot={resolvedSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
        aria-label="Google AdSense advertisement"
      />
    </div>
  );
}

