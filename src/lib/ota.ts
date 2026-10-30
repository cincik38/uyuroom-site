/**
 * UYUROOM OTA çekirdek katmanı.
 * Rol bazlı oturum yönetimi, komisyon hesaplama, fiyat/müsaitlik takvimi
 * yardımcıları ve pazar yeri sabitlerini içerir.
 */
import { supabase } from '@/lib/supabase';
import type {
  Hotel,
  Promotion,
  RateCalendarEntry,
  Room,
} from '@/lib/types';

/* ------------------------------------------------------------------ */
/* Sabitler                                                            */
/* ------------------------------------------------------------------ */

export const SUPER_ADMIN_EMAIL = 'g.cincik@gmail.com';

export const SESSION_KEY = 'uyuroom_ota_session';
export const FAVORITES_KEY = 'uyuroom_favorites';
export const RECENT_KEY = 'uyuroom_recent_properties';

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  hotel: 'Otel',
  apart: 'Apart / Daire',
  pansiyon: 'Pansiyon',
  villa: 'Villa',
  butik: 'Butik Otel',
  hostel: 'Hostel',
};

export const AMENITY_OPTIONS = [
  'Ücretsiz Wi-Fi',
  'Ücretsiz Otopark',
  'Kahvaltı Dahil',
  'Klima',
  '7/24 Resepsiyon',
  'Asansör',
  'Havuz',
  'Spa & Hamam',
  'Fitness Salonu',
  'Restoran',
  'Bar',
  'Toplantı Salonu',
  'Aile Odaları',
  'Engelli Erişimi',
  'Evcil Hayvan Kabul',
  'Havalimanı Servisi',
  'Çamaşırhane',
  'Oda Servisi',
];

export const ROOM_AMENITY_OPTIONS = [
  'Çift Kişilik Yatak',
  'Şehir Manzarası',
  'Minibar',
  'Kasa',
  'Duş',
  'Küvet',
  'Saç Kurutma Makinesi',
  'Smart TV',
  'Çalışma Masası',
  'Balkon',
  'Mutfak / Ankastre',
  'Ütü',
];

export const TR_CITIES = [
  'Adana',
  'Adıyaman',
  'Afyonkarahisar',
  'Ankara',
  'Antalya',
  'Aydın',
  'Balıkesir',
  'Bursa',
  'Denizli',
  'Diyarbakır',
  'Edirne',
  'Erzurum',
  'Eskişehir',
  'Gaziantep',
  'Hatay',
  'Isparta',
  'İstanbul',
  'İzmir',
  'Kayseri',
  'Kocaeli',
  'Konya',
  'Kütahya',
  'Malatya',
  'Manisa',
  'Mardin',
  'Mersin',
  'Muğla',
  'Nevşehir',
  'Ordu',
  'Rize',
  'Sakarya',
  'Samsun',
  'Şanlıurfa',
  'Trabzon',
  'Uşak',
  'Van',
  'Yalova',
  'Zonguldak',
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pay_at_hotel: 'Kapıda Ödeme',
  bank_transfer: 'Havale / EFT',
  credit_card: 'Online Kredi Kartı',
};

/* ------------------------------------------------------------------ */
/* Oturum & Roller                                                     */
/* ------------------------------------------------------------------ */

export type OtaRole = 'super_admin' | 'partner' | 'reklam';

export interface OtaSession {
  role: OtaRole;
  email: string;
  name: string;
  hotelId?: number;
  loggedAt: string;
}

/** Role göre giriş sonrası ilk sayfa */
export const homeForRole = (role: OtaRole): string => (role === 'reklam' ? '/yonetim/reklam' : '/yonetim/panel');

export function getSession(): OtaSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OtaSession;
    if (!parsed?.role || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setSession(session: OtaSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('uyuroom-session-change'));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('uyuroom-session-change'));
}

export interface LoginResult {
  ok: boolean;
  session?: OtaSession;
  error?: string;
}

/** Yönetici girişi: Supabase Auth (e-posta + şifre). Yetki sunucuda (RLS) doğrulanır. */
export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<LoginResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error || !data.user) {
    return { ok: false, error: 'E-posta veya şifre hatalı.' };
  }
  const { data: isAdmin } = await supabase.rpc('is_admin');
  let role: OtaRole = 'super_admin';
  let name = 'Yönetici';
  if (!isAdmin) {
    // Reklam yetkilisi: yalnızca takip kodları sayfasını görür
    const { data: isMarketing } = await supabase.rpc('is_marketing');
    if (!isMarketing) {
      await supabase.auth.signOut();
      return { ok: false, error: 'Bu hesabın yönetim yetkisi yok.' };
    }
    role = 'reklam';
    name = 'Reklam';
  }
  const session: OtaSession = {
    role,
    email: data.user.email || email,
    name,
    loggedAt: new Date().toISOString(),
  };
  setSession(session);
  return { ok: true, session };
}

/** Yönetim oturumu en fazla bu kadar açık kalır; sonra yeniden şifre istenir. */
export const ADMIN_SESSION_MAX_HOURS = 12;

