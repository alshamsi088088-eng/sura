import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Suspense, lazy } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LocaleProvider } from './context/LocaleContext';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Breadcrumbs } from './components/Breadcrumbs';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { HomePage } from './pages/HomePage';
import { ArticlesPage } from './pages/ArticlesPage';
import { NovelsPage } from './pages/NovelsPage';
import { GalleryPage } from './pages/GalleryPage';
import { StorePage } from './pages/StorePage';
import { TechPage } from './pages/TechPage';
import { ProductsPage } from './pages/ProductsPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import { useTheme } from './context/ThemeContext';

const ArticleDetailsPage = lazy(async () => ({ default: (await import('./pages/ArticleDetailsPage')).ArticleDetailsPage }));
const DashboardPage = lazy(async () => ({ default: (await import('./pages/DashboardPage')).DashboardPage }));
const ProfilePage = lazy(async () => ({ default: (await import('./pages/ProfilePage')).ProfilePage }));
const AdminPage = lazy(async () => ({ default: (await import('./pages/AdminPage')).AdminPage }));

const CreatePostPage = lazy(async () => ({ default: (await import('./pages/CreatePostPage')).CreatePostPage }));
const CreateChapterPage = lazy(async () => ({ default: (await import('./pages/CreateChapterPage')).CreateChapterPage }));
const CreateNovelPage = lazy(async () => ({ default: (await import('./pages/CreateNovelPage')).CreateNovelPage }));
const CreateTechPage = lazy(async () => ({ default: (await import('./pages/CreateTechPage')).CreateTechPage }));
const EditPartsPage = lazy(async () => ({ default: (await import('./pages/EditPartsPage')).EditPartsPage }));
const LibraryPage = lazy(async () => ({ default: (await import('./pages/LibraryPage')).LibraryPage }));


function AppInner() {
  const { mode } = useTheme();
  return (
    <div style={{ minHeight: '100vh', background: mode === 'dark' ? '#060d16' : '#FFFFFF' }}>
      <BrowserRouter>
        <Navbar />
        <AnalyticsTracker />
        <AnimatePresence mode="wait">
          <main>
            <Breadcrumbs />
            <Suspense fallback={null}>
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
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/create-post" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
                <Route path="/create-chapter" element={<ProtectedRoute><CreateChapterPage /></ProtectedRoute>} />
                <Route path="/create-novel" element={<ProtectedRoute><CreateNovelPage /></ProtectedRoute>} />
                <Route path="/create-tech" element={<ProtectedRoute><CreateTechPage /></ProtectedRoute>} />
                <Route path="/edit-parts" element={<ProtectedRoute><EditPartsPage /></ProtectedRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
        </AnimatePresence>
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
