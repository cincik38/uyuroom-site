/**
 * Reklam / analiz takibi (GA4, Google Ads, Meta Pixel).
 *
 * Kimlikler çalışma anında Supabase `tracking_settings` tablosundan okunur; reklamcı bunları
 * /yonetim/takip sayfasından kendisi girer. Okuma başarısız olursa son önbellek, o da yoksa
 * .env.production içindeki VITE_* değerleri kullanılır. Boşsa ilgili etiket hiç yüklenmez.
 * Google etiketi Consent Mode v2 ile çalışır (index.html'de varsayılan: reddedildi);
 * ziyaretçi "Kabul Et" derse izinler güncellenir. Meta Pixel yalnızca onayla yüklenir.
 *
 * İsteğe bağlı ikinci Google Ads hesabı (Uşak) aynı tabloda ayrı anahtarlarla durur.
 * Boşsa hiçbir Uşak çağrısı yapılmaz; mevcut hesabın config ve dönüşümleri değişmez.
 * Doluysa her iki AW kimliği gtag('config') alır. Uşak dönüşümü, etiketi varsa Uşak
 * hesabına da send_to ile gider. Ayrıntı: adsAccounts.ts.
 *
 * Ayrıca Reklam Merkezi için birinci taraf, kişisel veri içermeyen sayaç olayları `track_event` ile
 * Supabase'e yazılır (yalnızca çerez onayıyla; ad, e-posta, telefon, IP hiçbir zaman gönderilmez).
 */
import { supabase } from '@/lib/supabase';
import {
  bookingConversionTargets,
  contactConversionTargets,
  contactHotelId,
  googleTagPlan,
  type AdsTrackingConfig,
  type ContactContext,
} from '@/lib/adsAccounts';

export type TrackingConfig = AdsTrackingConfig;
export type { ContactContext };

/** Veritabanındaki anahtar -> yapılandırma alanı */
export const TRACKING_KEYS = {
  ga4_id: 'ga4',
  ads_id: 'ads',
  ads_booking_label: 'adsBooking',
  ads_phone_label: 'adsPhone',
  ads_whatsapp_label: 'adsWhatsapp',
  ads_usak_id: 'adsUsak',
  ads_usak_booking_label: 'adsUsakBooking',
  ads_usak_phone_label: 'adsUsakPhone',
  ads_usak_whatsapp_label: 'adsUsakWhatsapp',
  meta_pixel_id: 'pixel',
} as const;

/** Veritabanı kısıtlarıyla aynı biçim kuralları; kimlikler script adreslerine yazıldığı için burada da denetlenir. */
export const TRACKING_PATTERNS: Record<keyof typeof TRACKING_KEYS, RegExp> = {
  ga4_id: /^G-[A-Z0-9]{6,14}$/,
  ads_id: /^AW-[0-9]{6,14}$/,
  ads_booking_label: /^[A-Za-z0-9_-]{8,40}$/,
  ads_phone_label: /^[A-Za-z0-9_-]{8,40}$/,
  ads_whatsapp_label: /^[A-Za-z0-9_-]{8,40}$/,
  ads_usak_id: /^AW-[0-9]{6,14}$/,
  ads_usak_booking_label: /^[A-Za-z0-9_-]{8,40}$/,
  ads_usak_phone_label: /^[A-Za-z0-9_-]{8,40}$/,
  ads_usak_whatsapp_label: /^[A-Za-z0-9_-]{8,40}$/,
  meta_pixel_id: /^[0-9]{8,20}$/,
};

const BLANK: TrackingConfig = {
  ga4: '',
  ads: '',
  adsBooking: '',
  adsPhone: '',
  adsWhatsapp: '',
  adsUsak: '',
  adsUsakBooking: '',
  adsUsakPhone: '',
  adsUsakWhatsapp: '',
  pixel: '',
};

type Dict = Record<string, unknown>;

