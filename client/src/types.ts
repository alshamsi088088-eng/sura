
export type Locale = 'en' | 'ar';
export type ThemeMode = 'dark' | 'light';
export type UserRole = 'guest' | 'member' | 'writer' | 'editor' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  locale: Locale;
  theme: ThemeMode;
}

export interface ArticleSummary {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  language: Locale;
  readingTime: string;
  author: string;
  views: number;
  claps: number;
  coverImage: string;
}
