import React, { useState, useEffect } from 'react';
import { trackViewRoom } from '@/lib/analytics';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { client } from '@/lib/api';
import { Room, Hotel } from '@/lib/types';
import { handleImageError, resolveImageUrls } from '@/lib/media';
import ImageCarousel from '@/components/ImageCarousel';
import { 
  Users, 
  Maximize2, 
  Bed, 
  Check, 
  Sparkles, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  ArrowLeft, 
  Calendar,
  CreditCard,
  Banknote,
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { buildBranchMapLink, resolveBranchAddress } from '@/lib/contacts';
import { Button } from '@/components/ui/button';
import { GuestSelector } from '@/components/GuestSelector';
import { format, addDays } from 'date-fns';

export const RoomDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick booking state
  const [checkIn, setCheckIn] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [checkOut, setCheckOut] = useState<string>(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [adults, setAdults] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const res = await client.entities.rooms.get({ id });
        if (res?.data) {
          setRoom(res.data);
          trackViewRoom({ id: res.data.id, name: res.data.name, price: Number(res.data.discounted_price || res.data.price_per_night || 0) });
          // fetch associated hotel
          if (res.data.hotel_id) {
            const hotelRes = await client.entities.hotels.get({ id: res.data.hotel_id.toString() });
            if (hotelRes?.data) setHotel(hotelRes.data);
          }
        }
      } catch (err) {
        console.error('Fetch room detail error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  const handleStartBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    navigate(
      `/booking?room_id=${room.id}&hotel_id=${room.hotel_id}&check_in=${checkIn}&check_out=${checkOut}&adults=${adults}&children=${childrenCount}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-500">Oda detayları yükleniyor...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="max-w-md mx-auto text-center my-auto p-8 bg-white rounded-2xl border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Oda Bulunamadı</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">Aradığınız oda mevcut değil veya kaldırılmış olabilir.</p>
          <Link to="/tesisler">
            <Button className="bg-amber-500 text-slate-950 font-bold">Odalar Listesine Dön</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const galleryImages = resolveImageUrls(
    room.images ? room.images.split(',').filter(Boolean) : [hotel?.image_url || ''],
  );
  const amenitiesList = room.amenities ? room.amenities.split(',').map((a) => a.trim()) : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      {/* Header Back Bar */}
      <div className="pt-36 pb-4 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/tesisler" className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Tüm Odalara Dön
          </Link>
          {hotel && (
            <span className="text-xs text-amber-400 font-semibold bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              {hotel.name} ({hotel.city})
            </span>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Gallery Hero */}
        <div className="mb-8">
          <ImageCarousel
            images={galleryImages}
            alt={room.name}
            aspectClassName="aspect-[16/10]"
          />
        </div>

        {/* Room Info & Reservation Box */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Details */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-amber-500 text-slate-950 font-extrabold text-xs px-2.5 py-1 rounded">
                  {room.room_type}
                </span>
                {room.is_featured && (
                  <span className="bg-slate-900 text-amber-300 text-xs font-semibold px-2.5 py-1 rounded border border-amber-400/30">
                    ★ Öne Çıkan Seçenek
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900">{room.name}</h1>
              {hotel && (
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-amber-500" /> {resolveBranchAddress(hotel.city, hotel.address)}
                  <a
                    href={buildBranchMapLink(hotel.city, hotel.address, hotel.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 underline decoration-amber-400/50"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Konuma Git
                  </a>
                </p>
              )}
            </div>

            {/* Quick badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-200">
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                <Users className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <span className="text-[11px] text-slate-400 block">Kapasite</span>
                <span className="text-xs font-bold text-slate-800">Maks. {room.capacity} Kişi</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                <Maximize2 className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <span className="text-[11px] text-slate-400 block">Oda Boyutu</span>
                <span className="text-xs font-bold text-slate-800">{room.size_sqm || 35} m²</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                <Bed className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <span className="text-[11px] text-slate-400 block">Yatak</span>
                <span className="text-xs font-bold text-slate-800">{room.bed_type || 'King Yatak'}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                <ShieldCheck className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <span className="text-[11px] text-slate-400 block">Temizlik</span>
                <span className="text-xs font-bold text-slate-800">Günlük Dezenfekte</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900">Oda Açıklaması</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {room.description || 'UYUROOM Hotel standartlarına uygun, konforlu mobilyalar, hijyenik nevresimler ve sessiz yalıtım ile donatılmıştır.'}
              </p>
            </div>

            {/* Amenities List */}
            {amenitiesList.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Oda Olanakları ve Ekipmanlar</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenitiesList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-700"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules */}
            <div className="bg-amber-50/70 p-6 rounded-2xl border border-amber-200/60 space-y-2 text-xs text-amber-900">
              <h4 className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> Konaklama Notları & Avantajlar
              </h4>
              <p>• Giriş Saati: 14:00 | Çıkış Saati: 12:00</p>
              <p>• Kapıda ödeme seçeneğinde rezervasyonunuz anında garanti altına alınır, otele varışta ödenir.</p>
              <p>• Havale / EFT ile ödemelerde ek %5 indirim avantajından yararlanabilirsiniz.</p>
            </div>
          </div>

          {/* Sticky Booking Form Box */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl sticky top-24 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs text-slate-400 block uppercase tracking-wider">Gecelik Konaklama</span>
                <div className="flex items-baseline gap-2 mt-1">
                  {room.discounted_price && room.discounted_price < room.price_per_night ? (
                    <>
                      <span className="text-3xl font-black text-amber-600">
                        ₺{room.discounted_price.toLocaleString('tr-TR')}
                      </span>
                      <span className="text-sm text-slate-400 line-through">
                        ₺{room.price_per_night.toLocaleString('tr-TR')}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-black text-slate-900">
                      ₺{room.price_per_night.toLocaleString('tr-TR')}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">/ gece</span>
                </div>
              </div>

              <form onSubmit={handleStartBooking} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" /> Giriş Tarihi
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" /> Çıkış Tarihi
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn || format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-500" /> Misafirler
                  </label>
                  <GuestSelector
                    adults={adults}
                    children={childrenCount}
                    onAdultsChange={setAdults}
                    onChildrenChange={setChildrenCount}
                    compact
                  />
                  {adults + childrenCount > (room.capacity || 2) ? (
                    <p className="text-[11px] font-semibold text-red-600">
                      Bu oda en fazla {room.capacity} misafir kapasitelidir.
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      Toplam {adults + childrenCount} misafir / Maks. {room.capacity} kişi
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={adults + childrenCount > (room.capacity || 2)}
                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 rounded-xl disabled:opacity-50"
                  >
                    Rezervasyona Devam Et &rarr;
                  </Button>
                </div>
              </form>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Kapıda Ödeme İmkanı</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>Havale / EFT veya otelde ödeme</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Anında SMS & PNR Kodu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RoomDetail;