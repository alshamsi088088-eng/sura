import { useEffect, useMemo, useRef } from 'react';

interface AdsenseAdProps {
  adSlot: string;
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

export function AdsenseAd({ adSlot, className = '', minHeightPx = 250 }: AdsenseAdProps) {
  const client = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT as string | undefined;

  // Avoid pushing multiple times for the same <ins>.
  const hasPushedRef = useRef(false);

  const isReady = useMemo(() => {
    const slotOk = typeof adSlot === 'string' && adSlot.trim().length > 0;
    const clientOk = typeof client === 'string' && client.trim().length > 0;
    return clientOk && slotOk && !adSlot.includes('PLACEHOLDER');
  }, [adSlot, client]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!client || !adSlot) return;

    if (!isReady) return;
    if (hasPushedRef.current) return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      hasPushedRef.current = true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('AdSense initialization failed', error);
    }
  }, [client, adSlot, isReady]);

  if (!client) return null;

  const effectiveSlot = isReady ? adSlot : 'PLACEHOLDER_AD_SLOT';

  return (
    <div className={`my-8 ${className}`}>
      <ins
        className="adsbygoogle block overflow-hidden"
        style={{ display: 'block', minHeight: `${minHeightPx}px` }}
        data-ad-client={client}
        data-ad-slot={effectiveSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

