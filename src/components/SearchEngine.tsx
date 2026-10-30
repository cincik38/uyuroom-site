import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Hotel } from '@/lib/types';
import { GuestSelector } from '@/components/GuestSelector';
import { format, addDays } from 'date-fns';
import { trackSearch } from '@/lib/analytics';

interface SearchEngineProps {
  hotels: Hotel[];
  compact?: boolean;
}

export const SearchEngine: React.FC<SearchEngineProps> = ({ hotels, compact = false }) => {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [checkIn, setCheckIn] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [checkOut, setCheckOut] = useState<string>(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [adults, setAdults] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);

  // Şubelerin bulunduğu şehirler (veritabanından dinamik olarak beslenir)
  const cities = useMemo(() => {
    const list = hotels.map((h) => h.city).filter((c): c is string => Boolean(c));
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, 'tr-TR'));
  }, [hotels]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCity !== 'all') {
      params.set('city', selectedCity);
    }
    params.set('check_in', checkIn);
    params.set('check_out', checkOut);
    params.set('adults', adults.toString());
    params.set('children', childrenCount.toString());

    trackSearch({ checkIn, checkOut, guests: adults + childrenCount });
    navigate(`/tesisler?${params.toString()}`);
  };

  return (
    <div
      className={`w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-amber-200/40 p-4 sm:p-6 text-slate-800 ${
        compact ? 'max-w-5xl mx-auto' : 'max-w-5xl mx-auto -mt-16 sm:-mt-20 relative z-20'
      }`}
    >
      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* Şehir / Şube Seçimi */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-amber-500" /> Otel Şubesi
          </label>
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full h-12 pl-3 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all appearance-none cursor-pointer"
            >
              <option value="all">Tüm Şehirler</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              ▼
            </div>
          </div>
        </div>

        {/* Giriş - Çıkış Tarihi */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-amber-500" /> Giriş - Çıkış Tarihi
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={checkIn}
              min={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full h-12 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              required
            />
            <input
              type="date"
              value={checkOut}
              min={checkIn || format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full h-12 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              required
            />
          </div>
        </div>

        {/* Misafir: Yetişkin & Çocuk */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-amber-500" /> Misafirler
            <span className="text-[10px] text-slate-400 normal-case font-medium">
              (Toplam {adults + childrenCount} kişi)
            </span>
          </label>
          <GuestSelector
            adults={adults}
            children={childrenCount}
            onAdultsChange={setAdults}
            onChildrenChange={setChildrenCount}
            compact
          />
        </div>

        {/* Arama CTA */}
        <div>
          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold shadow-lg shadow-amber-500/30 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Müsait Odaları Bul</span>
          </Button>
        </div>
      </form>
    </div>
  );
};