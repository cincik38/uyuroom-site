/** Reklam Merkezi: türler, biçimlendirme, tarih aralıkları, kanal bilgisi, CSV, örnek veri ve otomatik öneriler. */

export interface Totals {
  sessions: number;
  page_views: number;
  viewed_room: number;
  searched: number;
  began: number;
  booked_sessions: number;
  bookings: number;
  revenue: number;
  contacts: number;
  bounced: number;
}
export interface DayRow {
  d: string;
  sessions: number;
  page_views: number;
  room_views: number;
  begin_bookings: number;
  bookings: number;
  revenue: number;
}
export interface SourceRow {
  channel: string;
  source: string;
  medium: string;
  campaign: string;
  sessions: number;
  viewed: number;
  began: number;
  booked: number;
  bookings: number;
  revenue: number;
  bounced: number;
  contacts: number;
}
export interface PageRow { path: string; views: number; sessions: number }
export interface LandingRow { path: string; sessions: number; viewed: number; booked: number; bounced: number }
export interface RoomRow {
  room_id: number;
  room_name: string | null;
  hotel_name: string | null;
  price_per_night: number | null;
  views: number;
  viewers: number;
  began: number;
  bookings: number;
  revenue: number;
}
export interface KV { k: string | null; n: number; revenue?: number; hotel?: string }
export interface SearchSum {
  searches?: number;
  avg_lead_days?: number | null;
  avg_stay_nights?: number | null;
  lead_buckets?: { d0_1: number; d2_7: number; d8_30: number; d31_plus: number };
  stay_buckets?: { n1: number; n2: number; n3: number; n4_plus: number };
  guests?: Array<{ guests: number; n: number }>;
  checkin_months?: Array<{ month: string; n: number }>;
}
export interface BookingSum {
  total: number;
  active: number;
  cancelled: number;
  revenue: number;
  avg_value: number;
  avg_nights: number;
  avg_guests: number;
  avg_lead_days: number;
  promo_used: number;
  discount_total: number;
  by_status: KV[];
  by_payment: KV[];
  by_hotel: KV[];
  by_room: KV[];
  by_checkin_dow: Array<{ dow: number; n: number }>;
  by_checkin_month: Array<{ month: string; n: number; revenue: number }>;
  lead_buckets: { d0_1: number; d2_7: number; d8_30: number; d31_plus: number };
  daily: Array<{ d: string; n: number; revenue: number }>;
}
export interface Report {
  range: { from: string; to: string; hotel: number | null };
  totals: Totals;
  daily: DayRow[];
  sources: SourceRow[];
  pages: PageRow[];
  landings: LandingRow[];
  rooms: RoomRow[];
  devices: Array<{ device: string; sessions: number; booked: number; revenue: number }>;
  browsers: Array<{ browser: string; sessions: number }>;
  os: Array<{ os: string; sessions: number }>;
  heat: Array<{ dow: number; hr: number; n: number }>;
  search: SearchSum;
  bookings: BookingSum;
  booking_sources: Array<{ channel: string; n: number; revenue: number }>;
}
export interface SpendRow {
  day: string;
  channel: string;
  campaign: string;
  cost: number;
  clicks: number;
  impressions: number;
}
export interface Note { id: number; day: string; kind: string; body: string; created_by: string | null; created_at: string }
export interface Goals { monthly_budget: number; target_roas: number; target_cpa: number; monthly_bookings: number }

/* ---------- Kanallar ---------- */
export const CHANNELS: Record<string, { label: string; color: string; paid?: boolean }> = {
  google_ads: { label: 'Google Ads', color: '#2a78d6', paid: true },
  meta_ads: { label: 'Meta reklamları', color: '#e87ba4', paid: true },
  diger_ucretli: { label: 'Diğer ücretli', color: '#e34948', paid: true },
  organik_arama: { label: 'Organik arama', color: '#1baf7a' },
  sosyal: { label: 'Sosyal medya', color: '#6250d6' },
  email: { label: 'E-posta', color: '#008300' },
  yonlendirme: { label: 'Başka siteler', color: '#eda100' },
  dogrudan: { label: 'Doğrudan', color: '#eb6834' },
  bilinmiyor: { label: 'Ölçülmeyen', color: '#94a3b8' },
};
export const channelLabel = (c: string) => CHANNELS[c]?.label ?? c;
export const channelColor = (c: string) => CHANNELS[c]?.color ?? '#94a3b8';
export const SPEND_CHANNELS = [
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'meta_ads', label: 'Meta (Facebook / Instagram)' },
  { value: 'diger_ucretli', label: 'Diğer ücretli' },
];

