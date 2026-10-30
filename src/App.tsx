import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Index from './pages/Index';
import RoomDetail from './pages/RoomDetail';
import BookingPage from './pages/Booking';
import BookingConfirmation from './pages/BookingConfirmation';
import BookingQuery from './pages/BookingQuery';
import About from './pages/About';
import Policies from './pages/Policies';
import Kvkk from './pages/Kvkk';
import StaffEntry from './pages/StaffEntry';
import CharacterPreview from './pages/CharacterPreview';
import TrackingSettings from './pages/admin/TrackingSettings';
const AdsCenter = lazy(() => import('./pages/admin/ads/AdsCenter'));
import Contact from './pages/Contact';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import OtaLogin from './pages/OtaLogin';
import PropertyManager from './pages/manage/PropertyManager';
import AdminDashboard from './pages/admin/AdminDashboard';
import BlogIndexPage from './pages/blog/BlogIndexPage';
import BlogPostPage from './pages/blog/BlogPostPage';
import RoleGuard from './components/RoleGuard';
import WhatsAppWidget from './components/WhatsAppWidget';
import CookieBanner from './components/CookieBanner';
import { trackPageView, trackContactClick } from './lib/analytics';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient();

/** Sayfa değişince en üste kaydırır; #anchor varsa o bölüme gider. */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a');
      const href = a?.getAttribute('href') || '';
      if (href.startsWith('tel:')) trackContactClick('phone');
      else if (/wa\.me|api\.whatsapp\.com/.test(href)) trackContactClick('whatsapp');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  return null;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/rooms" element={<Navigate to="/tesisler" replace />} />
    <Route path="/branches" element={<Navigate to="/tesisler" replace />} />
    <Route path="/room/:id" element={<RoomDetail />} />
    <Route path="/tesisler" element={<Properties />} />
    <Route path="/tesis/:id" element={<PropertyDetail />} />
    <Route path="/booking" element={<BookingPage />} />
    <Route path="/booking-confirmation" element={<BookingConfirmation />} />
    <Route path="/booking-query" element={<BookingQuery />} />
    <Route path="/about" element={<About />} />
    <Route path="/policies" element={<Policies />} />
    <Route path="/kvkk" element={<Kvkk />} />
    <Route path="/personel" element={<StaffEntry />} />
    <Route path="/karakter-onizleme" element={<CharacterPreview />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/blog" element={<BlogIndexPage />} />
    <Route path="/blog/:slug" element={<BlogPostPage />} />

    {/* Yönetim (yalnızca otel sahibi) */}
    <Route path="/yonetim" element={<OtaLogin mode="admin" />} />
    <Route path="/giris" element={<Navigate to="/yonetim" replace />} />
    <Route path="/admin" element={<Navigate to="/yonetim/panel" replace />} />
    <Route
      path="/yonetim/panel"
      element={
        <RoleGuard allow={['super_admin']}>
          <AdminDashboard />
        </RoleGuard>
      }
    />
    <Route
      path="/yonetim/takip"
      element={
        <RoleGuard allow={['super_admin', 'reklam']}>
          <TrackingSettings />
        </RoleGuard>
      }
    />
    <Route
      path="/yonetim/reklam"
      element={
        <RoleGuard allow={['super_admin', 'reklam']}>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-9 h-9 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>}>
            <AdsCenter />
          </Suspense>
        </RoleGuard>
      }
    />
    <Route
      path="/yonetim/tesis/:id"
      element={
        <RoleGuard allow={['super_admin']}>
          <PropertyManager />
        </RoleGuard>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <ErrorBoundary>
          <ScrollToTop />
          <AppRoutes />
          <WhatsAppWidget />
          <CookieBanner />
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
export { AppRoutes };
