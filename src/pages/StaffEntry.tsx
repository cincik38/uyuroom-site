import React, { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Building2, ArrowRight } from 'lucide-react';

const PANELS = [
  { city: 'Adana', name: 'UYUROOM Hotel Adana', url: 'https://adana.uyuroom.com' },
  { city: 'Uşak', name: 'UYUROOM Hotel Uşak', url: 'https://usak.uyuroom.com' },
];

/** Personel için otel yönetim panellerine geçiş sayfası (arama motorlarından gizli). */
export const StaffEntry: React.FC = () => {
  useEffect(() => {
    document.title = 'Personel Girişi | UYUROOM HOTEL';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-40 pb-16 px-4">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Personel girişi</h1>
            <p className="text-sm text-slate-600">Çalıştığınız şubenin yönetim paneline gidin.</p>
          </div>
          <div className="space-y-3">
            {PANELS.map((p) => (
              <a
                key={p.city}
                href={p.url}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 hover:border-amber-400 hover:shadow-md transition"
              >
                <span className="flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-amber-600" />
                  <span>
                    <span className="block font-bold text-slate-900">{p.city} paneli</span>
                    <span className="block text-xs text-slate-500">{p.name}</span>
                  </span>
                </span>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </a>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StaffEntry;
