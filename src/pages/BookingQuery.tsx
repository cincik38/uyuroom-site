import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { client } from '@/lib/api';
import { Booking, Room, Hotel } from '@/lib/types';
import { Search, Calendar, MapPin, Users, CheckCircle2, Clock, XCircle, AlertCircle, Phone, Navigation } from 'lucide-react';
import { buildBranchMapLink, resolveBranchAddress } from '@/lib/contacts';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const BookingQuery: React.FC = () => {
  const [queryCode, setQueryCode] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryCode.trim()) {
      toast.error('Lütfen bir PNR rezervasyon kodu girin');
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      const res = await client.entities.bookings.query({
        query: { booking_code: queryCode.trim().toUpperCase() },
        limit: 1,
      });

      if (res?.data?.items?.[0]) {
        const item = res.data.items[0];
        setBooking(item);
        if (item.room_id) {
          const rRes = await client.entities.rooms.get({ id: item.room_id.toString() });
          if (rRes?.data) setRoom(rRes.data);
        }
        if (item.hotel_id) {
          const hRes = await client.entities.hotels.get({ id: item.hotel_id.toString() });
          if (hRes?.data) setHotel(hRes.data);
        }
      } else {
        setBooking(null);
      }
    } catch (err) {
      console.error('Query booking error', err);
      toast.error('Sorgulama esnasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="pt-36 pb-12 bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Rezervasyon Sorgulama</span>
          <h1 className="text-3xl sm:text-5xl font-black text-white">Rezervasyonunuzu Görüntüleyin</h1>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            Rezervasyon onayınızda verilen PNR kodunu (Örn: UYU-827361) girerek güncel durumunuzu takip edin.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-8">
        {/* Search Box */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={queryCode}
              onChange={(e) => setQueryCode(e.target.value)}
              placeholder="Örn: UYU-123456"
              className="flex-1 h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-base font-mono uppercase font-bold tracking-wider focus:ring-2 focus:ring-amber-500"
              required
            />
            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-8 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm rounded-xl"
            >
              {loading ? 'Sorgulanıyor...' : 'Sorgula'}
            </Button>
          </form>
        </div>

        {/* Query Results */}
        {searched && (
          <div>
            {!booking ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="font-bold text-base text-slate-800">Kayıt Bulunamadı</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  "{queryCode}" kodlu rezervasyon bulunamadı. Lütfen PNR kodunuzu kontrol edip tekrar deneyiniz.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs text-slate-400 block uppercase">PNR Kodu</span>
                    <span className="text-xl font-black text-amber-600 font-mono">{booking.booking_code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />{' '}{({ confirmed: 'Onaylandı', pending: 'Onay Bekliyor', cancelled: 'İptal Edildi', checked_in: 'Konaklıyor', completed: 'Tamamlandı', no_show: 'Gelmedi' } as Record<string, string>)[booking.booking_status] || 'Onay Bekliyor'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                      Ödeme: {booking.payment_status === 'completed' ? 'Tamamlandı' : 'Bekleniyor / Kapıda'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
                    <p className="font-bold text-slate-900 text-sm">{hotel?.name}</p>
                    <p className="text-slate-500">{hotel?.city} Şubesi</p>
                    <p className="text-slate-500 mt-1">{resolveBranchAddress(hotel?.city, hotel?.address)}</p>
                    <a
                      href={buildBranchMapLink(hotel?.city, hotel?.address, hotel?.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-lg bg-slate-950 hover:bg-slate-900 text-amber-400 font-bold text-xs transition-colors border border-amber-500/40"
                    >
                      <Navigation className="w-4 h-4" /> Konuma Git
                    </a>
                    <p className="text-slate-800 font-semibold">{room?.name}</p>
                    <p className="text-slate-600 pt-1">
                      {booking.check_in_date} &rarr; {booking.check_out_date} ({booking.night_count} Gece)
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
                    <p className="font-bold text-slate-900 text-sm">Misafir: {booking.guest_name}</p>
                    <p className="text-slate-600">Telefon: {booking.guest_phone}</p>
                    <p className="text-slate-600">E-Posta: {booking.guest_email}</p>
                    <p className="text-slate-900 font-black text-sm pt-1">
                      Toplam: ₺{booking.total_price?.toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2">
                  <Phone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">İptal veya Değişiklik Talepleriniz İçin:</span>
                    <span>Resepsiyonumuzla iletişime geçebilirsiniz: {hotel?.phone || '+90 850 123 45 67'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BookingQuery;