/* ---------- Biçimlendirme ---------- */
const nf = new Intl.NumberFormat('tr-TR');
export const fmtInt = (n: number | null | undefined) => nf.format(Math.round(Number(n) || 0));
export const fmtMoney = (n: number | null | undefined) => `₺${nf.format(Math.round(Number(n) || 0))}`;
export const fmtMoney2 = (n: number | null | undefined) =>
  `₺${(Number(n) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtPct = (n: number | null | undefined, d = 1) => `%${(Number(n) || 0).toLocaleString('tr-TR', { maximumFractionDigits: d })}`;
export const fmtDec = (n: number | null | undefined, d = 1) => (Number(n) || 0).toLocaleString('tr-TR', { maximumFractionDigits: d });
export const ratio = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
export const div = (a: number, b: number) => (b > 0 ? a / b : 0);
export const DOW = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

/* ---------- Tarih ---------- */
export const todayIst = (): string => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
export const addDays = (iso: string, n: number): string => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);
export const fmtDay = (iso: string, withYear = false) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC' });

export interface Range { from: string; to: string }
export const PRESETS: Array<{ id: string; label: string; get: () => Range }> = [
  { id: 'bugun', label: 'Bugün', get: () => ({ from: todayIst(), to: todayIst() }) },
  { id: 'dun', label: 'Dün', get: () => ({ from: addDays(todayIst(), -1), to: addDays(todayIst(), -1) }) },
  { id: '7', label: 'Son 7 gün', get: () => ({ from: addDays(todayIst(), -6), to: todayIst() }) },
  { id: '30', label: 'Son 30 gün', get: () => ({ from: addDays(todayIst(), -29), to: todayIst() }) },
  { id: '90', label: 'Son 90 gün', get: () => ({ from: addDays(todayIst(), -89), to: todayIst() }) },
  {
    id: 'ay',
    label: 'Bu ay',
    get: () => ({ from: `${todayIst().slice(0, 8)}01`, to: todayIst() }),
  },
  {
    id: 'gecenay',
    label: 'Geçen ay',
    get: () => {
      const first = `${todayIst().slice(0, 8)}01`;
      const last = addDays(first, -1);
      return { from: `${last.slice(0, 8)}01`, to: last };
    },
  },
];
export const previousRange = (r: Range): Range => {
  const len = daysBetween(r.from, r.to) + 1;
  return { from: addDays(r.from, -len), to: addDays(r.from, -1) };
};

/* ---------- Karşılaştırma ---------- */
export const delta = (cur: number, prev: number): number | null => (prev > 0 ? ((cur - prev) / prev) * 100 : cur > 0 ? null : 0);

/* ---------- CSV ---------- */
export function downloadCsv(name: string, rows: Array<Array<string | number>>) {
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows.map((r) => r.map(esc).join(';')).join('\r\n');
  const blob = new Blob([`﻿${body}`], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const parseNum = (raw: string): number => {
  let s = raw.replace(/[₺$€\s]|TL|TRY/gi, '').trim();
  if (!s) return 0;
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  else if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',')) s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};
const parseDate = (raw: string): string | null => {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
};
export const normChannel = (raw: string, fallback: string): string => {
  const s = raw.toLowerCase();
  if (!s) return fallback;
  if (s.includes('google')) return 'google_ads';
  if (/meta|facebook|instagram|fb/.test(s)) return 'meta_ads';
  return 'diger_ucretli';
};

export interface CsvParse { rows: SpendRow[]; errors: string[] }
/** Google Ads / Meta dışa aktarımı veya kendi tablonuz: tarih, kanal, kampanya, maliyet, tıklama, gösterim. */
export function parseSpendCsv(text: string, defaultChannel: string): CsvParse {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  const errors: string[] = [];
  if (lines.length < 2) return { rows: [], errors: ['Dosyada başlık satırı ve en az bir veri satırı olmalı.'] };
  const delim = (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0) && lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
  const split = (line: string) => {
    const out: string[] = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (q && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = !q;
      } else if (c === delim && !q) {
        out.push(cur);
        cur = '';
      } else cur += c;
    }
    out.push(cur);
    return out.map((x) => x.trim());
  };
  const head = split(lines[0]).map((h) => h.toLowerCase());
  const find = (...keys: string[]) => head.findIndex((h) => keys.some((k) => h.includes(k)));
  const iDay = find('tarih', 'gün', 'gun', 'day', 'date');
  const iCh = find('kanal', 'channel', 'platform');
  const iCamp = find('kampanya', 'campaign');
  const iCost = find('maliyet', 'harcama', 'cost', 'spend', 'tutar');
  const iClk = find('tıkla', 'tikla', 'click');
  const iImp = find('gösterim', 'gosterim', 'impr');
  if (iDay < 0 || iCost < 0) return { rows: [], errors: ['Başlık satırında en az "tarih" ve "maliyet" sütunları bulunmalı.'] };
  const acc = new Map<string, SpendRow>();
  for (let i = 1; i < lines.length; i++) {
    const c = split(lines[i]);
    const day = parseDate(c[iDay] ?? '');
    const cost = parseNum(c[iCost] ?? '');
    if (!day || Number.isNaN(cost)) {
      if (errors.length < 5) errors.push(`${i + 1}. satır okunamadı (tarih veya maliyet hatalı).`);
      continue;
    }
    const channel = normChannel(iCh >= 0 ? c[iCh] ?? '' : '', defaultChannel);
    const campaign = (iCamp >= 0 ? c[iCamp] ?? '' : '').toLowerCase().slice(0, 100);
    const clicks = iClk >= 0 ? parseNum(c[iClk] ?? '') : 0;
    const impressions = iImp >= 0 ? parseNum(c[iImp] ?? '') : 0;
    const key = `${day}|${channel}|${campaign}`;
    const cur = acc.get(key) ?? { day, channel, campaign, cost: 0, clicks: 0, impressions: 0 };
    cur.cost += cost;
    cur.clicks += Number.isNaN(clicks) ? 0 : Math.round(clicks);
    cur.impressions += Number.isNaN(impressions) ? 0 : Math.round(impressions);
    acc.set(key, cur);
  }
  return { rows: [...acc.values()].map((r) => ({ ...r, cost: Math.round(r.cost * 100) / 100 })), errors };
}

/* ---------- UTM ---------- */
export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

/* ---------- Örnek veri ---------- */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function demoReport(range: Range): Report {
  const r = rng(Date.parse(range.from) % 100000);
  const len = daysBetween(range.from, range.to) + 1;
  const daily: DayRow[] = [];
  for (let i = 0; i < len; i++) {
    const d = addDays(range.from, i);
    const dow = new Date(`${d}T12:00:00Z`).getUTCDay();
    const wk = dow === 4 || dow === 5 ? 1.35 : dow === 0 ? 0.8 : 1;
    const sessions = Math.round((90 + r() * 70) * wk);
    const room_views = Math.round(sessions * (0.42 + r() * 0.08));
    const begin_bookings = Math.round(room_views * (0.24 + r() * 0.06));
    const bookings = Math.round(begin_bookings * (0.32 + r() * 0.12));
    daily.push({ d, sessions, page_views: Math.round(sessions * 3.1), room_views, begin_bookings, bookings, revenue: bookings * Math.round(2800 + r() * 900) });
  }
  const sum = (k: keyof DayRow) => daily.reduce((a, x) => a + (x[k] as number), 0);
  const sessions = sum('sessions');
  const mk = (channel: string, source: string, medium: string, campaign: string, share: number, conv: number, bounce: number): SourceRow => {
    const s = Math.round(sessions * share);
    const booked = Math.round(s * conv);
    return {
      channel, source, medium, campaign, sessions: s,
      viewed: Math.round(s * (0.5 - bounce * 0.3)), began: Math.round(s * conv * 2.6), booked, bookings: booked,
      revenue: booked * Math.round(3000 + r() * 500), bounced: Math.round(s * bounce), contacts: Math.round(s * 0.03),
    };
  };
  const sources = [
    mk('google_ads', 'google', 'cpc', 'adana-marka', 0.2, 0.04, 0.32),
    mk('google_ads', 'google', 'cpc', 'usak-genel', 0.1, 0.012, 0.58),
    mk('meta_ads', 'facebook', 'paid_social', 'hafta-sonu-firsati', 0.1, 0.017, 0.52),
    mk('organik_arama', '', '', '', 0.26, 0.026, 0.4),
    mk('dogrudan', '', '', '', 0.16, 0.03, 0.38),
    mk('sosyal', 'instagram', 'social', '', 0.08, 0.01, 0.55),
    mk('yonlendirme', '', '', '', 0.06, 0.008, 0.5),
    mk('email', 'bulten', 'email', 'ekim', 0.04, 0.05, 0.25),
  ];
  const bk = sum('bookings');
  const heat: Report['heat'] = [];
  for (let dow = 1; dow <= 7; dow++) for (let hr = 0; hr < 24; hr++) {
    const peak = Math.exp(-Math.pow((hr - 21) / 4.2, 2)) + 0.55 * Math.exp(-Math.pow((hr - 12) / 3, 2));
    heat.push({ dow, hr, n: Math.round(((len * 3) / 7) * (0.1 + peak) * (0.7 + r() * 0.6)) });
  }
  const rooms: RoomRow[] = [
    { room_id: 1, room_name: 'Çift Kişilik Oda', hotel_name: 'UYUROOM Hotel Adana', price_per_night: 1800, views: 410, viewers: 380, began: 112, bookings: 41, revenue: 41 * 2100 },
    { room_id: 2, room_name: '3 Kişilik Oda', hotel_name: 'UYUROOM Hotel Uşak', price_per_night: 2800, views: 360, viewers: 330, began: 90, bookings: 28, revenue: 28 * 3300 },
    { room_id: 3, room_name: 'Tek Kişilik Oda', hotel_name: 'UYUROOM Hotel Adana', price_per_night: 1400, views: 220, viewers: 205, began: 31, bookings: 6, revenue: 6 * 1500 },
    { room_id: 4, room_name: 'Aile Odası', hotel_name: 'UYUROOM Hotel Uşak', price_per_night: 3200, views: 190, viewers: 175, began: 52, bookings: 0, revenue: 0 },
  ];
  const hotelRev = Math.round(sum('revenue') * 0.58);
  return {
    range: { from: range.from, to: range.to, hotel: null },
    totals: {
      sessions, page_views: sum('page_views'), viewed_room: sum('room_views'), searched: Math.round(sessions * 0.34),
      began: sum('begin_bookings'), booked_sessions: bk, bookings: bk, revenue: sum('revenue'),
      contacts: Math.round(sessions * 0.03), bounced: Math.round(sessions * 0.43),
    },
    daily, sources,
    pages: [
      { path: '/', views: Math.round(sessions * 1.1), sessions: Math.round(sessions * 0.98) },
      { path: '/tesisler', views: Math.round(sessions * 0.7), sessions: Math.round(sessions * 0.55) },
      { path: '/room/1', views: 410, sessions: 380 },
      { path: '/room/2', views: 360, sessions: 330 },
      { path: '/booking', views: sum('begin_bookings'), sessions: sum('begin_bookings') },
      { path: '/contact', views: Math.round(sessions * 0.09), sessions: Math.round(sessions * 0.08) },
    ],
    landings: [
      { path: '/', sessions: Math.round(sessions * 0.62), viewed: Math.round(sessions * 0.25), booked: Math.round(bk * 0.5), bounced: Math.round(sessions * 0.25) },
      { path: '/tesis/2', sessions: Math.round(sessions * 0.18), viewed: Math.round(sessions * 0.1), booked: Math.round(bk * 0.2), bounced: Math.round(sessions * 0.12) },
      { path: '/room/1', sessions: Math.round(sessions * 0.1), viewed: Math.round(sessions * 0.09), booked: Math.round(bk * 0.2), bounced: Math.round(sessions * 0.03) },
    ],
    rooms,
    devices: [
      { device: 'mobile', sessions: Math.round(sessions * 0.7), booked: Math.round(bk * 0.55), revenue: Math.round(sum('revenue') * 0.52) },
      { device: 'desktop', sessions: Math.round(sessions * 0.25), booked: Math.round(bk * 0.4), revenue: Math.round(sum('revenue') * 0.44) },
      { device: 'tablet', sessions: Math.round(sessions * 0.05), booked: Math.round(bk * 0.05), revenue: Math.round(sum('revenue') * 0.04) },
    ],
    browsers: [{ browser: 'Chrome', sessions: Math.round(sessions * 0.55) }, { browser: 'Safari', sessions: Math.round(sessions * 0.33) }, { browser: 'Samsung', sessions: Math.round(sessions * 0.07) }, { browser: 'Edge', sessions: Math.round(sessions * 0.05) }],
    os: [{ os: 'Android', sessions: Math.round(sessions * 0.45) }, { os: 'iOS', sessions: Math.round(sessions * 0.27) }, { os: 'Windows', sessions: Math.round(sessions * 0.22) }, { os: 'macOS', sessions: Math.round(sessions * 0.06) }],
    heat,
    search: {
      searches: Math.round(sessions * 0.34), avg_lead_days: 9.4, avg_stay_nights: 1.7,
      lead_buckets: { d0_1: 190, d2_7: 330, d8_30: 260, d31_plus: 60 },
      stay_buckets: { n1: 420, n2: 300, n3: 90, n4_plus: 30 },
      guests: [{ guests: 1, n: 120 }, { guests: 2, n: 520 }, { guests: 3, n: 140 }, { guests: 4, n: 60 }],
      checkin_months: [{ month: addDays(range.to, 0).slice(0, 7), n: 480 }, { month: addDays(range.to, 31).slice(0, 7), n: 260 }],
    },
    bookings: {
      total: bk + 2, active: bk, cancelled: 2, revenue: sum('revenue'), avg_value: Math.round(div(sum('revenue'), bk)), avg_nights: 1.8, avg_guests: 2.1, avg_lead_days: 6.2,
      promo_used: Math.round(bk * 0.12), discount_total: Math.round(sum('revenue') * 0.03),
      by_status: [{ k: 'confirmed', n: bk - 3 }, { k: 'pending', n: 3 }, { k: 'cancelled', n: 2 }],
      by_payment: [{ k: 'pay_at_hotel', n: Math.round(bk * 0.62), revenue: Math.round(sum('revenue') * 0.6) }, { k: 'bank_transfer', n: Math.round(bk * 0.3), revenue: Math.round(sum('revenue') * 0.32) }, { k: 'card', n: Math.round(bk * 0.08), revenue: Math.round(sum('revenue') * 0.08) }],
      by_hotel: [{ k: 'UYUROOM Hotel Adana', n: Math.round(bk * 0.58), revenue: hotelRev }, { k: 'UYUROOM Hotel Uşak', n: Math.round(bk * 0.42), revenue: sum('revenue') - hotelRev }],
      by_room: rooms.map((x) => ({ k: x.room_name, hotel: x.hotel_name ?? '', n: x.bookings, revenue: x.revenue })),
      by_checkin_dow: [1, 2, 3, 4, 5, 6, 7].map((dow) => ({ dow, n: Math.round((bk / 7) * (dow === 5 || dow === 6 ? 1.8 : 0.7)) })),
      by_checkin_month: [{ month: range.to.slice(0, 7), n: Math.round(bk * 0.7), revenue: Math.round(sum('revenue') * 0.7) }, { month: addDays(range.to, 31).slice(0, 7), n: Math.round(bk * 0.3), revenue: Math.round(sum('revenue') * 0.3) }],
      lead_buckets: { d0_1: Math.round(bk * 0.25), d2_7: Math.round(bk * 0.4), d8_30: Math.round(bk * 0.27), d31_plus: Math.round(bk * 0.08) },
      daily: daily.map((x) => ({ d: x.d, n: x.bookings, revenue: x.revenue })),
    },
    booking_sources: [
      { channel: 'google_ads', n: Math.round(bk * 0.4), revenue: Math.round(sum('revenue') * 0.42) },
      { channel: 'organik_arama', n: Math.round(bk * 0.22), revenue: Math.round(sum('revenue') * 0.2) },
      { channel: 'dogrudan', n: Math.round(bk * 0.16), revenue: Math.round(sum('revenue') * 0.16) },
      { channel: 'meta_ads', n: Math.round(bk * 0.1), revenue: Math.round(sum('revenue') * 0.1) },
      { channel: 'bilinmiyor', n: Math.round(bk * 0.12), revenue: Math.round(sum('revenue') * 0.12) },
    ],
  };
}

export function demoSpend(range: Range): SpendRow[] {
  const r = rng(Date.parse(range.to) % 99991);
  const out: SpendRow[] = [];
  const len = daysBetween(range.from, range.to) + 1;
  for (let i = 0; i < len; i++) {
    const day = addDays(range.from, i);
    out.push({ day, channel: 'google_ads', campaign: 'adana-marka', cost: Math.round(180 + r() * 60), clicks: Math.round(55 + r() * 20), impressions: Math.round(1300 + r() * 300) });
    out.push({ day, channel: 'google_ads', campaign: 'usak-genel', cost: Math.round(140 + r() * 50), clicks: Math.round(48 + r() * 18), impressions: Math.round(2600 + r() * 500) });
    out.push({ day, channel: 'meta_ads', campaign: 'hafta-sonu-firsati', cost: Math.round(90 + r() * 40), clicks: Math.round(40 + r() * 20), impressions: Math.round(5200 + r() * 800) });
  }
  return out;
}

/* ---------- Otomatik öneriler ---------- */
export interface Insight { tone: 'good' | 'warn' | 'info'; title: string; text: string }

export function buildInsights(rep: Report, spend: SpendRow[], goals: Goals, range: Range): Insight[] {
  const out: Insight[] = [];
  const t = rep.totals;
  if (t.sessions < 30) {
    out.push({ tone: 'info', title: 'Veri henüz az', text: 'Yorumların sağlıklı olması için en az birkaç yüz ziyaret gerekir. Çerez bandını kabul eden ziyaretçiler sayıldığı için rakamlar gerçek trafikten düşüktür.' });
    return out;
  }
  // Huni: en büyük kayıp
  const steps = [
    { name: 'oda sayfasına geçiş', a: t.sessions, b: t.viewed_room },
    { name: 'rezervasyon formunu açma', a: t.viewed_room, b: t.began },
    { name: 'rezervasyonu tamamlama', a: t.began, b: t.booked_sessions },
  ];
  const worst = steps.map((s) => ({ ...s, loss: s.a > 0 ? 1 - s.b / s.a : 0 })).sort((x, y) => y.loss - x.loss)[0];
  if (worst && worst.a >= 20) {
    out.push({
      tone: worst.loss > 0.7 ? 'warn' : 'info',
      title: `En büyük kayıp: ${worst.name}`,
      text: `Bu adıma gelenlerin %${Math.round(worst.loss * 100)}'i sonraki adıma geçmiyor. Reklam metni ile sayfanın verdiği söz uyuşuyor mu, fiyat ve fotoğraflar net mi kontrol edin.`,
    });
  }
  // Cihaz
  const mob = rep.devices.find((d) => d.device === 'mobile');
  const desk = rep.devices.find((d) => d.device === 'desktop');
  if (mob && desk && mob.sessions >= 30 && desk.sessions >= 15) {
    const mr = ratio(mob.booked, mob.sessions);
    const dr = ratio(desk.booked, desk.sessions);
    if (dr > 0 && mr < dr * 0.6) {
      out.push({ tone: 'warn', title: 'Mobilde dönüşüm düşük', text: `Mobil ziyaretçilerin %${fmtDec(mr)}'i rezervasyon yapıyor, masaüstünde bu oran %${fmtDec(dr)}. Mobil trafiğin payı %${Math.round(ratio(mob.sessions, t.sessions))}; form ve hız iyileştirmesi en çok buradan kazandırır.` });
    }
  }
  // Açılış sayfası çıkış
  const badLanding = rep.landings.filter((l) => l.sessions >= 20 && l.bounced / l.sessions > 0.6).sort((a, b) => b.sessions - a.sessions)[0];
  if (badLanding) {
    out.push({ tone: 'warn', title: `Açılış sayfası ${badLanding.path} çok çıkış alıyor`, text: `Bu sayfaya gelenlerin %${Math.round(ratio(badLanding.bounced, badLanding.sessions))}'i başka bir şey yapmadan ayrılıyor. Reklamların bu sayfaya yönlenmesi doğru mu, daha uygun bir sayfa (örneğin doğrudan oda sayfası) denenebilir.` });
  }
  // Harcama bazlı
  const spendTotal = spend.reduce((a, x) => a + x.cost, 0);
  if (spendTotal > 0) {
    const roas = div(t.revenue, spendTotal);
    const paidRev = rep.sources.filter((s) => CHANNELS[s.channel]?.paid).reduce((a, x) => a + x.revenue, 0);
    const paidRoas = div(paidRev, spendTotal);
    if (goals.target_roas > 0) {
      out.push({
        tone: paidRoas >= goals.target_roas ? 'good' : 'warn',
        title: paidRoas >= goals.target_roas ? 'ROAS hedefin üzerinde' : 'ROAS hedefin altında',
        text: `Reklamdan gelen ölçülen ciro / harcama oranı ${fmtDec(paidRoas, 2)}x, hedef ${fmtDec(goals.target_roas, 2)}x.`,
      });
    } else if (roas > 0) {
      out.push({ tone: 'info', title: `Genel ROAS ${fmtDec(roas, 2)}x`, text: 'Her 1 TL reklam harcamasına karşılık siteden ölçülen ciro. Maliyet sekmesinden hedef girerseniz karşılaştırırım.' });
    }
    // Harcayıp getirmeyen kampanyalar
    const byCamp = new Map<string, number>();
    spend.forEach((s) => s.campaign && byCamp.set(s.campaign, (byCamp.get(s.campaign) ?? 0) + s.cost));
    const noWin = [...byCamp.entries()]
      .filter(([c, cost]) => cost >= 300 && !rep.sources.some((s) => s.campaign === c && s.bookings > 0))
      .sort((a, b) => b[1] - a[1])[0];
    if (noWin) out.push({ tone: 'warn', title: `"${noWin[0]}" kampanyası rezervasyon getirmedi`, text: `${fmtMoney(noWin[1])} harcandı ama ölçülen rezervasyon yok. Hedef kitleyi, anahtar kelimeleri veya bütçeyi gözden geçirin. (Not: yalnızca çerezi kabul edenler ölçülür.)` });
    // Bütçe temposu
    if (goals.monthly_budget > 0) {
      const monthStart = `${range.to.slice(0, 8)}01`;
      const spentMonth = spend.filter((s) => s.day >= monthStart).reduce((a, x) => a + x.cost, 0);
      const dayN = Number(range.to.slice(8, 10));
      const dim = new Date(Number(range.to.slice(0, 4)), Number(range.to.slice(5, 7)), 0).getDate();
      const expected = (goals.monthly_budget * dayN) / dim;
      if (spentMonth > expected * 1.15) out.push({ tone: 'warn', title: 'Bütçe hızlı harcanıyor', text: `Bu ay ${fmtMoney(spentMonth)} harcandı; ayın bu gününe kadar beklenen ${fmtMoney(expected)}. Ay sonunda bütçe aşılabilir.` });
      else if (spentMonth < expected * 0.7 && dayN > 7) out.push({ tone: 'info', title: 'Bütçe geride kalıyor', text: `Bu ay ${fmtMoney(spentMonth)} harcandı; beklenen ${fmtMoney(expected)}. Teklifleri veya kampanya sayısını artırmayı düşünebilirsiniz.` });
    }
  }
  // Arama aciliyeti
  const lb = rep.search.lead_buckets;
  if (lb) {
    const tot = lb.d0_1 + lb.d2_7 + lb.d8_30 + lb.d31_plus;
    if (tot >= 30) {
      const near = ratio(lb.d0_1 + lb.d2_7, tot);
      if (near >= 55) out.push({ tone: 'info', title: 'Son dakika talebi ağırlıkta', text: `Aramaların %${Math.round(near)}'i önümüzdeki 7 gün için. Kısa vadeli kampanyalar, "bugün/bu hafta sonu" odaklı reklam metni ve gün içi bütçe artışı uygun olur.` });
      else if (ratio(lb.d31_plus, tot) >= 30) out.push({ tone: 'info', title: 'İleri tarihli talep yüksek', text: `Aramaların %${Math.round(ratio(lb.d31_plus, tot))}'i 30 günden sonrası için. Erken rezervasyon teklifi iyi çalışabilir.` });
    }
  }
  // En iyi saatler
  const byHr = new Map<number, number>();
  rep.heat.forEach((h) => byHr.set(h.hr, (byHr.get(h.hr) ?? 0) + h.n));
  const tot = [...byHr.values()].reduce((a, b) => a + b, 0);
  if (tot >= 60) {
    const top = [...byHr.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h]) => h).sort((a, b) => a - b);
    out.push({ tone: 'info', title: 'Ziyaretçiler en çok bu saatlerde geliyor', text: `${top.map((h) => `${String(h).padStart(2, '0')}:00`).join(', ')}. Reklam zamanlamasını ve bütçe dağılımını bu saatlere göre ayarlayabilirsiniz.` });
  }
  // Çok bakılan ama rezervasyonsuz oda
  const idle = rep.rooms.filter((r) => r.views >= 40 && r.bookings === 0).sort((a, b) => b.views - a.views)[0];
  if (idle) out.push({ tone: 'warn', title: `${idle.room_name ?? 'Oda'} çok bakılıyor ama satılmıyor`, text: `${fmtInt(idle.views)} görüntüleme, ${fmtInt(idle.began)} rezervasyon başlatma, 0 rezervasyon. Fiyat, fotoğraf veya doluluk bilgisi sorun olabilir.` });
  // Ölçüm kapsamı
  if (rep.bookings.active > 0) {
    const measured = t.bookings;
    const cover = ratio(measured, rep.bookings.active);
    if (cover < 70) out.push({ tone: 'info', title: `Rezervasyonların %${Math.round(cover)}'i ölçülebildi`, text: 'Çerezi kabul etmeyen ziyaretçilerin rezervasyonları kaynak olarak görünmez. Gerçek ciro ölçülen rakamdan yüksektir; Rezervasyonlar sekmesindeki toplamlar eksiksizdir.' });
  }
  return out;
}

