/**
 * Takip kodları ve gtag kanıtı.
 * Vite'ı açar, Supabase yanıtını test kimlikleriyle değiştirir, sayfanın
 * dataLayer'ına düşen gtag config / conversion çağrılarını ve panelin kayıt isteğini yazar.
 *
 *   node scripts/verify-usak-ads.mjs
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = '/opt/cursor/artifacts';
mkdirSync(OUT, { recursive: true });

const NOW = new Date().toISOString();
const ROWS = [
  ['ga4_id', 'G-TEST123456'],
  ['ads_id', 'AW-18301412707'],
  ['ads_booking_label', 'BookingLabel01'],
  ['ads_phone_label', 'PhoneLabel0001'],
  ['ads_whatsapp_label', 'WhatsLabel0001'],
  ['ads_usak_id', 'AW-18579399747'],
  ['ads_usak_booking_label', 'UsakBookLabel1'],
  ['ads_usak_phone_label', 'UsakPhoneLabel1'],
  ['ads_usak_whatsapp_label', 'UsakWaLabel0001'],
  ['meta_pixel_id', ''],
].map(([key, value]) => ({ key, value, updated_at: NOW, updated_by: 'test@uyuroom.com' }));

let stored = ROWS.map((r) => ({ ...r }));
const posts = [];

function user() {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'owner@uyuroom.com',
    last_sign_in_at: NOW,
    created_at: NOW,
    app_metadata: { provider: 'email' },
    user_metadata: {},
  };
}

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function session() {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60;
  return {
    access_token: `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: user().id, exp, role: 'authenticated' })}.sig`,
    refresh_token: 'refresh-test',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: exp,
    user: user(),
  };
}

async function installRoutes(page) {
  await page.route('**/*googletagmanager.com/**', (route) => route.abort());
  await page.route('**/*google-analytics.com/**', (route) => route.abort());
  await page.route('**/*google.com/g/**', (route) => route.abort());
  await page.route('**/*facebook.net/**', (route) => route.abort());
  await page.route('**/*supabase.co/**', async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();
    const json = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.includes('/auth/v1/user')) return json(user());
    if (url.includes('/auth/v1/token')) return json({ ...session(), user: user() });
    if (url.includes('/auth/v1/logout')) return json({});
    if (url.includes('/rest/v1/rpc/is_admin')) return json(true);
    if (url.includes('/rest/v1/rpc/is_marketing')) return json(false);
    if (url.includes('/rest/v1/tracking_settings')) {
      if (method === 'GET') return json(stored);
      if (method === 'POST' || method === 'PATCH') {
        const body = req.postDataJSON();
        const list = Array.isArray(body) ? body : [body];
        posts.push(list);
        const at = new Date().toISOString();
        for (const row of list) {
          const i = stored.findIndex((r) => r.key === row.key);
          const next = { key: row.key, value: row.value ?? '', updated_at: at, updated_by: 'owner@uyuroom.com' };
          if (i >= 0) stored[i] = next;
          else stored.push(next);
        }
        return json(list);
      }
    }
    return route.continue();
  });
}

const configsOf = (layer) => layer.filter((e) => e[0] === 'config').map((e) => e[1]);
const conversionsOf = (layer) =>
  layer.filter((e) => e[0] === 'event' && e[1] === 'conversion').map((e) => e[2]?.send_to);

const server = spawn('pnpm', ['exec', 'vite', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
let browser;
server.stdout.on('data', (c) => {
  log += c.toString();
});
server.stderr.on('data', (c) => {
  log += c.toString();
});

try {
  const started = Date.now();
  while (!log.includes('Local:') && Date.now() - started < 30000) await delay(200);
  if (!log.includes('Local:')) throw new Error(`Vite açılmadı:\n${log}`);

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await installRoutes(page);

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => (window.dataLayer || []).some((e) => e[0] === 'config' && e[1] === 'AW-18579399747'),
    null,
    { timeout: 10000 },
  );

  const fired = await page.evaluate(async () => {
    const snap = () =>
      (window.dataLayer || []).map((entry) => {
        const list = [];
        for (let i = 0; i < entry.length; i += 1) list.push(entry[i] instanceof Date ? 'Date' : entry[i]);
        return list;
      });
    const click = (sel) => {
      const a = document.querySelector(sel);
      if (!a) return null;
      a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return a.getAttribute('href');
    };
    const clicks = {
      phones: [...document.querySelectorAll('a[href^="tel:"], a[href*="wa.me"]')].map((a) => a.getAttribute('href')),
      usakPhone: click('a[href="tel:05531222279"]'),
      adanaPhone: click('a[href="tel:05058987666"]'),
      usakWa: click('a[href*="905531222279"]'),
    };
    const mod = await import('/src/lib/analytics.ts');
    mod.trackBookingComplete({ code: 'UYU-USAK', value: 1800, roomId: 1, roomName: 'Standart', hotelId: 2, nights: 1 });
    mod.trackBookingComplete({ code: 'UYU-ADANA', value: 1600, roomId: 4, roomName: 'Standart', hotelId: 1, nights: 1 });
    return { clicks, layer: snap() };
  });

  const home = fired.layer;
  const configs = configsOf(home);
  const conversions = conversionsOf(home);
  const evidence = { configs, conversions };
  if (!configs.includes('G-TEST123456') || !configs.includes('AW-18301412707') || !configs.includes('AW-18579399747')) {
    throw new Error(`config eksik: ${JSON.stringify(evidence)}`);
  }
  const expectSend = [
    'AW-18301412707/PhoneLabel0001',
    'AW-18579399747/UsakPhoneLabel1',
    'AW-18301412707/PhoneLabel0001',
    'AW-18301412707/WhatsLabel0001',
    'AW-18579399747/UsakWaLabel0001',
    'AW-18301412707/BookingLabel01',
    'AW-18579399747/UsakBookLabel1',
    'AW-18301412707/BookingLabel01',
  ];
  if (JSON.stringify(conversions) !== JSON.stringify(expectSend)) {
    const names = home.map((e) => e[0]);
    throw new Error(`dönüşümler beklenenden farklı:\n${JSON.stringify({ fired, names, conversions, expectSend }, null, 2)}`);
  }

  await page.goto(`${BASE}/tesis/2`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('a[href="tel:05058987666"]');
  const fresh = await page.evaluate(() => {
    const before = (window.dataLayer || []).length;
    document.querySelector('a[href="tel:05058987666"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return (window.dataLayer || []).slice(before).flatMap((entry) => {
      const list = [];
      for (let i = 0; i < entry.length; i += 1) list.push(entry[i]);
      return list[0] === 'event' && list[1] === 'conversion' ? [list[2]?.send_to] : [];
    });
  });
  if (JSON.stringify(fresh) !== JSON.stringify(['AW-18301412707/PhoneLabel0001'])) {
    throw new Error(`Uşak sayfasındaki Adana numarası karıştı: ${JSON.stringify(fresh)}`);
  }

  const admin = await browser.newPage({ viewport: { width: 1100, height: 1400 } });
  await installRoutes(admin);
  await admin.addInitScript((saved) => {
    localStorage.setItem('sb-xwjmklzuftdkajidcxbl-auth-token', JSON.stringify(saved));
  }, session());
  await admin.goto(`${BASE}/yonetim/takip`, { waitUntil: 'domcontentloaded' });
  const usak = admin.locator('section', { hasText: 'Uşak Google Ads hesabı' });
  await usak.waitFor({ timeout: 10000 });
  const idValue = await admin.locator('#ads_usak_id').inputValue();
  const bookingValue = await admin.locator('#ads_usak_booking_label').inputValue();
  if (idValue !== 'AW-18579399747' || bookingValue !== 'UsakBookLabel1') {
    throw new Error(`panel yüklemedi: ${idValue} / ${bookingValue}`);
  }
  await usak.screenshot({ path: `${OUT}/usak-takip-kodlari.png` });
  await admin.locator('#ads_usak_phone_label').fill('UsakPhoneLabel2');
  await admin.getByRole('button', { name: 'Kaydet' }).click();
  await admin.waitForFunction(
    () => document.querySelector('#ads_usak_phone_label')?.value === 'UsakPhoneLabel2' && document.body.innerText.includes('Kaydedildi'),
    null,
    { timeout: 10000 },
  );
  const reloaded = await admin.locator('#ads_usak_phone_label').inputValue();
  if (reloaded !== 'UsakPhoneLabel2') throw new Error(`kayıt geri okunmadı: ${reloaded}`);
  const usakPost = posts.find((list) => list.some((r) => r.key === 'ads_usak_id'));
  if (!usakPost) throw new Error(`Uşak kayıt isteği yok: ${JSON.stringify(posts)}`);
  const sent = Object.fromEntries(usakPost.map((r) => [r.key, r.value]));
  if (sent.ads_usak_id !== 'AW-18579399747' || sent.ads_usak_phone_label !== 'UsakPhoneLabel2') {
    throw new Error(`kayıt gövdesi hatalı: ${JSON.stringify(sent)}`);
  }
  const basePost = posts.find((list) => list.some((r) => r.key === 'ads_id') && !list.some((r) => r.key === 'ads_usak_id'));
  if (!basePost || basePost.find((r) => r.key === 'ads_id')?.value !== 'AW-18301412707') {
    throw new Error(`mevcut hesap kaydı bozuldu: ${JSON.stringify(posts)}`);
  }

  console.log(JSON.stringify({ ok: true, configs, conversions, adanaOnUsakPage: fresh, saved: sent }, null, 2));
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => undefined);
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {
    server.kill('SIGTERM');
  }
}
