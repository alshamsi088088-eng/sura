import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LocaleProvider } from './context/LocaleContext';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Breadcrumbs } from './components/Breadcrumbs';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import { useTheme } from './context/ThemeContext';

// Critical pages loaded eagerly (first paint)
import { HomePage } from './pages/HomePage';

// All other pages lazy-loaded for better initial bundle
const ArticlesPage = lazy(async () => ({ default: (await import('./pages/ArticlesPage')).ArticlesPage }));
const ArticleDetailsPage = lazy(async () => ({ default: (await import('./pages/ArticleDetailsPage')).ArticleDetailsPage }));
const NovelsPage = lazy(async () => ({ default: (await import('./pages/NovelsPage')).NovelsPage }));
const GalleryPage = lazy(async () => ({ default: (await import('./pages/GalleryPage')).GalleryPage }));
const StorePage = lazy(async () => ({ default: (await import('./pages/StorePage')).StorePage }));
const TechPage = lazy(async () => ({ default: (await import('./pages/TechPage')).TechPage }));
const ProductsPage = lazy(async () => ({ default: (await import('./pages/ProductsPage')).ProductsPage }));
const AboutPage = lazy(async () => ({ default: (await import('./pages/AboutPage')).AboutPage }));
const ContactPage = lazy(async () => ({ default: (await import('./pages/ContactPage')).ContactPage }));
const PrivacyPage = lazy(async () => ({ default: (await import('./pages/PrivacyPage')).PrivacyPage }));
const TermsOfServicePage = lazy(async () => ({ default: (await import('./pages/TermsOfServicePage')).TermsOfServicePage }));
const CookiePolicyPage = lazy(async () => ({ default: (await import('./pages/CookiePolicyPage')).CookiePolicyPage }));
const LoginPage = lazy(async () => ({ default: (await import('./pages/LoginPage')).LoginPage }));
const RegisterPage = lazy(async () => ({ default: (await import('./pages/RegisterPage')).RegisterPage }));
const AuthCallbackPage = lazy(async () => ({ default: (await import('./pages/AuthCallbackPage')).default }));
const NotFoundPage = lazy(async () => ({ default: (await import('./pages/NotFoundPage')).NotFoundPage }));

const DashboardPage = lazy(async () => ({ default: (await import('./pages/DashboardPage')).DashboardPage }));
const AnalyticsPage = lazy(async () => ({ default: (await import('./pages/AnalyticsPage')).AnalyticsPage }));
const ProfilePage = lazy(async () => ({ default: (await import('./pages/ProfilePage')).ProfilePage }));
const AdminPage = lazy(async () => ({ default: (await import('./pages/AdminPage')).AdminPage }));
const CreatePostPage = lazy(async () => ({ default: (await import('./pages/CreatePostPage')).CreatePostPage }));
const CreateChapterPage = lazy(async () => ({ default: (await import('./pages/CreateChapterPage')).CreateChapterPage }));
const CreateNovelPage = lazy(async () => ({ default: (await import('./pages/CreateNovelPage')).CreateNovelPage }));
const CreateTechPage = lazy(async () => ({ default: (await import('./pages/CreateTechPage')).CreateTechPage }));
const EditPartsPage = lazy(async () => ({ default: (await import('./pages/EditPartsPage')).EditPartsPage }));
const LibraryPage = lazy(async () => ({ default: (await import('./pages/LibraryPage')).LibraryPage }));
const CommunityPage = lazy(async () => ({ default: (await import('./pages/CommunityPage')).CommunityPage }));
const CommunityThreadPage = lazy(async () => ({ default: (await import('./pages/CommunityThreadPage')).CommunityThreadPage }));
const PublicProfilePage = lazy(async () => ({ default: (await import('./pages/PublicProfilePage')).PublicProfilePage }));
const QuoteLibraryPage = lazy(async () => ({ default: (await import('./pages/QuoteLibraryPage')).QuoteLibraryPage }));


function AppInner() {
  const { mode } = useTheme();
  return (
    <div style={{ minHeight: '100vh', background: mode === 'dark' ? '#060d16' : '#FFFFFF' }}>
      <BrowserRouter>
        {/* Skip to content link for keyboard users */}
        <a href="#main-content" className="skip-to-content-link">
          Skip to main content
        </a>
        <Navbar />
        <AnalyticsTracker />
        <main id="main-content">
          <Breadcrumbs />
          <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-sura-gold border-t-transparent rounded-full animate-spin" /></div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/articles" element={<ArticlesPage />} />
              <Route path="/articles/:slug" element={<ArticleDetailsPage />} />
              <Route path="/novels" element={<NovelsPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/store" element={<StorePage />} />
              <Route path="/tech" element={<TechPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />
              <Route path="/cookie-policy" element={<CookiePolicyPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
              <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
              <Route path="/quotes" element={<ProtectedRoute><QuoteLibraryPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/profile/:id" element={<PublicProfilePage />} />
              <Route path="/create-post" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
              <Route path="/create-chapter" element={<ProtectedRoute><CreateChapterPage /></ProtectedRoute>} />
              <Route path="/create-novel" element={<ProtectedRoute><CreateNovelPage /></ProtectedRoute>} />
              <Route path="/create-tech" element={<ProtectedRoute><CreateTechPage /></ProtectedRoute>} />
              <Route path="/edit-parts" element={<ProtectedRoute><EditPartsPage /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/community/thread/:id" element={<CommunityThreadPage />} />
              <Route path="/community/:contentType/:contentId" element={<CommunityPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <ThemeProvider>
        <AuthProvider>
          <ChatProvider>
            <AppInner />
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}
