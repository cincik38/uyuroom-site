import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SearchEngine } from '@/components/SearchEngine';
import { RoomCard } from '@/components/RoomCard';
import { client } from '@/lib/api';
import { Hotel, Room, Review } from '@/lib/types';
import { handleImageError, resolveCoverUrl } from '@/lib/media';
import { parseList } from '@/lib/ota';
import { MapPin, Star, Banknote, Building2, Navigation, PhoneCall, Search, MessageCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildBranchMapLink, resolveBranchAddress, findBranchContact } from '@/lib/contacts';
import { StaffCharacter } from '@/components/StaffCharacter';

/** Ana sayfa karakteri: sayfa yüklendikten sonra gelir, veri tasarrufu açıksa hiç yüklenmez. */
const useCharacterStage = () => {
  const [show, setShow] = useState(false);
  const [size, setSize] = useState(60);
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    const mq = window.matchMedia('(min-width: 640px)');
    const apply = () => setSize(mq.matches ? 76 : 60);
    apply();
    mq.addEventListener?.('change', apply);
    const t = window.setTimeout(() => setShow(true), 1800);
    return () => {
      window.clearTimeout(t);
      mq.removeEventListener?.('change', apply);
    };
  }, []);
  return { show, size };
};

export const Index: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [featuredRooms, setFeaturedRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const stage = useCharacterStage();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [hotelsRes, roomsRes, reviewsRes] = await Promise.all([
          client.entities.hotels.query({ limit: 10 }),
          client.entities.rooms.query({ limit: 6 }),
          client.entities.reviews.query({ limit: 6 }),
        ]);

        if (hotelsRes?.data?.items && hotelsRes.data.items.length > 0) {
          setHotels(hotelsRes.data.items);
        }
        if (roomsRes?.data?.items && roomsRes.data.items.length > 0) {
          setFeaturedRooms(roomsRes.data.items);
        }
        if (reviewsRes?.data?.items && reviewsRes.data.items.length > 0) {
          setReviews(reviewsRes.data.items);
        }
      } catch (err) {
        console.error('Data load error', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar
        accessory={
          <div className="relative shrink-0" style={{ width: stage.size, height: stage.size }}>
            {stage.show && (
              <StaffCharacter role="kat-gorevlisi" startX={50} size={stage.size} wander={false} talk greet inline />
            )}
          </div>
        }
      />

      {/* Hero: başlık + iki şube */}
      <section className="bg-slate-950 text-white pt-32 sm:pt-36 pb-24 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              Adana ve Uşak'ta şehir merkezinde konaklama
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Temiz, sade ve konforlu odalar. Doğrudan rezervasyon yapın, ödemeyi otelde yapın ya da havale ile %5 indirim kazanın.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
            {(hotels.length > 0 ? hotels : [null, null]).map((hotel, idx) => {
              if (!hotel) {
                return <div key={idx} className="aspect-[4/3] sm:aspect-[16/10] rounded-2xl bg-slate-900 animate-pulse" />;
              }
              const branch = findBranchContact(hotel.city);
              const phoneRaw = branch?.phoneRaw || hotel.phone || '';
              const phoneLabel = branch?.phoneDisplay || hotel.phone || '';
              return (
                <article key={hotel.id} className="group rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
                  <Link to={`/tesis/${hotel.id}`} className="block relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden" aria-label={`${hotel.name} odalarını gör`}>
                    <img
                      src={resolveCoverUrl(parseList(hotel.gallery), hotel.image_url)}
                      onError={handleImageError}
                      alt={hotel.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/85 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow">{hotel.city}</h2>
                      <p className="text-sm text-slate-200 drop-shadow">{hotel.name}</p>
                    </div>
                  </Link>
                  <div className="p-5 space-y-4">
                    <p className="flex items-start gap-2 text-sm text-slate-300">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{resolveBranchAddress(hotel.city, hotel.address)}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/tesis/${hotel.id}`}>
                        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold h-11">
                          {hotel.city} odalarını gör
                        </Button>
                      </Link>
                      <a
                        href={buildBranchMapLink(hotel.city, hotel.address, hotel.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-11 px-4 rounded-md border border-slate-700 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
                      >
                        <Navigation className="w-4 h-4 text-amber-400" /> Yol tarifi
                      </a>
                      {phoneRaw && (
                        <a
                          href={`tel:${phoneRaw}`}
                          className="inline-flex items-center gap-1.5 h-11 px-4 rounded-md border border-slate-700 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
                        >
                          <PhoneCall className="w-4 h-4 text-amber-400" /> {phoneLabel}
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tarih / misafir arama */}
      <section className="px-4 relative z-20">
        <SearchEngine hotels={hotels} />
      </section>

      {/* Odalar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Odalarımız</h2>
            <p className="text-sm text-slate-600 mt-2">Adana ve Uşak şubelerimizdeki odalar, gecelik fiyatlarıyla.</p>
          </div>
          <Link to="/tesisler">
            <Button variant="outline" className="border-slate-300 font-semibold text-slate-800 !bg-transparent">
              Tüm odaları gör
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredRooms.map((room) => {
            const hotel = hotels.find((h) => h.id === room.hotel_id);
            return <RoomCard key={room.id} room={room} hotel={hotel} />;
          })}
        </div>
      </section>

      {/* Misafir yorumları (yalnızca onaylı gerçek kayıt varsa) */}
      {reviews.length > 0 && (
        <section className="bg-slate-900 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-10">Misafir yorumları</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">“{rev.comment}”</p>
                  </div>
                  <div className="pt-4 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-white">{rev.guest_name}</span>
                    <span>{rev.stay_date || ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nasıl çalışır: yalnızca gerçek bilgiler */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-10">Rezervasyon nasıl çalışır?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8">
            <div className="space-y-2">
              <Search className="w-6 h-6 text-amber-600" />
              <h3 className="font-bold text-slate-900">Oda seçin, talebinizi gönderin</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Tarih ve kişi sayısını girin, uygun odayı seçin. Rezervasyon kodunuz hemen oluşur.</p>
            </div>
            <div className="space-y-2">
              <Banknote className="w-6 h-6 text-amber-600" />
              <h3 className="font-bold text-slate-900">Ödemeyi otelde yapın</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Ön ödeme gerekmez. Ücreti otele girişte ödersiniz.</p>
            </div>
            <div className="space-y-2">
              <Building2 className="w-6 h-6 text-amber-600" />
              <h3 className="font-bold text-slate-900">Havale ile %5 indirim</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Havale / EFT ile ödemeyi seçerseniz toplam tutardan %5 indirim uygulanır.</p>
            </div>
            <div className="space-y-2">
              <MessageCircle className="w-6 h-6 text-amber-600" />
              <h3 className="font-bold text-slate-900">Sorularınız için bize yazın</h3>
              <p className="text-sm text-slate-600 leading-relaxed">İki şubemiz de telefon ve WhatsApp ile ulaşılabilir. Rezervasyonunuzu kodunuzla sorgulayabilirsiniz.</p>
            </div>
          </div>
          <p className="mt-8 flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" /> Otele giriş 14:00'dan itibaren, çıkış 12:00'ye kadar.
          </p>
        </div>
      </section>

      {/* Alt çağrı */}
      <section className="bg-slate-950 py-14 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Tarihinizi seçin, odanızı ayırtın</h3>
            <p className="text-sm text-slate-300">Doğrudan rezervasyonda aracı yok, sorularınızı doğrudan otele sorabilirsiniz.</p>
          </div>
          <Link to="/tesisler">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 h-12 whitespace-nowrap">
              Odaları listele
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
