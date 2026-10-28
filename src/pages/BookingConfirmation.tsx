import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { client } from '@/lib/api';
import { Booking, Room, Hotel } from '@/lib/types';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  Calendar, 
  MapPin, 
  Users, 
  Building2, 
  CreditCard, 
  Banknote, 
  Printer, 
  PhoneCall,
  Navigation,
  Home
} from 'lucide-react';
import { buildBranchMapLink, resolveBranchAddress } from '@/lib/contacts';
import { resolvePayableBankAccounts, formatIban, normalizeIban, type BankAccount } from '@/lib/bank';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const BookingConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankSource, setBankSource] = useState<'hotel' | 'platform'>('platform');

  useEffect(() => {
    resolvePayableBankAccounts(hotel)
      .then(({ accounts, source }) => {
        setBankAccounts(accounts);
        setBankSource(source);
      })
      .catch(() => undefined);
  }, [hotel]);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        if (!code) return;
        const res = await client.entities.bookings.query({
          query: { booking_code: code },
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
        }
      } catch (err) {
        console.error('Fetch booking error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [code]);

  const handleCopyCode = () => {
    if (!booking) return;
    navigator.clipboard.writeText(booking.booking_code);
    setCopiedCode(true);
    toast.success('Rezervasyon PNR kodu kopyalandı');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <div className="pt-28 pb-12 flex-1 max-w-4xl mx-auto px-4 sm:px-6 w-full">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500">Rezervasyon bilgileri yükleniyor...</p>
          </div>
        ) : !booking ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">Rezervasyon Bulunamadı</h2>
            <p className="text-sm text-slate-500">
              Belirtilen koda ait bir rezervasyon kaydı bulunamadı. Lütfen PNR kodunuzu kontrol edin.
            </p>
            <Link to="/booking-query">
              <Button className="bg-amber-500 text-slate-950 font-bold">Rezervasyon Sorgula</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-10 space-y-8">
              {/* Top Banner */}
              <div className="text-center space-y-3">
                <BrandLogo
                  size={52}
                  variant="light"
                  tagline="Adana • Uşak"
                  className="justify-center mb-2"
                />
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Rezervasyon Talebiniz Alındı
                </h1>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Sayın <span className="font-bold text-slate-900">{booking.guest_name}</span>, UYUROOM HOTEL'i tercih ettiğiniz için teşekkür ederiz. Ekibimiz rezervasyonunuzu kontrol ederek sizinle iletişime geçecektir; PNR kodunuzla durumu dilediğiniz zaman sorgulayabilirsiniz.
                </p>
              </div>

              {/* PNR Code Block */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                    Rezervasyon Takip & PNR Kodunuz
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-amber-950 font-mono">
                    {booking.booking_code}
                  </span>
                </div>
                <Button
                  onClick={handleCopyCode}
                  variant="outline"
                  className="border-amber-300 text-amber-900 hover:bg-amber-100 font-bold text-xs !bg-transparent"
                >
                  {copiedCode ? <Check className="w-4 h-4 mr-1.5 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1.5" />}
                  {copiedCode ? 'Kopyalandı!' : 'Kodu Kopyala'}
                </Button>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Konaklama Detayları</h3>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Otel:</span>
                      <span className="font-bold text-slate-900">{hotel?.name || 'UYUROOM HOTEL'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Şube:</span>
                      <span className="font-semibold text-slate-800">{hotel?.city} Şubesi</span>
                    </div>
                    <div className="flex flex-col gap-2 pt-1">
                      <span className="text-slate-500">Adres:</span>
                      <span className="font-medium text-slate-800">
                        {resolveBranchAddress(hotel?.city, hotel?.address)}
                      </span>
                      <a
                        href={buildBranchMapLink(hotel?.city, hotel?.address, hotel?.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-lg bg-slate-950 hover:bg-slate-900 text-amber-400 font-bold text-xs transition-colors border border-amber-500/40"
                      >
                        <Navigation className="w-4 h-4" /> Konuma Git
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Oda:</span>
                      <span className="font-semibold text-slate-800">{room?.name || 'Seçilen Oda'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tarihler:</span>
                      <span className="font-bold text-slate-900">{booking.check_in_date} / {booking.check_out_date} ({booking.night_count} Gece)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Misafir Sayısı:</span>
                      <span className="text-slate-800">
                        {booking.adult_count ?? booking.guest_count} Yetişkin
                        {(booking.child_count ?? 0) > 0 ? `, ${booking.child_count} Çocuk` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Ödeme & Misafir Bilgisi</h3>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Misafir:</span>
                      <span className="font-bold text-slate-900">{booking.guest_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Telefon:</span>
                      <span className="text-slate-800">{booking.guest_phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">E-Posta:</span>
                      <span className="text-slate-800">{booking.guest_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ödeme Yöntemi:</span>
                      <span className="font-bold text-amber-600">
                        {booking.payment_method === 'pay_at_hotel' && 'Kapıda Ödeme (Otelde)'}
                        {booking.payment_method === 'bank_transfer' && 'Banka Havalesi / EFT'}
                        {booking.payment_method === 'credit_card' && 'Online Kredi Kartı'}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1 border-t border-slate-200">
                      <span className="font-bold text-slate-800">Toplam Tutar:</span>
                      <span className="text-lg font-black text-slate-950">₺{booking.total_price?.toLocaleString('tr-TR')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transfer reminder if bank transfer */}
              {booking.payment_method === 'bank_transfer' && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-2">
                  <p className="font-bold">Önemli Havale Hatırlatması:</p>
                  <p className="text-[11px]">
                    {bankSource === 'hotel'
                      ? `Ödeme doğrudan ${hotel?.name || 'tesis'} banka hesabına yapılır.`
                      : 'Tesise ait hesap tanımlı olmadığı için platformun kurumsal hesapları gösteriliyor.'}
                  </p>
                  {bankAccounts.length > 0 && (
                    <div className="space-y-2">
                      {bankAccounts.map((acc, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-white border border-blue-200">
                          <p className="font-bold text-slate-900">{acc.bank_name}</p>
                          <p className="text-slate-600">{acc.account_holder}</p>
                          {acc.branch && <p className="text-slate-500">{acc.branch}</p>}
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <p className="font-mono font-bold text-slate-900">{formatIban(acc.iban)}</p>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(normalizeIban(acc.iban));
                                toast.success('IBAN panoya kopyalandı');
                              }}
                              className="px-2.5 py-1 rounded bg-slate-900 text-amber-300 text-[11px] font-bold"
                            >
                              Kopyala
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p>
                    Lütfen banka havalesini yaparken açıklama kısmına <strong>{booking.booking_code}</strong> PNR kodunu ekleyiniz. 
                    Ödemeniz hesabımıza ulaştığında resepsiyonumuz tarafından SMS/E-posta ile bilgilendirileceksiniz.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="border-slate-200 text-slate-700 text-xs !bg-transparent"
                >
                  <Printer className="w-4 h-4 mr-1.5" /> Yazdır / PDF Kaydet
                </Button>

                <div className="flex items-center gap-3">
                  <Link to="/">
                    <Button variant="ghost" className="text-xs text-slate-600">
                      <Home className="w-4 h-4 mr-1" /> Ana Sayfa
                    </Button>
                  </Link>
                  <Link to="/booking-query">
                    <Button className="bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold text-xs">
                      Rezervasyon Sorgulama Ekranı &rarr;
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BookingConfirmation;