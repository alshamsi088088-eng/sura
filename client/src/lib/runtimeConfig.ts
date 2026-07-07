function isLocalHost() {
  if (typeof window === 'undefined') return true;

  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export function getApiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:5000';
  }

  return isLocalHost() ? 'http://localhost:5000' : window.location.origin;
}

export function getSocketUrl() {
  const configured = import.meta.env.VITE_SOCKET_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:5000';
  }

  return isLocalHost() ? 'http://localhost:5000' : window.location.origin;
}
