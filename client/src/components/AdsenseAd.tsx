import { useEffect } from 'react';

interface AdsenseAdProps {
  adSlot: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdsenseAd({ adSlot, className = '' }: AdsenseAdProps) {
  const client = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT;

  useEffect(() => {
    if (!client || typeof window === 'undefined') return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (error) {
      console.warn('AdSense initialization failed', error);
    }
  }, [client]);

  if (!client) {
    return null;
  }

  return (
    <div className={`my-8 ${className}`}>
      <ins
        className="adsbygoogle block overflow-hidden"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
