/**
 * Reklam / analiz takibi (GA4, Google Ads, Meta Pixel).
 * Kimlikler .env.production içindeki VITE_* değişkenlerinden okunur; boşsa hiçbir şey yüklenmez.
 * Google etiketi index.html içinde Consent Mode v2 ile (varsayılan: reddedildi) yüklenir;
 * ziyaretçi "Kabul Et" derse izinler güncellenir. Meta Pixel yalnızca onayla yüklenir.
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

function grantGoogle() {
  window.gtag?.('consent', 'update', {
    ad_storage: 'granted',
    analytics_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
  });
}

// Google Ads etiketi (Consent Mode izinlere göre davranır)
if (typeof window !== 'undefined' && ADS) window.gtag?.('config', ADS);
// Daha önce onay verilmişse ilk sayfa görüntülemeden önce izinleri uygula
if (typeof window !== 'undefined' && getConsent() === 'granted') grantGoogle();

export function startTracking() {
  if (started || getConsent() !== 'granted' || !trackingConfigured) return;
  started = true;

  grantGoogle();

  if (PIXEL) {
    const f = function (...args: unknown[]) {
      (f as typeof window.fbq & { queue: unknown[] }).queue.push(args);
    } as unknown as NonNullable<Window['fbq']> & { queue: unknown[] };
    f.queue = [];
    f.loaded = true;
    window.fbq = f;
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL);
    window.fbq('track', 'PageView');
  }
}

const metaOn = () => started && getConsent() === 'granted';

export function trackPageView(path: string) {
  window.gtag?.('event', 'page_view', { page_path: path, page_location: window.location.href });
  metaOn() && window.fbq?.('track', 'PageView');
}

/** Oda sayfası görüntüleme. */
export function trackViewRoom(room: { id: number | string; name: string; price: number; hotel?: string }) {
  window.gtag?.('event', 'view_item', {
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
  window.gtag?.('event', 'begin_checkout', {
    currency: 'TRY',
    value: p.value,
    items: [{ item_id: String(p.roomId), item_name: p.roomName }],
  });
  metaOn() && window.fbq?.('track', 'InitiateCheckout', { value: p.value, currency: 'TRY' });
}

/** Rezervasyon tamamlandı (dönüşüm). */
export function trackBookingComplete(p: { code: string; value: number; roomId: number | string; roomName: string }) {
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
  metaOn() && window.fbq?.('track', 'Purchase', { value: p.value, currency: 'TRY' }, { eventID: p.code });
}

/** Telefon / WhatsApp tıklaması. */
export function trackContactClick(kind: 'phone' | 'whatsapp') {
  window.gtag?.('event', 'contact', { method: kind });
  metaOn() && window.fbq?.('track', 'Contact');
}
