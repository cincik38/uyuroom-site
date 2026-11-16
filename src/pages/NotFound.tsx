import { useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { usePageMeta } from '@/lib/pageMeta';

/** Bilinmeyen adres. HTTP 404’ü Vercel `404.html` verir; bu bileşen aynı sayfayı gösterir. */
export const NotFound: FC = () => {
  usePageMeta(
    'Sayfa bulunamadı',
    'Aradığınız sayfa UYUROOM Hotel sitesinde yok. Adana ve Uşak otellerine tesisler sayfasından ulaşabilirsiniz.',
  );

  useEffect(() => {
    let el = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const created = !el;
    const previous = el?.getAttribute('content') ?? null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', 'robots');
      document.head.appendChild(el);
    }
    el.setAttribute('content', 'noindex');
    return () => {
      if (!el) return;
      if (created) el.remove();
      else if (previous) el.setAttribute('content', previous);
      else el.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 pt-28 pb-16">
        <div className="max-w-md w-full text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600">404</p>
          <h1 className="text-2xl font-black text-slate-900">Sayfa bulunamadı</h1>
          <p className="text-sm text-slate-500">
            Bu adres UYUROOM Hotel sitesinde yok. Adana ve Uşak şubelerimize tesisler sayfasından devam edebilirsiniz.
          </p>
          <Link to="/tesisler">
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
              Tesislerimize git
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
