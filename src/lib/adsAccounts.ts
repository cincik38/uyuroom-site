/**
 * İki Google Ads hesabı: mevcut (varsayılan) hesap ve isteğe bağlı Uşak hesabı.
 *
 * Mevcut hesabın dönüşümleri aynen durur. Uşak hesabının etiketi doluysa, Uşak'a ait
 * dönüşüm o etikete de gönderilir (ayrı bir send_to). Adana olayı Uşak hesabına gitmez.
 *
 * Ortak sayfalarda (ana sayfa, iletişim, menü, alt bilgi) tıklanan numara esas alınır:
 * 0553 122 22 79 ve Uşak WhatsApp hattı Uşak sayılır, Adana numarası sayılmaz.
 * Numara ayırt edilemiyorsa yalnızca Uşak sayfası (/tesis/2, Uşak odası, hotel_id=2
 * rezervasyonu, yalnızca Uşak'ı anlatan blog yazısı) Uşak hesabına yazılır.
 */
import { BRANCH_CONTACTS } from './contacts.ts';
import { HOTELS, ROOMS } from './lodgingData.mjs';

export interface AdsTrackingConfig {
  ga4: string;
  ads: string;
  adsBooking: string;
  adsPhone: string;
  adsWhatsapp: string;
  adsUsak: string;
  adsUsakBooking: string;
  adsUsakPhone: string;
  adsUsakWhatsapp: string;
  pixel: string;
}

export interface ContactContext {
  href?: string;
  path?: string;
  search?: string;
  hotelId?: number | string | null;
}

export interface GoogleConfigCall {
  id: string;
  params?: { send_page_view: false };
}

export interface GoogleTagPlan {
  /** gtag.js adresine yazılan kimlik. Mevcut hesap duruyorsa o (veya GA4) kalır. */
  scriptId: string;
  calls: GoogleConfigCall[];
}

export const USAK_HOTEL_ID = HOTELS.find((h) => h.path === '/tesis/2')?.id ?? 2;
export const ADANA_HOTEL_ID = HOTELS.find((h) => h.path === '/tesis/1')?.id ?? 1;

const USAK_ROOM_PATHS = new Set(ROOMS.filter((r) => r.hotelId === USAK_HOTEL_ID).map((r) => r.path));
const ADANA_ROOM_PATHS = new Set(ROOMS.filter((r) => r.hotelId === ADANA_HOTEL_ID).map((r) => r.path));

const branch = (key: 'usak' | 'adana') => BRANCH_CONTACTS.find((b) => b.key === key);

