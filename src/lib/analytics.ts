/**
 * Reklam / analiz takibi (GA4, Google Ads, Meta Pixel).
 * Kimlikler .env.production içindeki VITE_* değişkenlerinden okunur; boşsa hiçbir şey yüklenmez.
 * Takip yalnızca ziyaretçi "Kabul Et" derse başlar (KVKK / çerez onayı).
 */
type Dict = Record<string, unknown>;

const GA4 = (import.meta.env.VITE_GA4_ID as string) || '';
const ADS = (import.meta.env.VITE_ADS_ID as string) || '';
const ADS_LABEL = (import.meta.env.VITE_ADS_CONVERSION_LABEL as string) || '';
const PIXEL = (import.meta.env.VITE_META_PIXEL_ID as string) || '';

const CONSENT_KEY = 'uyu_consent';
let started = false;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };
    _fbq?: unknown;
  }
}

export const trackingConfigured = Boolean(GA4 || ADS || PIXEL);

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
}

function loadScript(src: string) {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

export function startTracking() {
  if (started || getConsent() !== 'granted' || !trackingConfigured) return;
  started = true;

  const gId = GA4 || ADS;
  if (gId) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag('js', new Date());
    if (GA4) window.gtag('config', GA4, { send_page_view: false });
    if (ADS) window.gtag('config', ADS);
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${gId}`);
  }

  if (PIXEL) {
    const f = function (...args: unknown[]) {
      (f as typeof window.fbq & { queue: unknown[] }).queue.push(args);
    } as unknown as NonNullable<Window['fbq']> & { queue: unknown[] };
    f.queue = [];
    f.loaded = true;
    window.fbq = f;
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL);
  }

  trackPageView(window.location.pathname + window.location.search);
}

const active = () => started && getConsent() === 'granted';

export function trackPageView(path: string) {
  if (!active()) return;
  window.gtag?.('event', 'page_view', { page_path: path, page_location: window.location.href });
  window.fbq?.('track', 'PageView');
}

/** Oda sayfası görüntüleme. */
export function trackViewRoom(room: { id: number | string; name: string; price: number; hotel?: string }) {
  if (!active()) return;
  window.gtag?.('event', 'view_item', {
    currency: 'TRY',
    value: room.price,
    items: [{ item_id: String(room.id), item_name: room.name, item_category: room.hotel, price: room.price }],
  });
  window.fbq?.('track', 'ViewContent', {
    content_ids: [String(room.id)],
    content_name: room.name,
    content_type: 'product',
    value: room.price,
    currency: 'TRY',
  });
}

/** Rezervasyon sayfası açıldı. */
export function trackBeginBooking(p: { value: number; roomId: number | string; roomName: string }) {
  if (!active()) return;
  window.gtag?.('event', 'begin_checkout', {
    currency: 'TRY',
    value: p.value,
    items: [{ item_id: String(p.roomId), item_name: p.roomName }],
  });
  window.fbq?.('track', 'InitiateCheckout', { value: p.value, currency: 'TRY' });
}

/** Rezervasyon tamamlandı (dönüşüm). */
export function trackBookingComplete(p: { code: string; value: number; roomId: number | string; roomName: string }) {
  if (!active()) return;
  window.gtag?.('event', 'purchase', {
    transaction_id: p.code,
    currency: 'TRY',
    value: p.value,
    items: [{ item_id: String(p.roomId), item_name: p.roomName }],
  });
  if (ADS && ADS_LABEL) {
    window.gtag?.('event', 'conversion', {
      send_to: `${ADS}/${ADS_LABEL}`,
      value: p.value,
      currency: 'TRY',
      transaction_id: p.code,
    });
  }
  window.fbq?.('track', 'Purchase', { value: p.value, currency: 'TRY' }, { eventID: p.code });
}

/** Telefon / WhatsApp tıklaması. */
export function trackContactClick(kind: 'phone' | 'whatsapp') {
  if (!active()) return;
  window.gtag?.('event', 'contact', { method: kind });
  window.fbq?.('track', 'Contact');
}
