import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { client } from '@/lib/api';
import { Room, Hotel, Booking } from '@/lib/types';
import { handleImageError, resolveCoverUrl } from '@/lib/media';
import { 
  CreditCard, 
  Banknote, 
  Building2, 
  CheckCircle2, 
  Calendar, 
  Users, 
  ShieldCheck, 
  Clock, 
  ArrowLeft, 
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { differenceInDays, parseISO, format, addDays } from 'date-fns';
import { toast } from 'sonner';
import {
} from '@/lib/ota';
import {
  resolvePayableBankAccounts,
  formatIban,
  normalizeIban,
  DEFAULT_BANK_ACCOUNTS,
  type BankAccount,
} from '@/lib/bank';

export const BookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const roomIdParam = searchParams.get('room_id');
  const hotelIdParam = searchParams.get('hotel_id');
  const checkInParam = searchParams.get('check_in') || format(new Date(), 'yyyy-MM-dd');
  const checkOutParam = searchParams.get('check_out') || format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const adultCount = Number(searchParams.get('adults')) || Number(searchParams.get('guests')) || 2;
  const childCount = Number(searchParams.get('children')) || 0;
  const totalGuests = adultCount + childCount;

  const [room, setRoom] = useState<Room | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pay_at_hotel' | 'bank_transfer'>('pay_at_hotel');
  
  // Credit card simulation state

  // Bank transfer selected bank
  const [selectedBankIndex, setSelectedBankIndex] = useState(0);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(DEFAULT_BANK_ACCOUNTS);
  const [bankSource, setBankSource] = useState<'hotel' | 'platform'>('platform');
  const activeBank = bankAccounts[selectedBankIndex] || bankAccounts[0] || DEFAULT_BANK_ACCOUNTS[0];
  const [copiedIban, setCopiedIban] = useState(false);

  useEffect(() => {
    resolvePayableBankAccounts(hotel)
      .then(({ accounts, source }) => {
        setBankAccounts(accounts);
        setBankSource(source);
        setSelectedBankIndex(0);
      })
      .catch(() => undefined);
  }, [hotel]);

  // Calculate nights and total price
  const calculateNights = () => {
    try {
      const start = parseISO(checkInParam);
      const end = parseISO(checkOutParam);
      const days = differenceInDays(end, start);
      return days > 0 ? days : 1;
    } catch {
      return 1;
    }
  };

  const nights = calculateNights();
  const unitPrice = room?.discounted_price || room?.price_per_night || 0;
  
  // Havale indirimi %5
  const discountRate = paymentMethod === 'bank_transfer' ? 0.05 : 0;
  const rawTotal = unitPrice * nights;
  const totalPrice = Math.round(rawTotal * (1 - discountRate));

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true);
        if (roomIdParam) {
          const roomRes = await client.entities.rooms.get({ id: roomIdParam });
          if (roomRes?.data) {
            setRoom(roomRes.data);
            const targetHotelId = roomRes.data.hotel_id || hotelIdParam;
            if (targetHotelId) {
              const hotelRes = await client.entities.hotels.get({ id: targetHotelId.toString() });
              if (hotelRes?.data) setHotel(hotelRes.data);
            }
          }
        }
      } catch (err) {
        console.error('Load booking room error', err);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [roomIdParam, hotelIdParam]);

  const handleCopyIban = (iban: string) => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(true);
    toast.success('IBAN panoya kopyalandı');
    setTimeout(() => setCopiedIban(false), 2500);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !hotel) {
      toast.error('Otel veya oda bilgisi eksik');
      return;
    }

    if (!guestName || !guestEmail || !guestPhone) {
      toast.error('Lütfen zorunlu misafir alanlarını doldurun');
      return;
    }

    try {
      setSubmitting(true);
      // PNR kodu üretimi (UYU-XXXXXX)
      const randomCode = Math.floor(100000 + Math.random() * 900000);
      const bookingCode = `UYU-${randomCode}`;

      let paymentStatus: 'pending' | 'awaiting_transfer' = 'pending';
      let receiptNotes = '';

      if (paymentMethod === 'pay_at_hotel') {
        paymentStatus = 'pending';
        receiptNotes = 'Otelde kapıda ödeme seçildi.';
      } else if (paymentMethod === 'bank_transfer') {
        paymentStatus = 'awaiting_transfer';
        receiptNotes = `Havale seçildi. Banka: ${activeBank?.bank_name || '-'}`;
      }

      const bookingPayload = {
        booking_code: bookingCode,
        hotel_id: hotel.id,
        room_id: room.id,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,

        check_in_date: checkInParam,
        check_out_date: checkOutParam,
        guest_count: totalGuests,
        adult_count: adultCount,
        child_count: childCount,
        night_count: nights,
        total_price: totalPrice,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        booking_status: 'confirmed',
        special_requests: specialRequests,
        receipt_notes: receiptNotes,
      };

      const res = await client.entities.bookings.create({
        data: bookingPayload,
      });

      toast.success('Rezervasyonunuz başarıyla oluşturuldu!');
      navigate(`/booking-confirmation?code=${bookingCode}`);
    } catch (err: any) {
      console.error('Booking creation error', err);
      toast.error(err?.message || 'Rezervasyon kaydedilirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-500">Rezervasyon adımları hazırlanıyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="pt-28 pb-8 bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/tesisler" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 mb-3">
            <ArrowLeft className="w-4 h-4" /> Oda Seçimine Dön
          </Link>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">Rezervasyon ve Ödeme</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Bilgilerinizi doldurun ve tercih ettiğiniz ödeme kanalı ile güvenle onaylayın.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <form onSubmit={handleSubmitBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Left Side */}
          <div className="lg:col-span-8 space-y-8">
            {/* Step 1: Guest Information */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                  1
                </div>
                <h2 className="font-bold text-lg text-slate-900">Misafir Bilgileri</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Ad Soyad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Örn: Ahmet Yılmaz"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    E-Posta Adresi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="ornek@mail.com"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">
                    Telefon Numarası <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Özel İstekler / Notlar</label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Yüksek kat, erken giriş talebi veya ekstra yastık vb."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Step 2: Payment Method Selection */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                  2
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-900">Ödeme Yöntemi Seçin</h2>
                  <p className="text-xs text-slate-500">Otelde kapıda veya banka havalesi ile ödeyin</p>
                </div>
              </div>

              {/* Payment Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Method 1: Pay at hotel */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pay_at_hotel')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                    paymentMethod === 'pay_at_hotel'
                      ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <Banknote className={`w-6 h-6 mb-2 ${paymentMethod === 'pay_at_hotel' ? 'text-amber-600' : 'text-slate-500'}`} />
                  <p className="font-bold text-sm text-slate-900">Kapıda Ödeme</p>
                  <p className="text-[11px] text-slate-500 mt-1">Otele varışta nakit veya POS ile ödeyin.</p>
                  {paymentMethod === 'pay_at_hotel' && (
                    <span className="absolute top-3 right-3 text-amber-600">
                      <CheckCircle2 className="w-5 h-5 fill-amber-500 text-white" />
                    </span>
                  )}
                </button>

                {/* Method 2: Bank Transfer */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Building2 className={`w-6 h-6 mb-2 ${paymentMethod === 'bank_transfer' ? 'text-blue-600' : 'text-slate-500'}`} />
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">%5 İndirim</span>
                  </div>
                  <p className="font-bold text-sm text-slate-900">Banka Havalesi</p>
                  <p className="text-[11px] text-slate-500 mt-1">Kurumsal IBAN'a EFT / FAST ile ödeme.</p>
                  {paymentMethod === 'bank_transfer' && (
                    <span className="absolute top-3 right-3 text-amber-600">
                      <CheckCircle2 className="w-5 h-5 fill-amber-500 text-white" />
                    </span>
                  )}
                </button>

              </div>

              {/* Dynamic Payment Detail View */}
              {paymentMethod === 'pay_at_hotel' && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Ön Ödeme Yok, Güvence Var
                  </p>
                  <p>
                    Rezervasyonunuz tamamlandığında PNR kodunuz üretilecek ve odanız sizin adınıza ayrılacaktır.
                    Toplam tutarı otele giriş yaptığınızda resepsiyonda dilediğiniz gibi ödeyebilirsiniz.
                  </p>
                </div>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase">
                      {bankSource === 'hotel'
                        ? `${hotel?.name || 'Tesis'} Banka Hesapları`
                        : 'Kurumsal Banka Hesaplarımız'}
                    </span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                      %5 İndirim Uygulandı
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {bankAccounts.map((bank, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedBankIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          selectedBankIndex === idx
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {bank.bank_name}
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Hesap Sahibi:</span>
                      <span className="font-bold text-white">{activeBank?.account_holder}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Şube:</span>
                      <span className="text-slate-200">{activeBank?.branch}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                      <span className="text-amber-400 font-mono font-bold text-xs sm:text-sm">
                        {formatIban(activeBank?.iban || '')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyIban(normalizeIban(activeBank?.iban || ''))}
                        className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[11px] font-bold text-amber-300 flex items-center gap-1"
                      >
                        {copiedIban ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedIban ? 'Kopyalandı' : 'Kopyala'}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    {bankSource === 'hotel'
                      ? `* Ödeme doğrudan ${hotel?.name || 'tesis'} hesabına yapılır.`
                      : '* Ödeme platformun kurumsal hesabına yapılır.'}
                  </p>
                  <p className="text-[11px] text-slate-400 italic">
                    * Açıklama kısmına rezervasyon oluşturduktan sonra verilecek PNR kodunu yazmanız yeterlidir.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Summary Sidebar (Right Side) */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl sticky top-24 space-y-6">
              <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
                Rezervasyon Özeti
              </h3>

              {/* Room Card Preview */}
              {room && (
                <div className="flex gap-3 items-center">
                  <img
                    src={resolveCoverUrl(room.images?.split(','), hotel?.image_url)}
                    onError={handleImageError}
                    alt={room.name}
                    className="w-20 h-16 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 leading-tight">{room.name}</h4>
                    <p className="text-xs text-amber-600 font-semibold mt-0.5">{hotel?.name}</p>
                    <p className="text-[11px] text-slate-500">{hotel?.city} Şubesi</p>
                  </div>
                </div>
              )}

              {/* Dates & Guests */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-amber-500" /> Giriş:</span>
                  <span className="font-bold text-slate-900">{checkInParam}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-amber-500" /> Çıkış:</span>
                  <span className="font-bold text-slate-900">{checkOutParam}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" /> Konaklama:</span>
                  <span className="font-bold text-slate-900">{nights} Gece</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-amber-500" /> Yetişkin:</span>
                  <span className="font-bold text-slate-900">{adultCount} Kişi</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-amber-500" /> Çocuk:</span>
                  <span className="font-bold text-slate-900">{childCount} Kişi</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200">
                  <span className="flex items-center gap-1.5 font-semibold">Toplam Misafir:</span>
                  <span className="font-bold text-amber-600">{totalGuests} Kişi</span>
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="space-y-2 text-xs border-t border-slate-100 pt-4">
                <div className="flex justify-between text-slate-600">
                  <span>Gecelik Fiyat:</span>
                  <span>₺{unitPrice.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Toplam Gece Tutarı ({nights} gece):</span>
                  <span>₺{rawTotal.toLocaleString('tr-TR')}</span>
                </div>
                {paymentMethod === 'bank_transfer' && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Havale İndirimi (%5):</span>
                    <span>-₺{(rawTotal - totalPrice).toLocaleString('tr-TR')}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900">
                  <span className="font-bold text-sm">Ödenecek Tutar:</span>
                  <span className="font-black text-2xl text-amber-600">₺{totalPrice.toLocaleString('tr-TR')}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 rounded-xl"
              >
                {submitting ? 'Rezervasyon Kaydediliyor...' : 'Rezervasyonu Tamamla & Onayla'}
              </Button>

              <p className="text-[10px] text-center text-slate-400">
                Rezervasyon yaparak UYUROOM Konaklama ve İptal Şartlarını kabul etmiş olursunuz.
              </p>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default BookingPage;