/* ---------- Ortak bağlam ---------- */
export interface Ctx {
  rep: Report;
  prev: Report;
  spend: SpendRow[];
  prevSpend: SpendRow[];
  goals: Goals;
  notes: Note[];
  range: Range;
  prevRange: Range;
  hotel: number | null;
  demo: boolean;
  reload: () => void;
}

export const sumSpend = (rows: SpendRow[]) => rows.reduce((a, x) => a + x.cost, 0);
export const paidRevenue = (rep: Report) => rep.sources.filter((s) => CHANNELS[s.channel]?.paid).reduce((a, x) => a + x.revenue, 0);
export const paidBookings = (rep: Report) => rep.sources.filter((s) => CHANNELS[s.channel]?.paid).reduce((a, x) => a + x.bookings, 0);

export interface ChannelAgg {
  channel: string;
  sessions: number;
  viewed: number;
  began: number;
  booked: number;
  bookings: number;
  revenue: number;
  bounced: number;
  contacts: number;
  cost: number;
  clicks: number;
  impressions: number;
}
export function aggregateChannels(rep: Report, spend: SpendRow[]): ChannelAgg[] {
  const m = new Map<string, ChannelAgg>();
  const get = (c: string) => {
    let a = m.get(c);
    if (!a) {
      a = { channel: c, sessions: 0, viewed: 0, began: 0, booked: 0, bookings: 0, revenue: 0, bounced: 0, contacts: 0, cost: 0, clicks: 0, impressions: 0 };
      m.set(c, a);
    }
    return a;
  };
  rep.sources.forEach((s) => {
    const a = get(s.channel);
    a.sessions += s.sessions; a.viewed += s.viewed; a.began += s.began; a.booked += s.booked;
    a.bookings += s.bookings; a.revenue += s.revenue; a.bounced += s.bounced; a.contacts += s.contacts;
  });
  spend.forEach((s) => {
    const a = get(s.channel);
    a.cost += s.cost; a.clicks += s.clicks; a.impressions += s.impressions;
  });
  return [...m.values()].sort((a, b) => b.sessions - a.sessions);
}
