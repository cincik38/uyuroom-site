import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Star,
  Heart,
  SlidersHorizontal,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { client } from '@/lib/api';
import {
  AMENITY_OPTIONS,
  PROPERTY_TYPE_LABELS,
  formatPrice,
  getFavorites,
  isPubliclyListed,
  parseList,
  toISODate,
  toggleFavorite,
} from '@/lib/ota';
import type { Hotel, Room } from '@/lib/types';
import { handleImageError, resolveCoverUrl } from '@/lib/media';

type SortKey = 'recommended' | 'price_asc' | 'price_desc' | 'rating';

export const Properties: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [destination, setDestination] = useState(params.get('city') || '');
  const [types, setTypes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minStars, setMinStars] = useState(0);
  const [amenityFilter, setAmenityFilter] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>('recommended');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  useEffect(() => {
    setFavorites(getFavorites());
    (async () => {
      try {
        const [hotelRes, roomRes] = await Promise.all([
          client.entities.hotels.query({ limit: 300 }),
          client.entities.rooms.query({ limit: 500 }),
        ]);
        setHotels((hotelRes?.data?.items || []).filter(isPubliclyListed));
        setRooms(roomRes?.data?.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const priceByHotel = useMemo(() => {
    const map = new Map<number, number>();
    rooms
      .filter((r) => (r.status || 'active') === 'active')
      .forEach((r) => {
        const price = Number(r.discounted_price || r.price_per_night || 0);
        if (!price) return;
        const current = map.get(Number(r.hotel_id));
        if (current === undefined || price < current) map.set(Number(r.hotel_id), price);
      });
    return map;
  }, [rooms]);

  const results = useMemo(() => {
    const term = destination.trim().toLocaleLowerCase('tr-TR');
    let list = hotels.filter((hotel) => {
      if (term) {
        const haystack = `${hotel.name} ${hotel.city} ${hotel.district || ''}`.toLocaleLowerCase(
          'tr-TR',
        );
        if (!haystack.includes(term)) return false;
      }
      if (types.length && !types.includes(hotel.property_type || 'hotel')) return false;
      if (minStars && Number(hotel.star_rating || 0) < minStars) return false;

      const price = priceByHotel.get(hotel.id);
      if (minPrice && (price ?? 0) < Number(minPrice)) return false;
      if (maxPrice && (price ?? Infinity) > Number(maxPrice)) return false;

      if (amenityFilter.length) {
        const features = parseList(hotel.features).map((f) => f.toLocaleLowerCase('tr-TR'));
        const ok = amenityFilter.every((a) =>
          features.some((f) => f.includes(a.toLocaleLowerCase('tr-TR'))),
        );
        if (!ok) return false;
      }
      if (onlyFavorites && !favorites.includes(hotel.id)) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      const pa = priceByHotel.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const pb = priceByHotel.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      if (sort === 'price_asc') return pa - pb;
      if (sort === 'price_desc') return pb - pa;
      if (sort === 'rating')
        return Number(b.guest_score || b.rating || 0) - Number(a.guest_score || a.rating || 0);
      return a.id - b.id;
    });

    return list;
  }, [
    hotels,
    destination,
    types,
    minStars,
    minPrice,
    maxPrice,
    amenityFilter,
    onlyFavorites,
    favorites,
    priceByHotel,
    sort,
  ]);

  const handleFavorite = (id: number) => setFavorites(toggleFavorite(id));

  const applySearch = () => {
    const next = new URLSearchParams(params);
    if (destination.trim()) next.set('city', destination.trim());
    else next.delete('city');
    setParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <section className="pt-24 pb-8 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> UYUROOM Pazar Yeri
            </span>
            <h1 className="text-2xl sm:text-4xl font-black">Konaklama Keşfet</h1>
            <p className="text-sm text-slate-400">
              Türkiye genelindeki anlaşmalı otel, apart ve pansiyonları karşılaştırın.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-3 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 bg-slate-50 rounded-xl border border-slate-200">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                placeholder="Şehir, ilçe veya tesis adı"
                className="flex-1 h-12 bg-transparent text-slate-900 text-sm focus:outline-none"
              />
            </div>
            <Button
              onClick={applySearch}
              className="h-12 px-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black"
            >
              Ara
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters((v) => !v)}
              className="h-12 px-4 border-slate-300 text-slate-700 !bg-transparent lg:hidden"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" /> Filtreler
            </Button>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Filtreler */}
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-4`}>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
            <p className="font-black text-slate-900 text-sm">Filtreler</p>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase">Tesis Tipi</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => {
                  const active = types.includes(value);
                  return (
                    <button
                      key={value}
                      onClick={() =>
                        setTypes((prev) =>
                          prev.includes(value)
                            ? prev.filter((v) => v !== value)
                            : [...prev, value],
                        )
                      }
                      className={`px-3 py-2 rounded-lg text-xs font-medium border min-h-[38px] ${
                        active
                          ? 'bg-slate-950 border-slate-950 text-amber-400'
                          : 'bg-white border-slate-300 text-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase">Fiyat Aralığı (₺)</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
                />
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase">Minimum Yıldız</p>
              <div className="flex gap-1.5">
                {[0, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setMinStars(s)}
                    className={`flex-1 h-10 rounded-lg text-xs font-bold border ${
                      minStars === s
                        ? 'bg-amber-500 border-amber-500 text-slate-950'
                        : 'bg-white border-slate-300 text-slate-600'
                    }`}
                  >
                    {s === 0 ? 'Tümü' : `${s}+`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase">Olanaklar</p>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.slice(0, 10).map((item) => {
                  const active = amenityFilter.includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() =>
                        setAmenityFilter((prev) =>
                          prev.includes(item)
                            ? prev.filter((v) => v !== item)
                            : [...prev, item],
                        )
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border min-h-[36px] ${
                        active
                          ? 'bg-amber-500 border-amber-500 text-slate-950'
                          : 'bg-white border-slate-300 text-slate-600'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={onlyFavorites}
                onChange={(e) => setOnlyFavorites(e.target.checked)}
                className="w-4 h-4 accent-amber-500"
              />
              Sadece favorilerim
            </label>

            <Button
              variant="outline"
              onClick={() => {
                setTypes([]);
                setMinPrice('');
                setMaxPrice('');
                setMinStars(0);
                setAmenityFilter([]);
                setOnlyFavorites(false);
              }}
              className="w-full border-slate-300 text-slate-700 !bg-transparent"
            >
              Filtreleri Temizle
            </Button>
          </div>
        </aside>

        {/* Sonuçlar */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              <strong className="text-slate-900">{results.length}</strong> tesis bulundu
            </p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 px-3 rounded-lg border border-slate-300 text-sm bg-white"
            >
              <option value="recommended">Önerilen</option>
              <option value="price_asc">Fiyat: Artan</option>
              <option value="price_desc">Fiyat: Azalan</option>
              <option value="rating">Misafir Puanı</option>
            </select>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-900">Aramanıza uygun tesis bulunamadı</p>
              <p className="text-sm text-slate-500">
                Filtrelerinizi genişleterek tekrar deneyin.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((hotel) => {
                const price = priceByHotel.get(hotel.id);
                const isFav = favorites.includes(hotel.id);
                const cover = resolveCoverUrl(parseList(hotel.gallery), hotel.image_url);
                return (
                  <div
                    key={hotel.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => navigate(`/tesis/${hotel.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/tesis/${hotel.id}`);
                      }
                    }}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col sm:flex-row hover:shadow-xl hover:border-amber-300 transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <div className="sm:w-64 h-48 sm:h-auto relative shrink-0 bg-slate-200">
                      {cover && (
                        <img
                          src={cover}
                          onError={handleImageError}
                          alt={hotel.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFavorite(hotel.id);
                        }}
                        aria-label="Favorilere ekle"
                        className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            isFav ? 'fill-red-500 text-red-500' : 'text-slate-500'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg font-black text-slate-900">{hotel.name}</h2>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {PROPERTY_TYPE_LABELS[hotel.property_type || 'hotel'] || 'Otel'}
                          </span>
                          {Number(hotel.star_rating) > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-500">
                              {Array.from({ length: Number(hotel.star_rating) }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                              ))}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          {hotel.city}
                          {hotel.district ? ` / ${hotel.district}` : ''}
                        </p>
                        <p className="text-sm text-slate-600 line-clamp-2">{hotel.description}</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {parseList(hotel.features)
                            .slice(0, 4)
                            .map((f) => (
                              <span
                                key={f}
                                className="text-[11px] px-2 py-1 rounded bg-slate-100 text-slate-600"
                              >
                                {f}
                              </span>
                            ))}
                        </div>
                      </div>

                      <div className="sm:w-44 sm:border-l sm:border-slate-200 sm:pl-4 flex sm:flex-col items-end justify-between gap-2">
                        {Number(hotel.guest_score) > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded-lg bg-slate-950 text-amber-400 text-sm font-black">
                              {Number(hotel.guest_score).toFixed(1)}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {hotel.review_count || 0} yorum
                            </span>
                          </div>
                        )}
                        <div className="text-right">
                          <p className="text-[11px] text-slate-500">Gecelik başlangıç</p>
                          <p className="text-xl font-black text-amber-600">
                            {price ? formatPrice(price) : 'Sorunuz'}
                          </p>
                        </div>
                        <Link
                          to={`/tesis/${hotel.id}`}
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold min-h-[44px]">
                            Tesisi İncele
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Properties;