/**
 * Oturumu ve rolü sunucudan doğrular. Tarayıcıda saklanan bilgiye güvenilmez:
 * jeton Supabase'e sorulur, rol is_admin / is_marketing fonksiyonlarından alınır,
 * son girişten bu yana süre sınırı aşıldıysa oturum kapatılır.
 */
export async function verifyAdminSession(): Promise<OtaSession | null> {
  const fail = async () => {
    await supabase.auth.signOut().catch(() => undefined);
    clearSession();
    return null;
  };
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    clearSession();
    return null;
  }
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData.user) return fail();

  const signedInAt = userData.user.last_sign_in_at ? new Date(userData.user.last_sign_in_at).getTime() : 0;
  if (!signedInAt || Date.now() - signedInAt > ADMIN_SESSION_MAX_HOURS * 3600 * 1000) return fail();

  const { data: isAdmin } = await supabase.rpc('is_admin');
  let role: OtaRole | null = isAdmin ? 'super_admin' : null;
  if (!role) {
    const { data: isMarketing } = await supabase.rpc('is_marketing');
    if (isMarketing) role = 'reklam';
  }
  if (!role) return fail();

  const session: OtaSession = {
    role,
    email: userData.user.email || '',
    name: role === 'reklam' ? 'Reklam' : 'Yönetici',
    loggedAt: new Date(signedInAt).toISOString(),
  };
  setSession(session);
  return session;
}

export async function logoutAdmin(): Promise<void> {
  await supabase.auth.signOut();
  clearSession();
}

/* ------------------------------------------------------------------ */
/* Listeleme durumu                                                    */
/* ------------------------------------------------------------------ */

export function resolveListingStatus(hotel: Hotel): string {
  return (hotel.status || 'active') === 'inactive' ? 'suspended' : 'approved';
}

export function isPubliclyListed(hotel: Hotel): boolean {
  return (hotel.status || 'active') !== 'inactive';
}

export const LISTING_STATUS_LABELS: Record<string, string> = {
  approved: 'Yayında',
  suspended: 'Askıda',
};

/* ------------------------------------------------------------------ */
/* Liste / CSV yardımcıları                                            */
/* ------------------------------------------------------------------ */

export function parseList(value?: string | null): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v)).filter(Boolean);
    } catch {
      /* CSV olarak devam et */
    }
  }
  return trimmed
    .split(/[,\n|]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export function serializeList(items: string[]): string {
  return items.filter(Boolean).join(', ');
}

export function resolvePaymentMethods(hotel?: Hotel | null): string[] {
  const parsed = parseList(hotel?.payment_methods);
  const valid = parsed.filter((m) => m in PAYMENT_METHOD_LABELS);
  return valid.length ? valid : ['pay_at_hotel', 'bank_transfer'];
}

/* ------------------------------------------------------------------ */
/* Tarih yardımcıları                                                  */
/* ------------------------------------------------------------------ */

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`${checkIn}T00:00:00`).getTime();
  const end = new Date(`${checkOut}T00:00:00`).getTime();
  const diff = Math.round((end - start) / 86400000);
  return diff > 0 ? diff : 0;
}

/** Konaklama gecelerinin tarih listesi (çıkış günü dahil değil). */
export function stayDates(checkIn: string, checkOut: string): string[] {
  const count = nightsBetween(checkIn, checkOut);
  const dates: string[] = [];
  for (let i = 0; i < count; i += 1) dates.push(addDays(checkIn, i));
  return dates;
}