const ENV: TrackingConfig = {
  ...BLANK,
  ga4: (import.meta.env.VITE_GA4_ID as string) || '',
  ads: (import.meta.env.VITE_ADS_ID as string) || '',
  adsBooking: (import.meta.env.VITE_ADS_CONVERSION_LABEL as string) || '',
  pixel: (import.meta.env.VITE_META_PIXEL_ID as string) || '',
};

const CONSENT_KEY = 'uyu_consent';
const CACHE_KEY = 'uyu_trk_cfg_v2';
const FETCH_TIMEOUT_MS = 2500;

let cfg: TrackingConfig = { ...ENV };
let booted = false;
let ready = false;
let started = false;
const queue: unknown[][] = [];
const waiters: Array<(configured: boolean) => void> = [];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };
    _fbq?: unknown;
  }
}

const isConfigured = (c: TrackingConfig) => Boolean(c.ga4 || c.ads || c.adsUsak || c.pixel);

/** Tarayıcıdan gelen değerlerden yalnızca biçimi geçerli olanları alır. */
function sanitize(raw: Partial<Record<keyof typeof TRACKING_KEYS, string>>): TrackingConfig {
  const out: TrackingConfig = { ...BLANK };
  (Object.keys(TRACKING_KEYS) as Array<keyof typeof TRACKING_KEYS>).forEach((k) => {
    const v = String(raw[k] ?? '').trim();
    if (v && TRACKING_PATTERNS[k].test(v)) out[TRACKING_KEYS[k]] = v;
  });
  return out;
}

function readCache(): TrackingConfig | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TrackingConfig>;
    return { ...ENV, ...BLANK, ...parsed };
  } catch {
    return null;
  }
}

function writeCache(c: TrackingConfig) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* yoksay */
  }
}

async function fetchRemote(): Promise<TrackingConfig | null> {
  try {
    const req = supabase.from('tracking_settings').select('key,value');
    const res = await Promise.race([
      req,
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), FETCH_TIMEOUT_MS)),
    ]);
    if (!res || res.error || !res.data || res.data.length === 0) return null;
    const raw: Partial<Record<keyof typeof TRACKING_KEYS, string>> = {};
    for (const row of res.data as Array<{ key: string; value: string }>) {
      if (row.key in TRACKING_KEYS) raw[row.key as keyof typeof TRACKING_KEYS] = row.value;
    }
    return sanitize(raw);
  } catch {
    return null;
  }
}

