if ('serviceWorker' in navigator) {
  // In production register the service worker using a relative path.
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
    });
  } else {
    // During development or debugging, ensure any previously registered
    // service workers are unregistered to avoid stale caches causing a
    // flash/black screen after deploy.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  }
}
