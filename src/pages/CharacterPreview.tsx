import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { StaffCharacter } from '@/components/StaffCharacter';
import { Minus, Plus } from 'lucide-react';

const HOTELS = [
  { id: 'adana', name: 'UYUROOM Hotel Adana', img: '/images/uyuroom-adana-hotel-exterior.webp' },
  { id: 'usak', name: 'UYUROOM Hotel Uşak', img: '/images/uyuroom-usak-hotel-exterior.webp' },
];

/** Her karakter kendi şeridinde gezinir, böylece üst üste binmezler. */
const lane = (i: number, n: number) => {
  const w = 100 / n;
  return { min: i * w + 4, max: (i + 1) * w - 4, start: i * w + w / 2 };
};

/** Gizli önizleme: işbaşındaki personel karakterlerinin otel görselinde nasıl durduğunu gösterir. */
export const CharacterPreview: React.FC = () => {
  const [counts, setCounts] = useState<Record<string, number>>({ adana: 2, usak: 1 });

  useEffect(() => {
    document.title = 'Karakter önizleme | UYUROOM HOTEL';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const change = (id: string, d: number) =>
    setCounts((c) => ({ ...c, [id]: Math.max(0, Math.min(3, (c[id] ?? 0) + d)) }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-40 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Karakter önizleme</h1>
            <p className="text-sm text-slate-600 max-w-xl">
              Karakterler arada bir yeni bir yere gider ve selam verir. Üzerine tıklayınca tepki verir. Bu sayfa arama
              motorlarından gizlidir. Şimdilik yalnızca kat görevlisi karakteri hazır.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {HOTELS.map((h) => (
              <section key={h.id} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-bold">{h.name}</h2>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">Kat görevlisi</span>
                    <button
                      type="button"
                      aria-label="Bir azalt"
                      onClick={() => change(h.id, -1)}
                      className="h-8 w-8 grid place-items-center rounded-full border border-slate-300 bg-white hover:border-amber-400"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-4 text-center font-semibold tabular-nums">{counts[h.id]}</span>
                    <button
                      type="button"
                      aria-label="Bir artır"
                      onClick={() => change(h.id, 1)}
                      className="h-8 w-8 grid place-items-center rounded-full border border-slate-300 bg-white hover:border-amber-400"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl shadow-md" style={{ aspectRatio: '4 / 3' }}>
                  <img src={h.img} alt={h.name} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" />
                  {Array.from({ length: counts[h.id] ?? 0 }).map((_, i, all) => {
                    const l = lane(i, all.length);
                    return (
                      <StaffCharacter
                        key={`${h.id}-${all.length}-${i}`}
                        role="kat-gorevlisi"
                        startX={l.start}
                        minX={l.min}
                        maxX={l.max}
                        size={i % 2 ? 130 : 150}
                        lift={i % 2 ? 16 : 0}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CharacterPreview;