/** Son 10 hane (ülke kodu ve baştaki 0 olmadan). Kısa / boş değer eşleşmez. */
export function national10(value: string): string {
  const digits = (value || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
}

/**
 * Bağlantıdaki telefon. WhatsApp adresindeki hazır mesajın yüzde kodları
 * (ör. %20, %C5) rakam içerir; tüm adresi okumak numarayı bozar.
 */
export function phoneSource(href: string): string {
  const raw = href || '';
  try {
    const url = new URL(raw, 'https://uyuroom.com');
    if (url.protocol === 'tel:') return decodeURIComponent(url.pathname);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'wa.me') return url.pathname.replace(/^\//, '');
    if (host === 'api.whatsapp.com' || host === 'whatsapp.com') return url.searchParams.get('phone') || '';
  } catch {
    /* yoksay */
  }
  if (raw.startsWith('tel:')) return raw.slice(4);
  return raw;
}

export function isBranchPhone(href: string, key: 'usak' | 'adana'): boolean {
  const want = national10(branch(key)?.phoneRaw || '');
  const got = national10(phoneSource(href));
  return Boolean(want && got && want === got);
}

export function isUsakHotel(hotelId: unknown): boolean {
  if (hotelId == null || hotelId === '') return false;
  return Number(hotelId) === USAK_HOTEL_ID;
}

export function isAdanaHotel(hotelId: unknown): boolean {
  if (hotelId == null || hotelId === '') return false;
  return Number(hotelId) === ADANA_HOTEL_ID;
}

function pathnameOf(path: string): string {
  const bare = (path || '').split('?')[0].replace(/\/+$/, '');
  return bare || '/';
}

function queryOf(path: string, search: string): string {
  if (path.includes('?')) return path.slice(path.indexOf('?') + 1);
  return search.startsWith('?') ? search.slice(1) : search;
}

/** Yalnızca Uşak'ı anlatan blog yazısı. Adana ve Uşak birlikteyse ortak sayfadır. */
function blogBranch(slug: string): 'usak' | 'adana' | 'shared' | null {
  let name = slug;
  try {
    name = decodeURIComponent(slug);
  } catch {
    name = slug;
  }
  name = name.toLowerCase();
  const usak = name.includes('usak');
  const adana = name.includes('adana');
  if (usak && adana) return 'shared';
  if (usak) return 'usak';
  if (adana) return 'adana';
  return null;
}

export function pageBranch(path = '', search = ''): 'usak' | 'adana' | null {
  const pathname = pathnameOf(path);
  if (pathname === '/tesis/2' || USAK_ROOM_PATHS.has(pathname)) return 'usak';
  if (pathname === '/tesis/1' || ADANA_ROOM_PATHS.has(pathname)) return 'adana';
  if (pathname === '/booking') {
    const hotel = new URLSearchParams(queryOf(path, search)).get('hotel_id');
    if (hotel === String(USAK_HOTEL_ID)) return 'usak';
    if (hotel === String(ADANA_HOTEL_ID)) return 'adana';
  }
  const blog = pathname.match(/^\/blog\/([^/]+)$/);
  if (blog) {
    const which = blogBranch(blog[1]);
    if (which === 'usak' || which === 'adana') return which;
  }
  return null;
}

export function isUsakPage(path = '', search = ''): boolean {
  return pageBranch(path, search) === 'usak';
}

/**
 * Bu tıklama Uşak hesabına da yazılsın mı?
 * Numara biliniyorsa numara kazanır (ortak menüdeki Adana hattı, Uşak sayfasında bile Uşak'a gitmez).
 * Numara yoksa sayfanın oteli, o da yoksa adres bakılır.
 */
export function isUsakContact(ctx: ContactContext = {}): boolean {
  const href = ctx.href || '';
  if (href && isBranchPhone(href, 'usak')) return true;
  if (href && isBranchPhone(href, 'adana')) return false;
  if (isUsakHotel(ctx.hotelId)) return true;
  if (isAdanaHotel(ctx.hotelId)) return false;
  return isUsakPage(ctx.path, ctx.search);
}

/** Birinci taraf ölçüm için, bilinebiliyorsa şube. */
export function contactHotelId(ctx: ContactContext = {}): number | undefined {
  const href = ctx.href || '';
  if (href && isBranchPhone(href, 'usak')) return USAK_HOTEL_ID;
  if (href && isBranchPhone(href, 'adana')) return ADANA_HOTEL_ID;
  if (isUsakHotel(ctx.hotelId)) return USAK_HOTEL_ID;
  if (isAdanaHotel(ctx.hotelId)) return ADANA_HOTEL_ID;
  const page = pageBranch(ctx.path, ctx.search);
  if (page === 'usak') return USAK_HOTEL_ID;
  if (page === 'adana') return ADANA_HOTEL_ID;
  return undefined;
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

/** Her iki AW kimliği (ve GA4) için gtag('config') çağrıları. Aynı AW iki kez yazılmaz. */
export function googleTagPlan(cfg: AdsTrackingConfig): GoogleTagPlan | null {
  const scriptId = cfg.ga4 || cfg.ads || cfg.adsUsak;
  if (!scriptId) return null;
  const calls: GoogleConfigCall[] = [];
  if (cfg.ga4) calls.push({ id: cfg.ga4, params: { send_page_view: false } });
  if (cfg.ads) calls.push({ id: cfg.ads });
  if (cfg.adsUsak && cfg.adsUsak !== cfg.ads) calls.push({ id: cfg.adsUsak });
  return { scriptId, calls };
}

/** Rezervasyon dönüşümü. Mevcut hesap her zaman; Uşak oteli ve Uşak etiketi varsa o da. */
export function bookingConversionTargets(cfg: AdsTrackingConfig, hotelId?: number | string | null): string[] {
  const targets: string[] = [];
  if (cfg.ads && cfg.adsBooking) targets.push(`${cfg.ads}/${cfg.adsBooking}`);
  if (isUsakHotel(hotelId) && cfg.adsUsak && cfg.adsUsakBooking) targets.push(`${cfg.adsUsak}/${cfg.adsUsakBooking}`);
  return dedupe(targets);
}

/** Telefon / WhatsApp dönüşümü. Mevcut hesabın etiketi durur; Uşak tıklaması ikinci etikete de gider. */
export function contactConversionTargets(
  cfg: AdsTrackingConfig,
  kind: 'phone' | 'whatsapp',
  ctx: ContactContext = {},
): string[] {
  const targets: string[] = [];
  const primary = kind === 'phone' ? cfg.adsPhone : cfg.adsWhatsapp;
  if (cfg.ads && primary) targets.push(`${cfg.ads}/${primary}`);
  if (isUsakContact(ctx) && cfg.adsUsak) {
    const label = kind === 'phone' ? cfg.adsUsakPhone : cfg.adsUsakWhatsapp;
    if (label) targets.push(`${cfg.adsUsak}/${label}`);
  }
  return dedupe(targets);
}
