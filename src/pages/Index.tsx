import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SearchEngine } from '@/components/SearchEngine';
import { RoomCard } from '@/components/RoomCard';
import { client } from '@/lib/api';
import { Hotel, Room, Review } from '@/lib/types';
import { handleImageError, resolveCoverUrl } from '@/lib/media';
import { parseList } from '@/lib/ota';
import { 
  MapPin, 
  ShieldCheck, 
  Wifi, 
  Coffee, 
  Car, 
  Clock, 
  Utensils, 
  Tv, 
  Star, 
  CreditCard, 
  Banknote, 
  Building2, 
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildBranchMapLink, resolveBranchAddress, findBranchContact } from '@/lib/contacts';

export const Index: React.FC = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [featuredRooms, setFeaturedRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

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
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-20 overflow-hidden bg-slate-950 text-white">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/uyuroom-adana-hotel-exterior.webp"
            alt="UYUROOM Hotel"
            className="w-full h-full object-cover opacity-35 scale-105 animate-fade-in"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/40" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight text-white">
            Eşsiz Uyku Deneyimi, <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
              Kusursuz Konfor.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-lg text-slate-300 leading-relaxed font-light">
            UYUROOM HOTEL ile ister iş ister tatil seyahatlerinizde yüksek standartlı odalar, merkezi konum.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link to="/tesisler">
              <Button size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-base px-8 h-12 shadow-xl shadow-amber-500/25">
                Odaları İncele & Rezervasyon Yap &rarr;
              </Button>
            </Link>
            <Link to="/tesisler">
              <Button size="lg" variant="outline" className="border-slate-700 text-white hover:bg-slate-800 text-base h-12 !bg-transparent">
                <Building2 className="w-4 h-4 mr-2 text-amber-400" />
                Tesislerimizi Keşfet
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Booking Search Engine Bar */}
      <section className="px-4 relative z-20">
        <SearchEngine hotels={hotels} />
      </section>

      {/* Hotel Branches Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Çok Şubeli Ağımız</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Adana ve Uşak Tesislerimizle Hizmetinizdeyiz
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Her iki ilimizde de en merkezi noktalarda, lüks donanım ve samimi misafirperverlikle sizleri ağırlıyoruz.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {hotels.map((hotel) => (
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
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-md hover:shadow-2xl hover:border-amber-300 transition-all duration-300 flex flex-col group cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-slate-900">
                <img
                  src={resolveCoverUrl(parseList(hotel.gallery), hotel.image_url)}
                  onError={handleImageError}
                  alt={hotel.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
                <div className="absolute top-4 left-4 bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  {hotel.city} Şubesi
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                  <span className="font-bold text-lg sm:text-xl drop-shadow">{hotel.name}</span>
                  <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-400/30 text-amber-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {hotel.rating || '4.9'}
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 leading-relaxed">{hotel.description}</p>
                  
                  <div className="space-y-2 pt-1">
                    <div className="flex items-start gap-2 text-xs text-slate-500">
                      <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{resolveBranchAddress(hotel.city, hotel.address)}</span>
                    </div>
                    <a
                      href={buildBranchMapLink(hotel.city, hotel.address, hotel.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-lg bg-slate-950 hover:bg-slate-900 text-amber-400 font-bold text-xs transition-colors border border-amber-500/40 w-full sm:w-auto"
                    >
                      <Navigation className="w-4 h-4" />
                      Konuma Git
                    </a>
                  </div>

                  {hotel.features && (
                    <div className="pt-2">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Öne Çıkan Ayrıcalıklar:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {hotel.features.split(',').map((f, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-100"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> {f.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  {(() => {
                    const branch = findBranchContact(hotel.city);
                    const phoneRaw = branch?.phoneRaw || hotel.phone || '';
                    const phoneLabel = branch?.phoneDisplay || hotel.phone || 'İletişim';
                    return (
                      <a
                        href={`tel:${phoneRaw}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-semibold text-slate-700 hover:text-amber-600 flex items-center gap-1.5"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-amber-500" /> {phoneLabel}
                      </a>
                    );
                  })()}

                  <Link to={`/tesis/${hotel.id}`}>
                    <Button className="bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold text-xs">
                      Bu Tesisteki Odalar &rarr;
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="bg-slate-100 py-20 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Konforlu Seçenekler</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">Öne Çıkan Odalarımız</h2>
              <p className="text-sm text-slate-600 mt-2">Özel jakuzili süitlerden aile odalarına kadar tüm ihtiyaçlarınıza uygun konaklama.</p>
            </div>
            <Link to="/tesisler">
              <Button variant="outline" className="border-slate-300 font-semibold text-slate-800 !bg-transparent">
                Tüm Odaları Gör ({featuredRooms.length}+) &rarr;
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRooms.map((room) => {
              const hotel = hotels.find((h) => h.id === room.hotel_id);
              return <RoomCard key={room.id} room={room} hotel={hotel} />;
            })}
          </div>
        </div>
      </section>

      {/* Payment Options Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Güvenli & Kolay</span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1">3 Farklı Ödeme Yolu</h2>
          <p className="text-sm text-slate-600 mt-2">İhtiyacınıza en uygun ödeme seçeneğiyle rezervasyonunuzu saniyeler içinde tamamlayın.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-lg transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Banknote className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Otelde Kapıda Ödeme</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ön ödeme yapmadan rezervasyon talebinizi oluşturun. Ücreti otele giriş yaptığınızda resepsiyonda nakit veya kredi kartıyla ödeyin.
            </p>
            <span className="text-xs font-bold text-emerald-600 inline-block bg-emerald-50 px-2.5 py-1 rounded">
              ✓ Sıfır Risk, Kolay İptal
            </span>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-lg transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Banka Havalesi / EFT / FAST</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ziraat, Garanti veya İş Bankası kurumsal hesaplarımıza rezervasyon PNR kodunuzla havale gönderin. Anında sistem onayına düşsün.
            </p>
            <span className="text-xs font-bold text-blue-600 inline-block bg-blue-50 px-2.5 py-1 rounded">
              ✓ Hızlı ve Güvenli Hesap Bildirimi
            </span>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-lg transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Kolay Rezervasyon</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Birkaç adımda rezervasyon talebinizi oluşturun, PNR kodunuzla dilediğiniz zaman sorgulayın. Ekibimiz sizinle iletişime geçer.
            </p>
            <span className="text-xs font-bold text-amber-600 inline-block bg-amber-50 px-2.5 py-1 rounded">
              ✓ PNR Kodu ile Sorgulama
            </span>
          </div>
        </div>
      </section>

      {/* Guest Reviews Section */}
      {reviews.length > 0 && (
        <section className="bg-slate-900 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Misafir Deneyimleri</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">UYUROOM Misafirleri Ne Diyor?</h2>
              <p className="text-sm text-slate-400">Adana ve Uşak şubelerimizde konaklayan misafirlerimizin gerçek yorumları.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-300 italic leading-relaxed">"{rev.comment}"</p>
                  </div>

                  <div className="pt-4 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-white">{rev.guest_name}</span>
                    <span>{rev.stay_date || 'Son Konaklama'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hotel Amenities Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Konaklama Standartları</span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1">Neden UYUROOM HOTEL?</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <Wifi className="w-6 h-6 text-amber-500 mx-auto" />
            <h4 className="font-bold text-xs text-slate-900">Fiber Wi-Fi</h4>
            <p className="text-[11px] text-slate-500">Tüm alanlarda yüksek hız</p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <Coffee className="w-6 h-6 text-amber-500 mx-auto" />
            <h4 className="font-bold text-xs text-slate-900">Gurme Kahvaltı</h4>
            <p className="text-[11px] text-slate-500">Zengin yöresel lezzetler</p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <Car className="w-6 h-6 text-amber-500 mx-auto" />
            <h4 className="font-bold text-xs text-slate-900">Otopark & Vale</h4>
            <p className="text-[11px] text-slate-500">Misafirlere ücretsiz</p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <Clock className="w-6 h-6 text-amber-500 mx-auto" />
            <h4 className="font-bold text-xs text-slate-900">24/7 Resepsiyon</h4>
            <p className="text-[11px] text-slate-500">Kesintisiz hizmet</p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <Utensils className="w-6 h-6 text-amber-500 mx-auto" />
            <h4 className="font-bold text-xs text-slate-900">Oda Servisi</h4>
            <p className="text-[11px] text-slate-500">24 saat menü servisi</p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <ShieldCheck className="w-6 h-6 text-amber-500 mx-auto" />
            <h4 className="font-bold text-xs text-slate-900">Hijyen & Güvenlik</h4>
            <p className="text-[11px] text-slate-500">Günlük dezenfeksiyon</p>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="bg-gradient-to-r from-amber-500 to-amber-600 py-12 text-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black">Planladığınız Tarih İçin Yerinizi Ayırtın</h3>
            <p className="text-sm font-medium text-slate-900/90">
              En uygun fiyat garantisi ve kapıda ödeme esnekliği sadece resmi web sitemizde.
            </p>
          </div>
          <Link to="/tesisler">
            <Button size="lg" className="bg-slate-950 hover:bg-slate-900 text-amber-400 font-bold px-8 h-12 shadow-xl whitespace-nowrap">
              Oda Listesini Aç &rarr;
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;