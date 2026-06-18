import { useEffect } from 'react';

export function usePageMetadata(title: string, description: string) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.title = title;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute('content', description);
    }
  }, [title, description]);
}
