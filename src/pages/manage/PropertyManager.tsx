/**
 * UYUROOM Tesis Yönetim Merkezi (Extranet).
 * Booking/Agoda tarzı, sol menülü tam sayfa yönetim paneli.
 * Hem partner (/tesis/panel) hem süper admin (/yonetim/tesis/:id) aynı arayüzü kullanır.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BedDouble,
  Building2,
  CalendarCheck,
  CalendarRange,
  CheckCircle2,
  Clock,
  Download,
  Image as ImageIcon,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquare,
  Percent,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  Tag,
  Trash2,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/BrandLogo';
import { client } from '@/lib/api';
import MediaUploader from '@/components/MediaUploader';
import BankAccountsEditor from '@/components/BankAccountsEditor';
import {
  resolveHotelBankAccounts,
  saveHotelBankAccounts,
  isValidIban,
  type BankAccount,
} from '@/lib/bank';
import {
  AMENITY_OPTIONS,
  LISTING_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PROPERTY_TYPE_LABELS,
  TR_CITIES,
  ROOM_AMENITY_OPTIONS,
  addDays,
  logoutAdmin,
  downloadCsv,
  formatPrice,
  formatTRDate,
  getSession,
  parseList,
  resolveListingStatus,
  serializeList,
  toISODate,
} from '@/lib/ota';
import type { Booking, Hotel, Promotion, RateCalendarEntry, Review, Room } from '@/lib/types';
import { toast } from 'sonner';

type SectionKey =
  | 'overview'
  | 'profile'
  | 'amenities'
  | 'gallery'
  | 'rooms'
  | 'calendar'
  | 'promotions'
  | 'bookings'
  | 'policies'
  | 'reviews'
  | 'settings';

const SECTIONS: { key: SectionKey; label: string; icon: React.ElementType; group: string }[] = [
  { key: 'overview', label: 'Genel Bakış', icon: LayoutDashboard, group: 'Operasyon' },
  { key: 'bookings', label: 'Rezervasyonlar', icon: CalendarCheck, group: 'Operasyon' },
  { key: 'calendar', label: 'Fiyat & Müsaitlik', icon: CalendarRange, group: 'Operasyon' },
  { key: 'rooms', label: 'Oda Tipleri', icon: BedDouble, group: 'Operasyon' },
  { key: 'promotions', label: 'Fiyat Planları & Promosyon', icon: Tag, group: 'Satış' },
  { key: 'profile', label: 'Tesis Profili', icon: Building2, group: 'Tesis' },
  { key: 'amenities', label: 'Olanaklar & Hizmetler', icon: ListChecks, group: 'Tesis' },
  { key: 'gallery', label: 'Fotoğraf & Galeri', icon: ImageIcon, group: 'Tesis' },
  { key: 'policies', label: 'Politikalar & Kurallar', icon: ShieldCheck, group: 'Tesis' },
  { key: 'reviews', label: 'Yorumlar', icon: MessageSquare, group: 'Tesis' },
  { key: 'settings', label: 'Ayarlar & Kullanıcı', icon: Settings, group: 'Tesis' },
];

const AMENITY_GROUPS: { title: string; items: string[] }[] = [
  {
    title: 'Genel',
    items: ['Ücretsiz Wi-Fi', '7/24 Resepsiyon', 'Asansör', 'Klima', 'Çamaşırhane', 'Oda Servisi'],
  },
  { title: 'Yiyecek & İçecek', items: ['Kahvaltı Dahil', 'Restoran', 'Bar'] },
  { title: 'Otopark & Ulaşım', items: ['Ücretsiz Otopark', 'Havalimanı Servisi'] },
  { title: 'Havuz & Spa', items: ['Havuz', 'Spa & Hamam', 'Fitness Salonu'] },
  { title: 'İş & Toplantı', items: ['Toplantı Salonu'] },
  { title: 'Aile & Erişilebilirlik', items: ['Aile Odaları', 'Engelli Erişimi', 'Evcil Hayvan Kabul'] },
];

const emptyRoomForm = {
  id: 0,
  name: '',
  room_type: 'Standart',
  description: '',
  price_per_night: '',
  discounted_price: '',
  capacity: '2',
  available_count: '1',
  bed_type: 'Çift Kişilik',
  size_sqm: '',
  images: '',
  amenities: '',
  status: 'active',
};

/** Açılır menü ile seçilen profil alanları. */
const PROFILE_SELECTS: [string, string, { value: string; label: string }[]][] = [
  [
    'property_type',
    'Tesis Tipi',
    Object.entries(PROPERTY_TYPE_LABELS).map(([value, lbl]) => ({ value, label: lbl })),
  ],
  [
    'star_rating',
    'Yıldız / Sınıf',
    [1, 2, 3, 4, 5].map((s) => ({ value: String(s), label: `${s} Yıldız` })),
  ],
  ['city', 'Şehir', TR_CITIES.map((c) => ({ value: c, label: c }))],
  [
    'currency',
    'Para Birimi',
    [
      { value: 'TRY', label: '₺ Türk Lirası' },
      { value: 'USD', label: '$ Amerikan Doları' },
      { value: 'EUR', label: '€ Euro' },
    ],
  ],
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);

const CANCELLATION_PRESETS = [
  { value: 'flexible', label: 'Esnek — Girişe 24 saat kalana kadar ücretsiz iptal' },
  { value: 'moderate', label: 'Orta — Girişe 48 saat kalana kadar ücretsiz iptal' },
  { value: 'strict', label: 'Katı — Girişe 7 gün kalana kadar ücretsiz iptal' },
  { value: 'non_refundable', label: 'İade Edilemez — İptal durumunda ücret iadesi yok' },
];

const PROFILE_FIELDS: [string, string, string][] = [
  ['name', 'Tesis Adı', 'UYUROOM Hotel Adana'],
  ['district', 'İlçe', 'Seyhan'],
  ['phone', 'Telefon', '05058987666'],
  ['whatsapp', 'WhatsApp', '905058987666'],
  ['email', 'E-posta', 'info@uyuroom.com'],
  ['website', 'Web Sitesi', 'https://uyuroom.com'],
  ['map_url', 'Harita Bağlantısı / Konum', 'https://maps.google.com/...'],
  ['legal_name', 'Yasal Ünvan', 'UYUROOM Turizm Ltd. Şti.'],
  ['tax_number', 'Vergi Numarası', '1234567890'],
  ['room_total', 'Toplam Oda Sayısı', '40'],
  ['floor_count', 'Kat Sayısı', '6'],
  ['founded_year', 'Kuruluş Yılı', '2018'],
  ['social_links', 'Sosyal Medya', 'instagram.com/uyuroom'],
];

