import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getConsent, onTrackingReady, setConsent, startTracking } from '@/lib/analytics';

/** Çerez / ölçüm onay bandı. Seçim yapılana kadar görünür. */
export const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    let alive = true;
    void onTrackingReady().then(() => {
      if (!alive) return;
      const c = getConsent();
      if (c === null) setVisible(true);
      else if (c === 'granted') startTracking();
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!visible || pathname.startsWith('/yonetim')) return null;

  const choose = (v: 'granted' | 'denied') => {
    setConsent(v);
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] p-2 sm:p-4">
      <div className="max-w-3xl mx-auto bg-slate-900 text-slate-100 rounded-xl sm:rounded-2xl border border-slate-700 shadow-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-xs sm:text-sm leading-relaxed flex-1">
          Sitemizi geliştirmek ve reklam performansını ölçmek için çerez kullanıyoruz.{' '}
          <Link to="/kvkk#cerezler" className="underline text-amber-400">
            Çerez politikası
          </Link>
        </p>
        <div className="flex gap-2 shrink-0 [&>button]:flex-1 sm:[&>button]:flex-none">
          <button
            type="button"
            onClick={() => choose('denied')}
            className="px-4 py-2.5 sm:py-2 rounded-lg text-xs font-bold bg-slate-700 hover:bg-slate-600"
          >
            Reddet
          </button>
          <button
            type="button"
            onClick={() => choose('granted')}
            className="px-4 py-2.5 sm:py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950"
          >
            Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