export function formatTRDate(value?: string): string {
  if (!value) return '-';
  const d = new Date(value.length > 10 ? value : `${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function formatPrice(value?: number | null): string {
  const amount = Number(value || 0);
  return `₺${amount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;
}

/* ------------------------------------------------------------------ */
/* Fiyat & müsaitlik                                                   */
/* ------------------------------------------------------------------ */

export interface StayQuote {
  nights: number;
  nightlyPrices: { date: string; price: number }[];
  baseTotal: number;
  available: boolean;
  unavailableReason?: string;
  averageNightly: number;
  minStayRequired: number;
}

/**
 * Oda ve tarih bazlı takvim kayıtlarından konaklama fiyatını hesaplar.
 * Takvimde kayıt yoksa odanın varsayılan fiyatı kullanılır.
 */
export function quoteStay(
  room: Room,
  checkIn: string,
  checkOut: string,
  calendar: RateCalendarEntry[] = [],
  roomCount = 1,
): StayQuote {
  const dates = stayDates(checkIn, checkOut);
  const basePrice = Number(room.discounted_price || room.price_per_night || 0);
  const byDate = new Map<string, RateCalendarEntry>();
  calendar
    .filter((c) => Number(c.room_id) === Number(room.id))
    .forEach((c) => byDate.set(String(c.stay_date).slice(0, 10), c));

  let available = true;
  let unavailableReason: string | undefined;
  let minStayRequired = 1;
  const nightlyPrices: { date: string; price: number }[] = [];

  dates.forEach((date) => {
    const entry = byDate.get(date);
    const price = Number(entry?.price ?? basePrice) || basePrice;
    nightlyPrices.push({ date, price });

    if (entry?.is_closed) {
      available = false;
      unavailableReason = `${formatTRDate(date)} tarihinde satış kapalı.`;
    }
    const allotment = entry?.allotment;
    if (allotment !== undefined && allotment !== null && Number(allotment) < roomCount) {
      available = false;
      unavailableReason = `${formatTRDate(date)} için yeterli oda kalmadı.`;
    }
    if (entry?.min_stay && Number(entry.min_stay) > minStayRequired) {
      minStayRequired = Number(entry.min_stay);
    }
  });

  if (dates.length && dates.length < minStayRequired) {
    available = false;
    unavailableReason = `Bu tarihler için minimum ${minStayRequired} gece konaklama gerekiyor.`;
  }

  const baseTotal = nightlyPrices.reduce((sum, n) => sum + n.price, 0) * roomCount;
  const averageNightly = dates.length ? baseTotal / (dates.length * roomCount) : basePrice;

  return {
    nights: dates.length,
    nightlyPrices,
    baseTotal,
    available: dates.length ? available : true,
    unavailableReason,
    averageNightly,
    minStayRequired,
  };
}

/* ------------------------------------------------------------------ */
/* Promosyon & komisyon                                                */
/* ------------------------------------------------------------------ */

export interface AppliedPromotion {
  promotion: Promotion;
  discountAmount: number;
}

export function findApplicablePromotions(
  promotions: Promotion[],
  hotelId: number,
  checkIn: string,
  nights: number,
): Promotion[] {
  const today = toISODate(new Date());
  return promotions.filter((p) => {
    if (Number(p.hotel_id) !== Number(hotelId)) return false;
    if (p.is_active === false) return false;
    if (p.start_date && checkIn && checkIn < String(p.start_date).slice(0, 10)) return false;
    if (p.end_date && checkIn && checkIn > String(p.end_date).slice(0, 10)) return false;
    if (p.min_nights && nights < Number(p.min_nights)) return false;
    if (p.promo_type === 'early_bird' && checkIn) {
      const lead = nightsBetween(today, checkIn);
      if (lead < 21) return false;
    }
    if (p.promo_type === 'last_minute' && checkIn) {
      const lead = nightsBetween(today, checkIn);
      if (lead > 3) return false;
    }
    return true;
  });
}

export function computeDiscount(promotion: Promotion, baseTotal: number): number {
  if (!promotion) return 0;
  const value = Number(promotion.discount_value || 0);
  if (promotion.discount_type === 'percent') {
    return Math.round((baseTotal * value) / 100);
  }
  return Math.min(Math.round(value), baseTotal);
}

/**
 * Otomatik indirim: kupon kodu gerektirmeyen promosyonlar arasından en avantajlısı.
 */
export function bestAutoPromotion(
  promotions: Promotion[],
  hotelId: number,
  checkIn: string,
  nights: number,
  baseTotal: number,
): AppliedPromotion | null {
  const candidates = findApplicablePromotions(promotions, hotelId, checkIn, nights).filter(
    (p) => !p.promo_code,
  );
  let best: AppliedPromotion | null = null;
  candidates.forEach((promotion) => {
    const discountAmount = computeDiscount(promotion, baseTotal);
    if (discountAmount > 0 && (!best || discountAmount > best.discountAmount)) {
      best = { promotion, discountAmount };
    }
  });
  return best;
}

export function resolveCouponPromotion(
  promotions: Promotion[],
  hotelId: number,
  code: string,
  checkIn: string,
  nights: number,
): Promotion | null {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  return (
    findApplicablePromotions(promotions, hotelId, checkIn, nights).find(
      (p) => (p.promo_code || '').trim().toUpperCase() === normalized,
    ) || null
  );
}

/* ------------------------------------------------------------------ */
/* Favoriler & son görüntülenenler                                     */
/* ------------------------------------------------------------------ */

function readIdList(key: string): number[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function getFavorites(): number[] {
  return readIdList(FAVORITES_KEY);
}

export function toggleFavorite(hotelId: number): number[] {
  const current = getFavorites();
  const next = current.includes(hotelId)
    ? current.filter((id) => id !== hotelId)
    : [hotelId, ...current];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('uyuroom-favorites-change'));
  return next;
}

export function getRecentProperties(): number[] {
  return readIdList(RECENT_KEY);
}

export function pushRecentProperty(hotelId: number): void {
  const next = [hotelId, ...getRecentProperties().filter((id) => id !== hotelId)].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

/* ------------------------------------------------------------------ */
/* Rezervasyon kodu                                                    */
/* ------------------------------------------------------------------ */

export function generateBookingCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'UY';
  for (let i = 0; i < 3; i += 1) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  code += String(Math.floor(1000 + Math.random() * 9000));
  return code;
}

/** CSV dışa aktarma yardımcısı. */
export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const content = rows
    .map((row) =>
      row
        .map((cell) => {
          const text = String(cell ?? '');
          return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(';'),
    )
    .join('\n');
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}