export function getConsent(): 'granted' | 'denied' | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: 'granted' | 'denied') {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* yoksay */
  }
  if (value === 'granted') {
    startTracking();
    collectCurrentPage();
  } else
    window.gtag?.('consent', 'update', {
      ad_storage: 'denied',
      analytics_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
}

function loadScript(src: string) {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function grantGoogle() {
  window.gtag?.('consent', 'update', {
    ad_storage: 'granted',
    analytics_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
  });
}

/** Google etiketleri yapılandırma gelmeden önce gönderilen olayları sıraya alır. */
function gt(...args: unknown[]) {
  if (ready) window.gtag?.(...args);
  else queue.push(args);
}

function initGoogle() {
  if (getConsent() === 'granted') grantGoogle();
  const plan = googleTagPlan(cfg);
  if (!plan) return;
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(plan.scriptId)}`);
  window.gtag?.('js', new Date());
  for (const call of plan.calls) {
    if (call.params) window.gtag?.('config', call.id, call.params);
    else window.gtag?.('config', call.id);
  }
}

/** Oda / tesis / rezervasyon sayfası hangi otel olduğunu tıklama anında bilsin. */
export function setActivePageHotel(hotelId: number | string | null | undefined) {
  if (typeof document === 'undefined') return;
  if (hotelId == null || hotelId === '') document.documentElement.removeAttribute('data-uyu-hotel');
  else document.documentElement.setAttribute('data-uyu-hotel', String(hotelId));
}

export function activePageHotel(): string | null {
  if (typeof document === 'undefined') return null;
  return document.documentElement.getAttribute('data-uyu-hotel');
}

function becomeReady(next: TrackingConfig) {
  cfg = next;
  initGoogle();
  ready = true;
  queue.splice(0).forEach((a) => window.gtag?.(...a));
  const ok = isConfigured(cfg);
  waiters.splice(0).forEach((w) => w(ok));
  if (getConsent() === 'granted') startTracking();
}

/** Uygulama açılırken bir kez çağrılır. */
export function bootTracking() {
  if (booted || typeof window === 'undefined') return;
  booted = true;
  const cached = readCache();
  if (cached) {
    // Önbellek varsa beklemeden başla, güncel değerleri arka planda yenile (bir sonraki açılışta geçerli olur)
    becomeReady(cached);
    void fetchRemote().then((r) => r && writeCache(r));
  } else {
    void fetchRemote().then((r) => {
      if (r) writeCache(r);
      becomeReady(r ?? ENV);
    });
  }
}

/** Takip kimliklerinden en az biri tanımlıysa true döner (çerez bandı buna göre görünür). */
export function onTrackingReady(): Promise<boolean> {
  bootTracking();
  if (ready) return Promise.resolve(isConfigured(cfg));
  return new Promise((resolve) => waiters.push(resolve));
}

export function startTracking() {
  if (started || !ready || getConsent() !== 'granted') return;
  grantGoogle();
  if (!cfg.pixel) return;
  started = true;

  const f = function (...args: unknown[]) {
    (f as typeof window.fbq & { queue: unknown[] }).queue.push(args);
  } as unknown as NonNullable<Window['fbq']> & { queue: unknown[] };
  f.queue = [];
  f.loaded = true;
  window.fbq = f;
  loadScript('https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', cfg.pixel);
  window.fbq('track', 'PageView');
}

const metaOn = () => started && getConsent() === 'granted';

export function trackPageView(path: string) {
  bootTracking();
  // Yönetim ve gizli önizleme sayfaları istatistiğe girmez
  if (path.startsWith('/yonetim') || path.startsWith('/karakter-onizleme') || path.startsWith('/personel')) return;
  gt('event', 'page_view', { page_path: path, page_location: window.location.href });
  if (metaOn()) window.fbq?.('track', 'PageView');
  collect('page_view', { path });
}

/** Oda sayfası görüntüleme. */
export function trackViewRoom(room: { id: number | string; name: string; price: number; hotel?: string; hotelId?: number | string | null }) {
  collect('view_room', { path: window.location.pathname, room_id: room.id, hotel_id: room.hotelId, props: { name: room.name } });
  gt('event', 'view_item', {
    currency: 'TRY',
    value: room.price,
    items: [{ item_id: String(room.id), item_name: room.name, item_category: room.hotel, price: room.price }],
  });
  if (metaOn()) window.fbq?.('track', 'ViewContent', {
    content_ids: [String(room.id)],
    content_name: room.name,
    content_type: 'product',
    value: room.price,
    currency: 'TRY',
  });
}

/** Rezervasyon sayfası açıldı. */
export function trackBeginBooking(p: { value: number; roomId: number | string; roomName: string; hotelId?: number | string | null }) {
  collect('begin_booking', { path: window.location.pathname, room_id: p.roomId, hotel_id: p.hotelId, value: p.value, props: { name: p.roomName } });
  gt('event', 'begin_checkout', {
    currency: 'TRY',
    value: p.value,
    items: [{ item_id: String(p.roomId), item_name: p.roomName }],
  });
  if (metaOn()) window.fbq?.('track', 'InitiateCheckout', { value: p.value, currency: 'TRY' });
}

/** Rezervasyon tamamlandı (dönüşüm). */
export function trackBookingComplete(p: { code: string; value: number; roomId: number | string; roomName: string; hotelId?: number | string | null; nights?: number }) {
  collect('booking_complete', { path: window.location.pathname, room_id: p.roomId, hotel_id: p.hotelId, value: p.value, code: p.code, props: { name: p.roomName, nights: p.nights } });
  gt('event', 'purchase', {
    transaction_id: p.code,
    currency: 'TRY',
    value: p.value,
    items: [{ item_id: String(p.roomId), item_name: p.roomName }],
  });
  for (const sendTo of bookingConversionTargets(cfg, p.hotelId)) {
    gt('event', 'conversion', {
      send_to: sendTo,
      value: p.value,
      currency: 'TRY',
      transaction_id: p.code,
    });
  }
  if (metaOn()) window.fbq?.('track', 'Purchase', { value: p.value, currency: 'TRY' }, { eventID: p.code });
}

/** Telefon / WhatsApp tıklaması. href ve sayfa, Uşak hesabına da yazılacağını belirler. */
export function trackContactClick(kind: 'phone' | 'whatsapp', ctx: ContactContext = {}) {
  const resolved: ContactContext = {
    href: ctx.href,
    path: ctx.path ?? window.location.pathname,
    search: ctx.search ?? window.location.search,
    hotelId: ctx.hotelId ?? activePageHotel(),
  };
  collect('contact_click', {
    path: resolved.path,
    hotel_id: contactHotelId(resolved),
    props: { kind },
  });
  gt('event', 'contact', { method: kind });
  for (const sendTo of contactConversionTargets(cfg, kind, resolved)) {
    gt('event', 'conversion', { send_to: sendTo });
  }
  if (metaOn()) window.fbq?.('track', 'Contact');
}

/** Arama formu gönderildi. */
export function trackSearch(p: { checkIn: string; checkOut: string; guests: number }) {
  gt('event', 'search', { search_term: `${p.checkIn}_${p.checkOut}` });
  collect('search', { path: window.location.pathname, props: { check_in: p.checkIn, check_out: p.checkOut, guests: p.guests } });
}

/* ------------------------------------------------------------------ */
/* Birinci taraf ölçüm (Reklam Merkezi)                                */
/* ------------------------------------------------------------------ */

type EventType = 'page_view' | 'view_room' | 'search' | 'begin_booking' | 'booking_complete' | 'contact_click';

interface Attr {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  click_id?: string;
  ref_host?: string;
}

interface Sess {
  id: string;
  t: number;
  n: number;
  a: Attr;
}

const SESSION_KEY = 'uyu_sid_v1';
const SESSION_MS = 30 * 60 * 1000;
const CLICK_IDS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid', 'ttclid'] as const;
const NO_COLLECT = ['/yonetim', '/personel', '/karakter-onizleme'];

let landingChecked = false;
let lastPagePath = '';

function isExcluded(): boolean {
  try {
    const ua = navigator.userAgent || '';
    if ((navigator as Navigator & { webdriver?: boolean }).webdriver) return true;
    if (/bot|crawl|spider|slurp|headless|lighthouse|pagespeed|facebookexternalhit|preview/i.test(ua)) return true;
    // Panelde oturum açmış yönetici / reklamcı ziyaretleri sayılmaz
    if (localStorage.getItem('uyuroom_ota_session')) return true;
  } catch {
    /* yoksay */
  }
  return false;
}

function randomId(): string {
  const bytes = new Uint8Array(12);
  try {
    crypto.getRandomValues(bytes);
  } catch {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

const clip = (v: string | null | undefined, n: number) => (v ? v.slice(0, n) : undefined);

function readAttr(): Attr {
  const a: Attr = {};
  try {
    const q = new URLSearchParams(window.location.search);
    a.source = clip(q.get('utm_source'), 60);
    a.medium = clip(q.get('utm_medium'), 40);
    a.campaign = clip(q.get('utm_campaign'), 100);
    a.term = clip(q.get('utm_term'), 100);
    a.content = clip(q.get('utm_content'), 100);
    for (const k of CLICK_IDS) {
      if (q.get(k)) {
        a.click_id = k;
        break;
      }
    }
    if (document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '');
      const mine = window.location.hostname.replace(/^www\./, '');
      if (host && host !== mine && !host.endsWith('uyuroom.com')) a.ref_host = host.slice(0, 80);
    }
  } catch {
    /* yoksay */
  }
  (Object.keys(a) as Array<keyof Attr>).forEach((k) => a[k] === undefined && delete a[k]);
  return a;
}

function loadSession(): Sess | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Sess;
    if (!s || typeof s.id !== 'string' || typeof s.t !== 'number') return null;
    return s;
  } catch {
    return null;
  }
}

function saveSession(s: Sess) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* yoksay */
  }
}

/** Oturumu getirir; 30 dakika hareketsizlikte veya yeni bir reklam / dış kaynak girişinde yenisini açar. */
function touchSession(): Sess {
  const now = Date.now();
  let s = loadSession();
  if (s && now - s.t > SESSION_MS) s = null;
  if (!landingChecked) {
    landingChecked = true;
    const attr = readAttr();
    const fresh = Boolean(attr.source || attr.campaign || attr.click_id || attr.ref_host);
    if (fresh && (!s || JSON.stringify(s.a) !== JSON.stringify(attr))) s = { id: randomId(), t: now, n: 0, a: attr };
  }
  if (!s) s = { id: randomId(), t: now, n: 0, a: {} };
  s.t = now;
  return s;
}

function deviceInfo() {
  const ua = navigator.userAgent || '';
  const w = window.innerWidth || 1024;
  const tablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
  const device = tablet ? 'tablet' : /Mobi|iPhone|Android/i.test(ua) || w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /SamsungBrowser/.test(ua)
        ? 'Samsung'
        : /Firefox|FxiOS/.test(ua)
          ? 'Firefox'
          : /Chrome|CriOS/.test(ua)
            ? 'Chrome'
            : /Safari/.test(ua)
              ? 'Safari'
              : 'Diğer';
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Android/.test(ua)
      ? 'Android'
      : /iPhone|iPad|iPod/.test(ua)
        ? 'iOS'
        : /Mac OS X/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'Diğer';
  return { device, browser, os };
}

interface CollectData {
  path?: string;
  room_id?: number | string | null;
  hotel_id?: number | string | null;
  value?: number;
  code?: string;
  props?: Record<string, unknown>;
}

function collect(type: EventType, data: CollectData = {}) {
  if (typeof window === 'undefined' || getConsent() !== 'granted') return;
  const path = data.path ?? window.location.pathname;
  if (NO_COLLECT.some((p) => path.startsWith(p)) || isExcluded()) return;
  const s = touchSession();
  const payload = {
    type,
    sid: s.id,
    path: path.slice(0, 200),
    ...s.a,
    landing: s.n === 0,
    ...deviceInfo(),
    lang: (navigator.language || '').slice(0, 10),
    room_id: data.room_id == null ? undefined : String(data.room_id),
    hotel_id: data.hotel_id == null ? undefined : String(data.hotel_id),
    value: typeof data.value === 'number' && isFinite(data.value) ? Math.round(data.value * 100) / 100 : undefined,
    code: data.code,
    props: data.props,
  };
  s.n += 1;
  saveSession(s);
  if (type === 'page_view') lastPagePath = path;
  try {
    void Promise.resolve(supabase.rpc('track_event', { p: payload })).catch(() => undefined);
  } catch {
    /* ölçüm hatası siteyi etkilemez */
  }
}

/** Onay yeni verildiyse, o an açık olan sayfa da sayılsın. */
function collectCurrentPage() {
  const path = window.location.pathname;
  if (path !== lastPagePath) collect('page_view', { path });
}

export type { Dict };