export const PropertyManager: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const session = getSession();
  const isAdmin = session?.role === 'super_admin';
  const hotelId = isAdmin ? Number(params.id) : Number(session?.hotelId);

  const [section, setSection] = useState<SectionKey>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [calendar, setCalendar] = useState<RateCalendarEntry[]>([]);

  const [form, setForm] = useState<Record<string, string>>({});
  const [amenities, setAmenities] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);

  const [roomForm, setRoomForm] = useState({ ...emptyRoomForm });
  const [showRoomForm, setShowRoomForm] = useState(false);

  const [calendarRoomId, setCalendarRoomId] = useState(0);
  const [monthStart, setMonthStart] = useState(() => {
    const d = new Date();
    return toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
  });
  const [bulk, setBulk] = useState({
    start: toISODate(new Date()),
    end: addDays(toISODate(new Date()), 14),
    price: '',
    allotment: '',
    minStay: '',
    closed: false,
    weekendOnly: false,
  });

  const [promoForm, setPromoForm] = useState({
    title: '',
    promo_type: 'general',
    discount_type: 'percent',
    discount_value: '10',
    promo_code: '',
    start_date: '',
    end_date: '',
    min_nights: '1',
  });

  const [bookingFilter, setBookingFilter] = useState({ status: 'all', search: '' });

  const [hotelBankAccounts, setHotelBankAccounts] = useState<BankAccount[]>([]);

  const loadData = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    try {
      const [hotelRes, roomsRes, bookingsRes, promoRes, reviewsRes, calendarRes] =
        await Promise.all([
          client.entities.hotels.get({ id: String(hotelId) }),
          client.entities.rooms.query({ query: { hotel_id: hotelId }, limit: 200 }),
          client.entities.bookings.query({
            query: { hotel_id: hotelId },
            sort: '-created_at',
            limit: 300,
          }),
          client.entities.promotions.query({ query: { hotel_id: hotelId }, limit: 100 }),
          client.entities.reviews.query({ query: { hotel_id: hotelId }, limit: 100 }),
          client.entities.rate_calendar.query({ query: { hotel_id: hotelId }, limit: 800 }),
        ]);

      const data: Hotel = hotelRes?.data;
      setHotel(data);
      const next: Record<string, string> = {};
      PROFILE_FIELDS.forEach(([key]) => {
        const raw = (data as unknown as Record<string, unknown>)[key];
        next[key] = raw === undefined || raw === null ? '' : String(raw);
      });
      next.address = data?.address || '';
      next.description = data?.description || '';
      next.image_url = data?.image_url || '';
      next.check_in_time = data?.check_in_time || '14:00';
      next.check_out_time = data?.check_out_time || '12:00';
      next.cancellation_policy = data?.cancellation_policy || '';
      next.house_rules = data?.house_rules || '';
      next.child_policy = String((data as unknown as Record<string, unknown>).child_policy ?? '');
      next.pet_policy = String((data as unknown as Record<string, unknown>).pet_policy ?? '');
      next.deposit_policy = String(
        (data as unknown as Record<string, unknown>).deposit_policy ?? '',
      );
      next.bank_name = data?.bank_name || '';
      next.iban = data?.iban || '';
      next.owner_name = data?.owner_name || '';
      next.owner_email = data?.owner_email || '';
      next.owner_phone = data?.owner_phone || '';
      setForm(next);
      setAmenities(parseList(data?.features));
      setPaymentMethods(parseList(data?.payment_methods));
      setGallery(parseList(data?.gallery));
      setHotelBankAccounts(resolveHotelBankAccounts(data));

      const roomItems: Room[] = roomsRes?.data?.items || [];
      setRooms(roomItems);
      setCalendarRoomId((prev) => prev || Number(roomItems[0]?.id || 0));
      setBookings(bookingsRes?.data?.items || []);
      setPromotions(promoRes?.data?.items || []);
      setReviews(reviewsRes?.data?.items || []);
      setCalendar(calendarRes?.data?.items || []);

    } catch (e) {
      console.error(e);
      toast.error('Tesis verileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeBookings = useMemo(
    () => bookings.filter((b) => b.booking_status !== 'cancelled'),
    [bookings],
  );

  const stats = useMemo(() => {
    const today = toISODate(new Date());
    const gross = activeBookings.reduce((s, b) => s + Number(b.total_price || 0), 0);
    const arrivals = activeBookings.filter(
      (b) => String(b.check_in_date).slice(0, 10) === today,
    ).length;
    const departures = activeBookings.filter(
      (b) => String(b.check_out_date).slice(0, 10) === today,
    ).length;
    const inHouse = activeBookings.filter(
      (b) =>
        String(b.check_in_date).slice(0, 10) <= today &&
        String(b.check_out_date).slice(0, 10) > today,
    ).length;
    const upcoming = activeBookings.filter(
      (b) => String(b.check_in_date).slice(0, 10) > today,
    ).length;
    const stock = rooms.reduce((s, r) => s + Number(r.available_count || 1), 0);
    const occupancy = stock > 0 ? Math.min(Math.round((inHouse / stock) * 100), 100) : 0;
    return {
      gross,
      arrivals,
      departures,
      inHouse,
      upcoming,
      occupancy,
      count: activeBookings.length,
    };
  }, [activeBookings, rooms]);

  const todoItems = useMemo(() => {
    const items: string[] = [];
    if (!rooms.length) items.push('Henüz oda tipi eklenmedi. Satışa başlamak için oda ekleyin.');
    if (!gallery.length) items.push('Galeriye fotoğraf ekleyerek görünürlüğünüzü artırın.');
    if (!amenities.length) items.push('Olanaklar seçilmedi; misafir filtrelerinde çıkmazsınız.');
    if (!form.cancellation_policy) items.push('İptal politikası tanımlanmamış.');
    if (!form.iban) items.push('Hakediş ödemesi için IBAN bilgisi eksik.');
    const futureRates = calendar.filter(
      (c) => String(c.stay_date).slice(0, 10) >= toISODate(new Date()),
    );
    if (!futureRates.length) items.push('Gelecek tarihler için fiyat/müsaitlik girilmemiş.');
    return items;
  }, [rooms, gallery, amenities, form, calendar]);

  const monthDays = useMemo(() => {
    const base = new Date(`${monthStart}T00:00:00`);
    const year = base.getFullYear();
    const month = base.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => toISODate(new Date(year, month, i + 1)));
  }, [monthStart]);

  const calendarMap = useMemo(() => {
    const map = new Map<string, RateCalendarEntry>();
    calendar
      .filter((c) => Number(c.room_id) === Number(calendarRoomId))
      .forEach((c) => map.set(String(c.stay_date).slice(0, 10), c));
    return map;
  }, [calendar, calendarRoomId]);

  const filteredBookings = useMemo(() => {
    const q = bookingFilter.search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (bookingFilter.status !== 'all' && b.booking_status !== bookingFilter.status) return false;
      if (!q) return true;
      return [b.guest_name, b.guest_email, b.guest_phone, b.booking_code]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [bookings, bookingFilter]);

  /* ---------------------------- Kayıt işlemleri ---------------------------- */

  const persist = async (data: Record<string, unknown>, message: string) => {
    if (!hotelId) return;
    try {
      await client.entities.hotels.update({ id: String(hotelId), data });
      toast.success(message);
      loadData();
    } catch (e) {
      toast.error(`Kayıt başarısız oldu: ${(e as Error)?.message || 'bilinmeyen hata'}`);
    }
  };

  const saveProfile = () =>
    persist(
      {
        name: form.name,
        property_type: form.property_type,
        star_rating: form.star_rating ? Number(form.star_rating) : null,
        city: form.city,
        currency: form.currency || 'TRY',
        district: form.district,
        address: form.address,
        phone: form.phone,
        whatsapp: form.whatsapp,
        email: form.email,
        website: form.website,
        map_url: form.map_url,
        legal_name: form.legal_name,
        tax_number: form.tax_number,
        room_total: form.room_total,
        floor_count: form.floor_count,
        founded_year: form.founded_year,
        social_links: form.social_links,
        description: form.description,
      },
      'Tesis profili kaydedildi.',
    );

  const saveAmenities = () =>
    persist({ features: serializeList(amenities) }, 'Olanaklar güncellendi.');

  const saveGallery = (list: string[]) => {
    setGallery(list);
    persist(
      { gallery: serializeList(list), image_url: list[0] || form.image_url },
      'Galeri güncellendi.',
    );
  };

  const savePolicies = () =>
    persist(
      {
        check_in_time: form.check_in_time,
        check_out_time: form.check_out_time,
        cancellation_policy: form.cancellation_policy,
        house_rules: form.house_rules,
        child_policy: form.child_policy,
        pet_policy: form.pet_policy,
        deposit_policy: form.deposit_policy,
        payment_methods: serializeList(paymentMethods),
      },
      'Politikalar kaydedildi.',
    );

  const saveFinance = () =>
    persist(
      {
        bank_name: form.bank_name,
        iban: form.iban,
        legal_name: form.legal_name,
        tax_number: form.tax_number,
      },
      'Finans bilgileri kaydedildi.',
    );

  const saveAccount = () =>
    persist(
      {
        owner_name: form.owner_name,
        owner_email: form.owner_email,
        owner_phone: form.owner_phone,
      },
      'Hesap bilgileri kaydedildi.',
    );

  const saveHotelBanks = async () => {
    if (!hotelId) return;
    const filled = hotelBankAccounts.filter((a) => a.bank_name.trim() || a.iban.trim());
    const invalid = filled.find((a) => !isValidIban(a.iban));
    if (invalid) {
      toast.error('Geçersiz IBAN var. Format: TR + 24 rakam.');
      return;
    }
    try {
      const saved = await saveHotelBankAccounts(hotelId, filled);
      setHotelBankAccounts(saved);
      await loadData();
      toast.success('Tesis banka hesapları kaydedildi.');
    } catch {
      toast.error('Banka hesapları kaydedilemedi.');
    }
  };

  const saveRoom = async () => {
    if (!hotelId) return;
    if (!roomForm.name.trim() || Number(roomForm.price_per_night) <= 0) {
      toast.error('Oda adı ve geçerli bir taban fiyat zorunludur.');
      return;
    }
    const payload = {
      hotel_id: hotelId,
      name: roomForm.name.trim(),
      room_type: roomForm.room_type.trim() || 'Standart',
      description: roomForm.description.trim(),
      price_per_night: Number(roomForm.price_per_night) || 0,
      discounted_price: Number(roomForm.discounted_price) || Number(roomForm.price_per_night) || 0,
      capacity: Number(roomForm.capacity) || 2,
      available_count: Number(roomForm.available_count) || 1,
      bed_type: roomForm.bed_type.trim(),
      size_sqm: Number(roomForm.size_sqm) || 0,
      images: roomForm.images.trim(),
      amenities: roomForm.amenities.trim(),
      status: roomForm.status,
    };
    try {
      if (roomForm.id) {
        await client.entities.rooms.update({ id: String(roomForm.id), data: payload });
        toast.success('Oda güncellendi.');
      } else {
        await client.entities.rooms.create({ data: payload });
        toast.success('Oda eklendi.');
      }
      setShowRoomForm(false);
      setRoomForm({ ...emptyRoomForm });
      loadData();
    } catch {
      toast.error('Oda kaydedilemedi.');
    }
  };

  const deleteRoom = async (id: number) => {
    try {
      await client.entities.rooms.delete({ id: String(id) });
      toast.success('Oda silindi.');
      loadData();
    } catch {
      toast.error('Oda silinemedi.');
    }
  };

  const upsertRate = async (date: string, data: Record<string, unknown>) => {
    if (!hotelId || !calendarRoomId) return;
    const existing = calendarMap.get(date);
    if (existing?.id) {
      await client.entities.rate_calendar.update({ id: String(existing.id), data });
    } else {
      await client.entities.rate_calendar.create({
        data: { hotel_id: hotelId, room_id: calendarRoomId, stay_date: date, ...data },
      });
    }
  };

  const applyBulk = async () => {
    if (!calendarRoomId) {
      toast.error('Önce bir oda tipi seçin.');
      return;
    }
    const dates: string[] = [];
    let cursor = bulk.start;
    let guard = 0;
    while (cursor <= bulk.end && guard < 180) {
      const day = new Date(`${cursor}T00:00:00`).getDay();
      if (!bulk.weekendOnly || day === 5 || day === 6) dates.push(cursor);
      cursor = addDays(cursor, 1);
      guard += 1;
    }
    if (!dates.length) {
      toast.error('Seçilen aralıkta uygun gün bulunamadı.');
      return;
    }
    const data: Record<string, unknown> = { is_closed: bulk.closed };
    if (bulk.price) data.price = Number(bulk.price);
    if (bulk.allotment) data.allotment = Number(bulk.allotment);
    if (bulk.minStay) data.min_stay = Number(bulk.minStay);
    try {
      for (const date of dates) {
        // Sıralı yazım: aynı gün için çift kayıt oluşmasını önler.
        // eslint-disable-next-line no-await-in-loop
        await upsertRate(date, data);
      }
      toast.success(`${dates.length} gün güncellendi.`);
      loadData();
    } catch {
      toast.error('Takvim güncellenemedi.');
    }
  };

  const quickRateUpdate = async (date: string, field: string, value: string) => {
    const parsed = field === 'is_closed' ? value === 'true' : Number(value);
    if (field !== 'is_closed' && !Number.isFinite(parsed as number)) return;
    try {
      await upsertRate(date, { [field]: parsed });
      loadData();
    } catch {
      toast.error('Gün güncellenemedi.');
    }
  };

  const createPromotion = async () => {
    if (!hotelId || !promoForm.title.trim()) {
      toast.error('Promosyon başlığı zorunludur.');
      return;
    }
    try {
      await client.entities.promotions.create({
        data: {
          hotel_id: hotelId,
          title: promoForm.title.trim(),
          promo_type: promoForm.promo_type,
          discount_type: promoForm.discount_type,
          discount_value: Number(promoForm.discount_value) || 0,
          promo_code: promoForm.promo_code.trim().toUpperCase(),
          start_date: promoForm.start_date || undefined,
          end_date: promoForm.end_date || undefined,
          min_nights: Number(promoForm.min_nights) || 1,
          is_active: true,
        },
      });
      toast.success('Fiyat planı oluşturuldu.');
      setPromoForm({ ...promoForm, title: '', promo_code: '' });
      loadData();
    } catch {
      toast.error('Plan oluşturulamadı.');
    }
  };

  const updateBookingStatus = async (booking: Booking, data: Record<string, unknown>) => {
    if (!booking.id) return;
    try {
      const res = await client.entities.bookings.update({ id: String(booking.id), data });
      if (!res?.data?.id) throw new Error('Güncelleme yanıtı doğrulanamadı.');
      await loadData();
      toast.success('Rezervasyon güncellendi ve kaydedildi.');
    } catch {
      toast.error('Güncelleme başarısız.');
    }
  };

  const replyReview = async (review: Review, reply: string) => {
    if (!review.id || !reply.trim()) return;
    await client.entities.reviews.update({
      id: String(review.id),
      data: { partner_reply: reply.trim() },
    });
    toast.success('Yanıtınız kaydedildi.');
    loadData();
  };

  const exportBookings = () => {
    downloadCsv('rezervasyonlar.csv', [
      ['PNR', 'Misafir', 'Telefon', 'Giriş', 'Çıkış', 'Tutar', 'Durum'],
      ...filteredBookings.map((b) => [
        b.booking_code,
        b.guest_name,
        b.guest_phone,
        b.check_in_date,
        b.check_out_date,
        b.total_price,
        b.booking_status,
      ]),
    ]);
  };

  /* ------------------------------- Stil ---------------------------------- */
  const input =
    'w-full h-11 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-amber-500';
  const area =
    'w-full min-h-[100px] p-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-amber-500';
  const label = 'text-[11px] font-bold text-slate-600 uppercase tracking-wider';
  const card = 'bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4';

  const setField = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  if (!session || (!isAdmin && !session.hotelId)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-6">
        <div className="text-center space-y-4">
          <p>Yönetim oturumu bulunamadı.</p>
          <Link to="/tesis">
            <Button className="bg-amber-500 text-slate-950 font-bold">Giriş Yap</Button>
          </Link>
        </div>
      </div>
    );
  }

  const listingStatus = hotel ? resolveListingStatus(hotel) : 'pending';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 text-white sticky top-0 z-40 border-b border-slate-800">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-700"
              aria-label="Menüyü aç"
            >
              <Menu className="w-5 h-5" />
            </button>
            <BrandLogo size={40} className="shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{hotel?.name || 'Tesis Yönetimi'}</p>
              <p className="text-[11px] text-slate-400">
                Yönetim Paneli ·{' '}
                {LISTING_STATUS_LABELS[listingStatus] || listingStatus}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={isAdmin ? '/yonetim/panel' : '/'}>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300 !bg-transparent !hover:bg-transparent text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> {isAdmin ? 'Admin' : 'Site'}
              </Button>
            </Link>
            <Button
              onClick={() => {
                logoutAdmin().then(() => navigate('/', { replace: true }));
              }}
              size="sm"
              variant="ghost"
              className="text-slate-300 hover:text-white text-xs"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sol menü */}
        <aside
          className={`${
            menuOpen ? 'block' : 'hidden'
          } lg:block w-full lg:w-72 shrink-0 bg-white border-r border-slate-200 lg:min-h-[calc(100vh-64px)] p-4 space-y-4 absolute lg:static z-30`}
        >
          {['Operasyon', 'Satış', 'Tesis'].map((group) => (
            <div key={group} className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                {group}
              </p>
              {SECTIONS.filter((s) => s.group === group).map((s) => (
                <button
                  key={s.key}
                  onClick={() => {
                    setSection(s.key);
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors min-h-[44px] ${
                    section === s.key
                      ? 'bg-slate-950 text-amber-400'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <s.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
          ))}
        </aside>

        <main className="flex-1 min-w-0 p-4 sm:p-6 space-y-5">
          {loading ? (
            <div className="py-24 flex justify-center">
              <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* GENEL BAKIŞ */}
              {section === 'overview' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label: 'Bugün Giriş', value: String(stats.arrivals), icon: CalendarCheck },
                      { label: 'Bugün Çıkış', value: String(stats.departures), icon: Clock },
                      { label: 'Doluluk', value: `%${stats.occupancy}`, icon: BedDouble },
                      {
                        label: 'Gelecek Rezervasyon',
                        value: String(stats.upcoming),
                        icon: CalendarRange,
                      },
                    ].map((c) => (
                      <div key={c.label} className="bg-white rounded-2xl border border-slate-200 p-4">
                        <c.icon className="w-5 h-5 text-amber-500" />
                        <p className="text-[11px] text-slate-500 font-bold uppercase mt-2">
                          {c.label}
                        </p>
                        <p className="text-2xl font-black">{c.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label: 'Toplam Ciro', value: formatPrice(stats.gross) },
                    ].map((c) => (
                      <div
                        key={c.label}
                        className="bg-slate-950 text-white rounded-2xl p-4 border border-slate-800"
                      >
                        <p className="text-[11px] text-slate-400 font-bold uppercase">{c.label}</p>
                        <p className="text-xl font-black text-amber-400 mt-1">{c.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid lg:grid-cols-3 gap-4">
                    <div className={card}>
                      <p className="font-bold text-slate-900">Yapılacaklar</p>
                      {todoItems.length === 0 ? (
                        <p className="text-sm text-emerald-600 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Tesis bilgileri eksiksiz.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {todoItems.map((t) => (
                            <li
                              key={t}
                              className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3"
                            >
                              {t}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className={`${card} lg:col-span-2`}>
                      <p className="font-bold text-slate-900">Son 30 Gün Performansı</p>
                      <div className="flex items-end gap-1.5 h-32">
                        {Array.from({ length: 30 }, (_, i) => {
                          const day = addDays(toISODate(new Date()), i - 29);
                          const revenue = activeBookings
                            .filter((b) => String(b.created_at || '').slice(0, 10) === day)
                            .reduce((s, b) => s + Number(b.total_price || 0), 0);
                          const max = Math.max(stats.gross / 8, 1);
                          const h = Math.max(Math.round((revenue / max) * 100), 4);
                          return (
                            <div
                              key={day}
                              title={`${formatTRDate(day)} · ${formatPrice(revenue)}`}
                              className="flex-1 rounded-t bg-amber-400/80 hover:bg-amber-500 transition-colors"
                              style={{ height: `${Math.min(h, 100)}%` }}
                            />
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Günlük rezervasyon cirosu (son 30 gün)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TESİS PROFİLİ */}
              {section === 'profile' && (
                <div className={card}>
                  <h2 className="text-lg font-black">Tesis Profili</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PROFILE_SELECTS.map(([key, lbl, options]) => (
                      <div key={key} className="space-y-1.5">
                        <label className={label}>{lbl}</label>
                        <select
                          className={input}
                          value={form[key] || options[0].value}
                          onChange={(e) => setField(key, e.target.value)}
                        >
                          {options.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                    {PROFILE_FIELDS.map(([key, lbl, ph]) => (
                      <div key={key} className="space-y-1.5">
                        <label className={label}>{lbl}</label>
                        <input
                          className={input}
                          placeholder={ph}
                          value={form[key] || ''}
                          onChange={(e) => setField(key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <label className={label}>Açık Adres</label>
                    <textarea
                      className={area}
                      value={form.address || ''}
                      onChange={(e) => setField('address', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={label}>Tesis Açıklaması</label>
                    <textarea
                      className={area}
                      value={form.description || ''}
                      onChange={(e) => setField('description', e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={saveProfile}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black min-h-[44px]"
                  >
                    <Save className="w-4 h-4 mr-2" /> Profili Kaydet
                  </Button>
                </div>
              )}

              {/* OLANAKLAR */}
              {section === 'amenities' && (
                <div className={card}>
                  <h2 className="text-lg font-black">Olanaklar & Hizmetler</h2>
                  {AMENITY_GROUPS.map((g) => (
                    <div key={g.title} className="space-y-2">
                      <p className={label}>{g.title}</p>
                      <div className="flex flex-wrap gap-2">
                        {g.items.map((item) => {
                          const active = amenities.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() =>
                                setAmenities((prev) =>
                                  prev.includes(item)
                                    ? prev.filter((a) => a !== item)
                                    : [...prev, item],
                                )
                              }
                              className={`px-3 py-2 rounded-lg text-xs font-semibold border min-h-[42px] ${
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
                  ))}
                  <div className="space-y-2">
                    <p className={label}>Diğer Olanaklar</p>
                    <div className="flex flex-wrap gap-2">
                      {AMENITY_OPTIONS.filter(
                        (a) => !AMENITY_GROUPS.some((g) => g.items.includes(a)),
                      ).map((item) => {
                        const active = amenities.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() =>
                              setAmenities((prev) =>
                                prev.includes(item)
                                  ? prev.filter((a) => a !== item)
                                  : [...prev, item],
                              )
                            }
                            className={`px-3 py-2 rounded-lg text-xs font-semibold border min-h-[42px] ${
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
                  <Button
                    onClick={saveAmenities}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black min-h-[44px]"
                  >
                    <Save className="w-4 h-4 mr-2" /> Olanakları Kaydet
                  </Button>
                </div>
              )}

              {/* GALERİ */}
              {section === 'gallery' && (
                <div className={card}>
                  <h2 className="text-lg font-black">Fotoğraf & Galeri</h2>
                  <p className="text-xs text-slate-500">
                    Fotoğrafları bilgisayarınızdan yükleyin. İlk sıradaki görsel kapak olarak
                    kullanılır; sıralamayı ok butonlarıyla değiştirebilirsiniz.
                  </p>
                  <MediaUploader
                    label="Tesis Fotoğrafları"
                    prefix={`hotel-${hotelId}/gallery`}
                    value={gallery}
                    onChange={saveGallery}
                  />
                </div>
              )}

              {/* ODALAR */}
              {section === 'rooms' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-black">Oda Tipleri ({rooms.length})</h2>
                    <Button
                      onClick={() => {
                        setRoomForm({ ...emptyRoomForm });
                        setShowRoomForm(true);
                      }}
                      className="bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold min-h-[44px]"
                    >
                      <Plus className="w-4 h-4 mr-1.5" /> Oda Tipi Ekle
                    </Button>
                  </div>

                  {showRoomForm && (
                    <div className="bg-white rounded-2xl border border-amber-300 p-5 space-y-4">
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(
                          [
                            ['name', 'Oda Adı *', 'text'],
                            ['room_type', 'Oda Tipi', 'text'],
                            ['bed_type', 'Yatak Düzeni', 'text'],
                            ['price_per_night', 'Taban Fiyat (₺) *', 'number'],
                            ['discounted_price', 'İndirimli Fiyat (₺)', 'number'],
                            ['capacity', 'Maks. Kişi', 'number'],
                            ['available_count', 'Oda Adedi (Stok)', 'number'],
                            ['size_sqm', 'Büyüklük (m²)', 'number'],
                          ] as const
                        ).map(([key, lbl, type]) => (
                          <div key={key} className="space-y-1.5">
                            <label className={label}>{lbl}</label>
                            <input
                              type={type}
                              className={input}
                              value={(roomForm as Record<string, string | number>)[key] as string}
                              onChange={(e) => setRoomForm({ ...roomForm, [key]: e.target.value })}
                            />
                          </div>
                        ))}
                        <div className="space-y-1.5">
                          <label className={label}>Durum</label>
                          <select
                            className={input}
                            value={roomForm.status}
                            onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
                          >
                            <option value="active">Aktif</option>
                            <option value="inactive">Pasif</option>
                          </select>
                        </div>
                      </div>
                      <textarea
                        className={area}
                        placeholder="Oda açıklaması"
                        value={roomForm.description}
                        onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                      />
                      <MediaUploader
                        label="Oda Fotoğrafları"
                        prefix={`hotel-${hotelId}/rooms`}
                        value={parseList(roomForm.images)}
                        onChange={(next) =>
                          setRoomForm({ ...roomForm, images: serializeList(next) })
                        }
                      />
                      <div className="space-y-2">
                        <p className={label}>Oda İçi Olanaklar</p>
                        <div className="flex flex-wrap gap-2">
                          {ROOM_AMENITY_OPTIONS.map((item) => {
                            const list = parseList(roomForm.amenities);
                            const active = list.includes(item);
                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() =>
                                  setRoomForm({
                                    ...roomForm,
                                    amenities: serializeList(
                                      active ? list.filter((a) => a !== item) : [...list, item],
                                    ),
                                  })
                                }
                                className={`px-3 py-2 rounded-lg text-xs font-semibold border min-h-[42px] ${
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
                      <div className="flex gap-2">
                        <Button
                          onClick={saveRoom}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black min-h-[44px]"
                        >
                          <Save className="w-4 h-4 mr-2" /> Kaydet
                        </Button>
                        <Button
                          variant="outline"
                          className="!bg-transparent !hover:bg-transparent border-slate-300 min-h-[44px]"
                          onClick={() => setShowRoomForm(false)}
                        >
                          Vazgeç
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    {rooms.map((r) => (
                      <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                        <div className="flex justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-black truncate">{r.name}</p>
                            <p className="text-xs text-slate-500">
                              {r.room_type} · {r.capacity} kişi · {r.available_count || 1} oda stok
                            </p>
                          </div>
                          <p className="font-black text-amber-600 shrink-0">
                            {formatPrice(r.price_per_night)}
                          </p>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">{r.description}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setRoomForm({
                                id: Number(r.id),
                                name: r.name || '',
                                room_type: r.room_type || 'Standart',
                                description: r.description || '',
                                price_per_night: String(r.price_per_night || ''),
                                discounted_price: String(r.discounted_price || ''),
                                capacity: String(r.capacity || 2),
                                available_count: String(r.available_count || 1),
                                bed_type: r.bed_type || '',
                                size_sqm: String(r.size_sqm || ''),
                                images: r.images || '',
                                amenities: r.amenities || '',
                                status: r.status || 'active',
                              });
                              setShowRoomForm(true);
                            }}
                            className="bg-slate-950 text-amber-400 font-bold text-xs min-h-[40px]"
                          >
                            Düzenle
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => deleteRoom(Number(r.id))}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs min-h-[40px]"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Sil
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAKVİM */}
              {section === 'calendar' && (
                <div className="space-y-4">
                  <div className={card}>
                    <h2 className="text-lg font-black">Fiyat & Müsaitlik Takvimi</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="space-y-1.5">
                        <label className={label}>Oda Tipi</label>
                        <select
                          className={input}
                          value={calendarRoomId}
                          onChange={(e) => setCalendarRoomId(Number(e.target.value))}
                        >
                          <option value={0}>Seçiniz</option>
                          {rooms.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className={label}>Ay</label>
                        <input
                          type="month"
                          className={input}
                          value={monthStart.slice(0, 7)}
                          onChange={(e) => setMonthStart(`${e.target.value}-01`)}
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-4 space-y-3">
                      <p className={label}>Toplu Güncelleme</p>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <input
                          type="date"
                          className={input}
                          value={bulk.start}
                          onChange={(e) => setBulk({ ...bulk, start: e.target.value })}
                        />
                        <input
                          type="date"
                          className={input}
                          value={bulk.end}
                          onChange={(e) => setBulk({ ...bulk, end: e.target.value })}
                        />
                        <input
                          className={input}
                          placeholder="Fiyat (₺)"
                          value={bulk.price}
                          onChange={(e) => setBulk({ ...bulk, price: e.target.value })}
                        />
                        <input
                          className={input}
                          placeholder="Müsait oda adedi"
                          value={bulk.allotment}
                          onChange={(e) => setBulk({ ...bulk, allotment: e.target.value })}
                        />
                        <input
                          className={input}
                          placeholder="Min. konaklama"
                          value={bulk.minStay}
                          onChange={(e) => setBulk({ ...bulk, minStay: e.target.value })}
                        />
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={bulk.closed}
                            onChange={(e) => setBulk({ ...bulk, closed: e.target.checked })}
                          />
                          Satışa Kapat (stop-sale)
                        </label>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={bulk.weekendOnly}
                            onChange={(e) => setBulk({ ...bulk, weekendOnly: e.target.checked })}
                          />
                          Sadece hafta sonu
                        </label>
                        <Button
                          onClick={applyBulk}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black min-h-[44px]"
                        >
                          Aralığa Uygula
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className={card}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                      {monthDays.map((d) => {
                        const entry = calendarMap.get(d);
                        const room = rooms.find((r) => Number(r.id) === Number(calendarRoomId));
                        const price = entry?.price ?? room?.price_per_night ?? 0;
                        return (
                          <div
                            key={d}
                            className={`rounded-xl border p-2 text-[11px] space-y-1 ${
                              entry?.is_closed
                                ? 'bg-red-50 border-red-200'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <p className="font-black text-slate-900">{d.slice(8)}</p>
                            <input
                              className="w-full h-8 px-1.5 rounded border border-slate-300 text-[11px]"
                              defaultValue={price ? String(price) : ''}
                              placeholder="Fiyat"
                              onBlur={(e) =>
                                e.target.value && quickRateUpdate(d, 'price', e.target.value)
                              }
                            />
                            <input
                              className="w-full h-8 px-1.5 rounded border border-slate-300 text-[11px]"
                              defaultValue={
                                entry?.allotment !== undefined && entry?.allotment !== null
                                  ? String(entry.allotment)
                                  : ''
                              }
                              placeholder="Stok"
                              onBlur={(e) =>
                                e.target.value && quickRateUpdate(d, 'allotment', e.target.value)
                              }
                            />
                            <button
                              onClick={() =>
                                quickRateUpdate(d, 'is_closed', String(!entry?.is_closed))
                              }
                              className={`w-full py-1 rounded font-bold ${
                                entry?.is_closed
                                  ? 'bg-red-500 text-white'
                                  : 'bg-emerald-500 text-white'
                              }`}
                            >
                              {entry?.is_closed ? 'Kapalı' : 'Açık'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* PROMOSYON */}
              {section === 'promotions' && (
                <div className="space-y-4">
                  <div className={card}>
                    <h2 className="text-lg font-black">Yeni Fiyat Planı / Promosyon</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <input
                        className={input}
                        placeholder="Başlık *"
                        value={promoForm.title}
                        onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                      />
                      <select
                        className={input}
                        value={promoForm.promo_type}
                        onChange={(e) => setPromoForm({ ...promoForm, promo_type: e.target.value })}
                      >
                        <option value="general">Genel Plan</option>
                        <option value="early_bird">Erken Rezervasyon</option>
                        <option value="last_minute">Son Dakika</option>
                        <option value="coupon">Kupon Kodu</option>
                      </select>
                      <select
                        className={input}
                        value={promoForm.discount_type}
                        onChange={(e) =>
                          setPromoForm({ ...promoForm, discount_type: e.target.value })
                        }
                      >
                        <option value="percent">Yüzde (%)</option>
                        <option value="amount">Tutar (₺)</option>
                      </select>
                      <input
                        className={input}
                        placeholder="İndirim değeri"
                        value={promoForm.discount_value}
                        onChange={(e) =>
                          setPromoForm({ ...promoForm, discount_value: e.target.value })
                        }
                      />
                      <input
                        className={input}
                        placeholder="Kupon kodu (opsiyonel)"
                        value={promoForm.promo_code}
                        onChange={(e) => setPromoForm({ ...promoForm, promo_code: e.target.value })}
                      />
                      <input
                        type="date"
                        className={input}
                        value={promoForm.start_date}
                        onChange={(e) => setPromoForm({ ...promoForm, start_date: e.target.value })}
                      />
                      <input
                        type="date"
                        className={input}
                        value={promoForm.end_date}
                        onChange={(e) => setPromoForm({ ...promoForm, end_date: e.target.value })}
                      />
                      <input
                        className={input}
                        placeholder="Min. gece"
                        value={promoForm.min_nights}
                        onChange={(e) => setPromoForm({ ...promoForm, min_nights: e.target.value })}
                      />
                    </div>
                    <Button
                      onClick={createPromotion}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black min-h-[44px]"
                    >
                      <Plus className="w-4 h-4 mr-1.5" /> Planı Oluştur
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {promotions.map((p) => (
                      <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
                        <div className="flex justify-between gap-3">
                          <p className="font-black">{p.title}</p>
                          <span
                            className={`px-2 py-1 rounded text-[10px] font-black ${
                              p.is_active
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {p.is_active ? 'AKTİF' : 'PASİF'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          {p.discount_type === 'percent'
                            ? `%${p.discount_value} indirim`
                            : `${formatPrice(p.discount_value)} indirim`}
                          {p.promo_code ? ` · Kod: ${p.promo_code}` : ''}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatTRDate(p.start_date)} → {formatTRDate(p.end_date)}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-slate-950 text-amber-400 text-xs min-h-[40px]"
                            onClick={async () => {
                              await client.entities.promotions.update({
                                id: String(p.id),
                                data: { is_active: !p.is_active },
                              });
                              loadData();
                            }}
                          >
                            {p.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white text-xs min-h-[40px]"
                            onClick={async () => {
                              await client.entities.promotions.delete({ id: String(p.id) });
                              toast.success('Plan silindi.');
                              loadData();
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* REZERVASYONLAR */}
              {section === 'bookings' && (
                <div className="space-y-4">
                  <div className={card}>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        className={input}
                        placeholder="Misafir adı, PNR, telefon ara"
                        value={bookingFilter.search}
                        onChange={(e) =>
                          setBookingFilter({ ...bookingFilter, search: e.target.value })
                        }
                      />
                      <select
                        className={input}
                        value={bookingFilter.status}
                        onChange={(e) =>
                          setBookingFilter({ ...bookingFilter, status: e.target.value })
                        }
                      >
                        <option value="all">Tüm Durumlar</option>
                        <option value="pending">Bekliyor</option>
                        <option value="confirmed">Onaylı</option>
                        <option value="checked_in">Giriş Yaptı</option>
                        <option value="completed">Tamamlandı</option>
                        <option value="cancelled">İptal</option>
                        <option value="no_show">Gelmedi</option>
                      </select>
                      <Button
                        onClick={exportBookings}
                        className="bg-slate-950 text-amber-400 font-bold min-h-[44px]"
                      >
                        <Download className="w-4 h-4 mr-1.5" /> CSV
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredBookings.length === 0 && (
                      <p className="text-sm text-slate-500">Kayıt bulunamadı.</p>
                    )}
                    {filteredBookings.map((b) => (
                      <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                        <div className="flex flex-wrap justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-black">
                              {b.guest_name}{' '}
                              <span className="text-xs text-slate-500">({b.booking_code})</span>
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatTRDate(b.check_in_date)} → {formatTRDate(b.check_out_date)} ·{' '}
                              {b.night_count} gece
                            </p>
                            <p className="text-xs text-slate-500">
                              {b.guest_phone} · {b.guest_email}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-black">{formatPrice(b.total_price)}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[
                            ['confirmed', 'Onayla'],
                            ['checked_in', 'Giriş'],
                            ['completed', 'Tamamla'],
                            ['no_show', 'Gelmedi'],
                            ['cancelled', 'İptal'],
                          ].map(([value, text]) => (
                            <Button
                              key={value}
                              size="sm"
                              onClick={() => updateBookingStatus(b, { booking_status: value })}
                              className={`text-xs min-h-[40px] ${
                                b.booking_status === value
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-slate-950 text-white'
                              }`}
                            >
                              {text}
                            </Button>
                          ))}
                          <Button
                            size="sm"
                            onClick={() => updateBookingStatus(b, { payment_status: 'completed' })}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs min-h-[40px]"
                          >
                            Ödendi İşaretle
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FİNANS */}
              {section === 'policies' && (
                <div className={card}>
                  <h2 className="text-lg font-black">Politikalar & Kurallar</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className={label}>Giriş Saati</label>
                      <select
                        className={input}
                        value={form.check_in_time || '14:00'}
                        onChange={(e) => setField('check_in_time', e.target.value)}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className={label}>Çıkış Saati</label>
                      <select
                        className={input}
                        value={form.check_out_time || '12:00'}
                        onChange={(e) => setField('check_out_time', e.target.value)}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className={label}>İptal Politikası Tipi</label>
                      <select
                        className={input}
                        value={form.cancellation_type || 'moderate'}
                        onChange={(e) => {
                          const preset = CANCELLATION_PRESETS.find(
                            (p) => p.value === e.target.value,
                          );
                          setForm((prev) => ({
                            ...prev,
                            cancellation_type: e.target.value,
                            cancellation_policy: preset ? preset.label : prev.cancellation_policy,
                          }));
                        }}
                      >
                        {CANCELLATION_PRESETS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {(
                    [
                      ['cancellation_policy', 'İptal Politikası (kademeli)'],
                      ['child_policy', 'Çocuk & Ekstra Yatak Politikası'],
                      ['pet_policy', 'Evcil Hayvan & Sigara Politikası'],
                      ['deposit_policy', 'Depozito Politikası'],
                      ['house_rules', 'Tesis Kuralları'],
                    ] as const
                  ).map(([key, lbl]) => (
                    <div key={key} className="space-y-1.5">
                      <label className={label}>{lbl}</label>
                      <textarea
                        className={area}
                        value={form[key] || ''}
                        onChange={(e) => setField(key, e.target.value)}
                      />
                    </div>
                  ))}
                  <div className="space-y-2">
                    <p className={label}>Kabul Edilen Ödeme Yöntemleri</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([value, lbl]) => {
                        const active = paymentMethods.includes(value);
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setPaymentMethods((prev) =>
                                prev.includes(value)
                                  ? prev.filter((a) => a !== value)
                                  : [...prev, value],
                              )
                            }
                            className={`px-4 py-2 rounded-lg text-xs font-bold border min-h-[42px] ${
                              active
                                ? 'bg-slate-950 border-slate-950 text-amber-400'
                                : 'bg-white border-slate-300 text-slate-600'
                            }`}
                          >
                            {lbl}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Button
                    onClick={savePolicies}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black min-h-[44px]"
                  >
                    <Save className="w-4 h-4 mr-2" /> Politikaları Kaydet
                  </Button>
                </div>
              )}

              {/* YORUMLAR */}
              {section === 'reviews' && (
                <div className="space-y-4">
                  <div className={card}>
                    <h2 className="text-lg font-black">Misafir Puanı</h2>
                    <p className="text-3xl font-black text-amber-500">
                      {(
                        reviews.reduce((s, r) => s + Number(r.rating || 0), 0) /
                        (reviews.length || 1)
                      ).toFixed(1)}{' '}
                      <span className="text-base text-slate-500">/ 5</span>
                    </p>
                    <p className="text-xs text-slate-500">{reviews.length} değerlendirme</p>
                  </div>
                  {reviews.map((r) => (
                    <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
                      <div className="flex justify-between">
                        <p className="font-bold">{r.guest_name}</p>
                        <p className="text-amber-500 font-black">{r.rating}/5</p>
                      </div>
                      <p className="text-sm text-slate-600">{r.comment}</p>
                      {r.partner_reply && (
                        <p className="text-xs bg-slate-100 rounded-xl p-3">
                          <strong>Yanıtınız:</strong> {r.partner_reply}
                        </p>
                      )}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const el = (e.currentTarget.elements.namedItem(
                            'reply',
                          ) as HTMLInputElement) || null;
                          if (el) {
                            replyReview(r, el.value);
                            el.value = '';
                          }
                        }}
                        className="flex flex-col sm:flex-row gap-2"
                      >
                        <input name="reply" className={input} placeholder="Yorumu yanıtlayın" />
                        <Button
                          type="submit"
                          className="bg-slate-950 text-amber-400 font-bold min-h-[44px]"
                        >
                          Yanıtla
                        </Button>
                      </form>
                    </div>
                  ))}
                </div>
              )}

              {/* AYARLAR */}
              {section === 'settings' && (
                <div className={card}>
                  <h2 className="text-lg font-black">Hesap & Kullanıcı Bilgileri</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {(
                      [
                        ['owner_name', 'Yetkili Adı'],
                        ['owner_email', 'Giriş E-postası'],
                        ['owner_phone', 'Yetkili Telefonu'],
                      ] as const
                    ).map(([key, lbl]) => (
                      <div key={key} className="space-y-1.5">
                        <label className={label}>{lbl}</label>
                        <input
                          className={input}
                          value={form[key] || ''}
                          onChange={(e) => setField(key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={saveAccount}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black min-h-[44px]"
                  >
                    <Save className="w-4 h-4 mr-2" /> Kaydet
                  </Button>

                  <div className="pt-6 mt-6 border-t border-slate-200">
                    <BankAccountsEditor
                      accounts={hotelBankAccounts}
                      onChange={setHotelBankAccounts}
                      onSave={saveHotelBanks}
                      title="Tesis Banka Hesapları (Havale / EFT)"
                      description="Misafirler havale/EFT ile ödeme yaparken burada tanımladığınız hesapları görür. IBAN formatı: TR + 24 rakam."
                      saveLabel="Tesis Hesaplarını Kaydet"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default PropertyManager;
