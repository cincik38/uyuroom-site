import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  MapPin,
  Star,
  Heart,
  BedDouble,
  Users,
  CheckCircle2,
  MessageSquare,
  Clock,
  ShieldCheck,
  ArrowLeft,
  Navigation,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { client } from '@/lib/api';
import {
  PAYMENT_METHOD_LABELS,
  PROPERTY_TYPE_LABELS,
  addDays,
  formatPrice,
  formatTRDate,
  getFavorites,
  isPubliclyListed,
  nightsBetween,
  parseList,
  pushRecentProperty,
  quoteStay,
  resolvePaymentMethods,
  toISODate,
  toggleFavorite,
} from '@/lib/ota';
import type { Hotel, RateCalendarEntry, Review, Room } from '@/lib/types';
import { handleImageError, resolveRoomCoverUrl, resolveImageUrl } from '@/lib/media';
import ImageCarousel from '@/components/ImageCarousel';

export const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [calendar, setCalendar] = useState<RateCalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);

  const today = toISODate(new Date());
  const [checkIn, setCheckIn] = useState(addDays(today, 1));
  const [checkOut, setCheckOut] = useState(addDays(today, 2));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  useEffect(() => {
    if (!id) return;
    setFavorites(getFavorites());
    (async () => {
      setLoading(true);
      try {
        const [hotelRes, roomRes, reviewRes, calRes] = await Promise.all([
          client.entities.hotels.get({ id }),
          client.entities.rooms.query({ query: { hotel_id: Number(id) }, limit: 100 }),
          client.entities.reviews.query({ query: { hotel_id: Number(id) }, limit: 50 }),
          client.entities.rate_calendar.query({ query: { hotel_id: Number(id) }, limit: 400 }),
        ]);
        setHotel(hotelRes?.data || null);
        setRooms((roomRes?.data?.items || []).filter((r: Room) => (r.status || 'active') === 'active'));
        setReviews(reviewRes?.data?.items || []);
        setCalendar(calRes?.data?.items || []);
        pushRecentProperty(Number(id));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const gallery = useMemo(() => {
    if (!hotel) return [];
    const list = [hotel.image_url, ...parseList(hotel.gallery)].filter(Boolean) as string[];
    return Array.from(new Set(list)).map(resolveImageUrl);
  }, [hotel]);

  const nights = nightsBetween(checkIn, checkOut);
  const guests = adults + children;

  const roomQuotes = useMemo(
    () =>
      rooms.map((room) => ({
        room,
        quote: quoteStay(room, checkIn, checkOut, calendar, 1),
        fits: Number(room.capacity || 0) >= guests,
      })),
    [rooms, checkIn, checkOut, calendar, guests],
  );

  const startBooking = (room: Room) => {
    const query = new URLSearchParams({
      room_id: String(room.id),
      hotel_id: String(hotel?.id || ''),
      check_in: checkIn,
      check_out: checkOut,
      adults: String(adults),
      children: String(children),
    });
    navigate(`/booking?${query.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hotel || !isPubliclyListed(hotel)) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <p className="text-lg font-bold text-slate-900">Tesis bulunamadı veya yayında değil.</p>
            <Link to="/tesisler">
              <Button className="bg-amber-500 text-slate-950 font-bold">Tüm Tesisler</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isFav = favorites.includes(hotel.id);
  const mapLink = hotel.map_embed
    ? hotel.map_embed
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${hotel.name} ${hotel.address || ''} ${hotel.city || ''}`,
      )}`;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Link
            to="/tesisler"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-amber-600"
          >
            <ArrowLeft className="w-4 h-4" /> Tüm tesisler
          </Link>

          {/* Başlık */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-4xl font-black text-slate-900">{hotel.name}</h1>
                <span className="text-[11px] font-bold px-2 py-1 rounded bg-slate-900 text-amber-400">
                  {PROPERTY_TYPE_LABELS[hotel.property_type || 'hotel'] || 'Otel'}
                </span>
                {Number(hotel.star_rating) > 0 && (
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: Number(hotel.star_rating) }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                    ))}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-500" />
                {hotel.address || hotel.city}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a href={mapLink} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  className="border-slate-300 text-slate-700 !bg-transparent min-h-[44px]"
                >
                  <Navigation className="w-4 h-4 mr-2 text-amber-500" /> Konuma Git
                </Button>
              </a>
              <Button
                variant="outline"
                onClick={() => setFavorites(toggleFavorite(hotel.id))}
                className="border-slate-300 text-slate-700 !bg-transparent min-h-[44px]"
              >
                <Heart
                  className={`w-4 h-4 mr-2 ${isFav ? 'fill-red-500 text-red-500' : ''}`}
                />
                {isFav ? 'Favorilerde' : 'Favorilere Ekle'}
              </Button>
            </div>
          </div>

          {/* Galeri */}
          <ImageCarousel images={gallery} alt={hotel.name} />

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <h2 className="text-lg font-black text-slate-900">Tesis Hakkında</h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {hotel.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {parseList(hotel.features).map((f) => (
                    <span
                      key={f}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Odalar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <h2 className="text-lg font-black text-slate-900">Oda Seçenekleri</h2>

                <div className="grid sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Giriş</label>
                    <input
                      type="date"
                      value={checkIn}
                      min={today}
                      onChange={(e) => {
                        setCheckIn(e.target.value);
                        if (e.target.value >= checkOut) setCheckOut(addDays(e.target.value, 1));
                      }}
                      className="w-full h-10 px-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Çıkış</label>
                    <input
                      type="date"
                      value={checkOut}
                      min={addDays(checkIn, 1)}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full h-10 px-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">
                      Yetişkin
                    </label>
                    <select
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                      className="w-full h-10 px-2 rounded-lg border border-slate-300 text-sm bg-white"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Çocuk</label>
                    <select
                      value={children}
                      onChange={(e) => setChildren(Number(e.target.value))}
                      className="w-full h-10 px-2 rounded-lg border border-slate-300 text-sm bg-white"
                    >
                      {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {roomQuotes.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Bu tesis için henüz oda tanımlanmamış.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {roomQuotes.map(({ room, quote, fits }) => (
                      <div
                        key={room.id}
                        className="rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-4"
                      >
                        {room.images && (
                          <img
                            src={resolveRoomCoverUrl(parseList(room.images), hotel.image_url)}
                            onError={handleImageError}
                            alt={room.name}
                            className="sm:w-40 h-32 object-cover rounded-xl"
                            loading="lazy"
                          />
                        )}
                        <div className="flex-1 space-y-1.5">
                          <p className="font-bold text-slate-900">{room.name}</p>
                          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1">
                              <BedDouble className="w-3.5 h-3.5" /> {room.bed_type || room.room_type}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" /> {room.capacity} kişi
                            </span>
                          </p>
                          <p className="text-xs text-slate-600 line-clamp-2">{room.description}</p>
                          {!quote.available && quote.unavailableReason && (
                            <p className="text-xs text-red-600 font-medium">
                              {quote.unavailableReason}
                            </p>
                          )}
                          {!fits && (
                            <p className="text-xs text-amber-600 font-medium">
                              Bu oda {guests} misafir için yetersiz kapasiteye sahip.
                            </p>
                          )}
                        </div>
                        <div className="sm:w-44 sm:text-right space-y-2">
                          <div>
                            <p className="text-[11px] text-slate-500">
                              {nights > 0 ? `${nights} gece toplam` : 'Gecelik'}
                            </p>
                            <p className="text-xl font-black text-amber-600">
                              {formatPrice(
                                nights > 0 ? quote.baseTotal : room.price_per_night,
                              )}
                            </p>
                          </div>
                          <Button
                            disabled={!quote.available || !fits}
                            onClick={() => startBooking(room)}
                            className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold min-h-[44px] disabled:opacity-50"
                          >
                            Rezervasyon Yap
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Yorumlar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-500" />
                  Misafir Yorumları ({reviews.length})
                </h2>
                {reviews.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Bu tesis için henüz doğrulanmış yorum bulunmuyor.
                  </p>
                ) : (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-xl border border-slate-200 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{review.guest_name}</p>
                          <p className="text-[11px] text-slate-500">
                            {formatTRDate(review.created_at)}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 text-xs font-black">
                          {review.rating}/5
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{review.comment}</p>
                      {review.partner_reply && (
                        <div className="mt-2 p-3 rounded-lg bg-slate-50 border-l-2 border-amber-500">
                          <p className="text-[11px] font-bold text-slate-700">Tesis Yanıtı</p>
                          <p className="text-sm text-slate-600">{review.partner_reply}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Yan panel */}
            <aside className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 lg:sticky lg:top-24">
                {Number(hotel.guest_score) > 0 && (
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                    <span className="w-14 h-14 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center text-xl font-black">
                      {Number(hotel.guest_score).toFixed(1)}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Misafir Puanı</p>
                      <p className="text-xs text-slate-500">{hotel.review_count || 0} yorum</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Giriş {hotel.check_in_time || '14:00'} • Çıkış{' '}
                    {hotel.check_out_time || '12:00'}
                  </p>
                  <p className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-xs">
                      {hotel.cancellation_policy || 'İptal koşulları için tesisle iletişime geçin.'}
                    </span>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <p className="text-xs font-bold text-slate-700 uppercase">Ödeme Yöntemleri</p>
                  <div className="flex flex-wrap gap-1.5">
                    {resolvePaymentMethods(hotel).map((m) => (
                      <span
                        key={m}
                        className="text-[11px] px-2 py-1 rounded bg-slate-100 text-slate-700"
                      >
                        {PAYMENT_METHOD_LABELS[m]}
                      </span>
                    ))}
                  </div>
                </div>

                {hotel.house_rules && (
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-700 uppercase mb-1">
                      Tesis Kuralları
                    </p>
                    <p className="text-xs text-slate-600 whitespace-pre-line">
                      {hotel.house_rules}
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PropertyDetail;
