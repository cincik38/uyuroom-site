/**
 * Reklam / analiz takibi (GA4, Google Ads, Meta Pixel).
 *
 * Kimlikler çalışma anında Supabase `tracking_settings` tablosundan okunur; reklamcı bunları
 * /yonetim/takip sayfasından kendisi girer. Okuma başarısız olursa son önbellek, o da yoksa
 * .env.production içindeki VITE_* değerleri kullanılır. Boşsa ilgili etiket hiç yüklenmez.
 * Google etiketi Consent Mode v2 ile çalışır (index.html'de varsayılan: reddedildi);
 * ziyaretçi "Kabul Et" derse izinler güncellenir. Meta Pixel yalnızca onayla yüklenir.
 */
import { supabase } from '@/lib/supabase';

export interface TrackingConfig {
  ga4: string;
  ads: string;
  adsBooking: string;
  adsPhone: string;
  adsWhatsapp: string;
  pixel: string;
}

/** Veritabanındaki anahtar -> yapılandırma alanı */
export const TRACKING_KEYS = {
  ga4_id: 'ga4',
  ads_id: 'ads',
  ads_booking_label: 'adsBooking',
  ads_phone_label: 'adsPhone',
  ads_whatsapp_label: 'adsWhatsapp',
  meta_pixel_id: 'pixel',
} as const;

/** Veritabanı kısıtlarıyla aynı biçim kuralları; kimlikler script adreslerine yazıldığı için burada da denetlenir. */
export const TRACKING_PATTERNS: Record<keyof typeof TRACKING_KEYS, RegExp> = {
  ga4_id: /^G-[A-Z0-9]{6,14}$/,
  ads_id: /^AW-[0-9]{6,14}$/,
  ads_booking_label: /^[A-Za-z0-9_-]{8,40}$/,
  ads_phone_label: /^[A-Za-z0-9_-]{8,40}$/,
  ads_whatsapp_label: /^[A-Za-z0-9_-]{8,40}$/,
  meta_pixel_id: /^[0-9]{8,20}$/,
};

type Dict = Record<string, unknown>;

const ENV: TrackingConfig = {
  ga4: (import.meta.env.VITE_GA4_ID as string) || '',
  ads: (import.meta.env.VITE_ADS_ID as string) || '',
  adsBooking: (import.meta.env.VITE_ADS_CONVERSION_LABEL as string) || '',
  adsPhone: '',
  adsWhatsapp: '',
  pixel: (import.meta.env.VITE_META_PIXEL_ID as string) || '',
};

const CONSENT_KEY = 'uyu_consent';
const CACHE_KEY = 'uyu_trk_cfg_v1';
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

const isConfigured = (c: TrackingConfig) => Boolean(c.ga4 || c.ads || c.pixel);

/** Tarayıcıdan gelen değerlerden yalnızca biçimi geçerli olanları alır. */
function sanitize(raw: Partial<Record<keyof typeof TRACKING_KEYS, string>>): TrackingConfig {
  const out: TrackingConfig = { ga4: '', ads: '', adsBooking: '', adsPhone: '', adsWhatsapp: '', pixel: '' };
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
    return { ...ENV, ...{ ga4: '', ads: '', adsBooking: '', adsPhone: '', adsWhatsapp: '', pixel: '' }, ...parsed };
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
  if (value === 'granted') startTracking();
  else
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
  const lead = cfg.ga4 || cfg.ads;
  if (!lead) return;
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(lead)}`);
  window.gtag?.('js', new Date());
  if (cfg.ga4) window.gtag?.('config', cfg.ga4, { send_page_view: false });
  if (cfg.ads) window.gtag?.('config', cfg.ads);
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
  metaOn() && window.fbq?.('track', 'PageView');
}

/** Oda sayfası görüntüleme. */
export function trackViewRoom(room: { id: number | string; name: string; price: number; hotel?: string }) {
  gt('event', 'view_item', {
    currency: 'TRY',
    value: room.price,
    items: [{ item_id: String(room.id), item_name: room.name, item_category: room.hotel, price: room.price }],
  });
  metaOn() && window.fbq?.('track', 'ViewContent', {
    content_ids: [String(room.id)],
    content_name: room.name,
    content_type: 'product',
    value: room.price,
    currency: 'TRY',
  });
}

/** Rezervasyon sayfası açıldı. */
export function trackBeginBooking(p: { value: number; roomId: number | string; roomName: string }) {
  gt('event', 'begin_checkout', {
    currency: 'TRY',
    value: p.value,
    items: [{ item_id: String(p.roomId), item_name: p.roomName }],
  });
  metaOn() && window.fbq?.('track', 'InitiateCheckout', { value: p.value, currency: 'TRY' });
}

/** Rezervasyon tamamlandı (dönüşüm). */
export function trackBookingComplete(p: { code: string; value: number; roomId: number | string; roomName: string }) {
  gt('event', 'purchase', {
    transaction_id: p.code,
    currency: 'TRY',
    value: p.value,
    items: [{ item_id: String(p.roomId), item_name: p.roomName }],
  });
  if (cfg.ads && cfg.adsBooking) {
    gt('event', 'conversion', {
      send_to: `${cfg.ads}/${cfg.adsBooking}`,
      value: p.value,
      currency: 'TRY',
      transaction_id: p.code,
    });
  }
  metaOn() && window.fbq?.('track', 'Purchase', { value: p.value, currency: 'TRY' }, { eventID: p.code });
}

/** Telefon / WhatsApp tıklaması. */
export function trackContactClick(kind: 'phone' | 'whatsapp') {
  gt('event', 'contact', { method: kind });
  const label = kind === 'phone' ? cfg.adsPhone : cfg.adsWhatsapp;
  if (cfg.ads && label) gt('event', 'conversion', { send_to: `${cfg.ads}/${label}` });
  metaOn() && window.fbq?.('track', 'Contact');
}

export type { Dict };
