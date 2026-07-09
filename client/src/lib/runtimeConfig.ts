function isLocalHost() {
  if (typeof window === 'undefined') return true;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

// الرابط الثابت للسيرفر الخاص بك
const PRODUCTION_API_URL = 'https://api.sura-codex.com';

export function getApiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  // إذا كنا في تطوير محلي
  if (isLocalHost()) {
    return 'http://localhost:5000';
  }

  // في الإنتاج، نستخدم الرابط الثابت للسيرفر
  return PRODUCTION_API_URL;
}

export function getSocketUrl() {
  const configured = import.meta.env.VITE_SOCKET_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  // إذا كنا في تطوير محلي
  if (isLocalHost()) {
    return 'http://localhost:5000';
  }

  // في الإنتاج، نستخدم الرابط الثابت للسيرفر
  return PRODUCTION_API_URL;
}