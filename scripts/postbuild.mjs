// Blog sayfalarında şablon (ana sayfa) meta etiketleri ile makaleye özel etiketlerin
// çakışmasını temizler: tek canonical, tek og:*, tek description.
// Ardından herkese açık sayfalar için başlık/canonical kabuğu ve sitemap üretir.
import fs from 'node:fs';
import path from 'node:path';
import { getBlogRoutes } from '../prerender/blog-routes.js';
import { getSitemapLastmod } from '../prerender/blog-sitemap.js';
import {
  INDEXABLE_PATHS,
  SHELL_PATHS,
  SITE_ORIGIN,
  jsonLdForPath,
  metaForPath,
  assertNoStarRating,
} from '../src/lib/lodgingData.mjs';

const dist = path.resolve(process.cwd(), 'dist');
const marker = '<meta name="prerender-static-page"';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name === 'index.html') out.push(p);
  }
  return out;
}

const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
let fixed = 0;

for (const file of walk(path.join(dist, 'blog'))) {
  let html = fs.readFileSync(file, 'utf8');
  const i = html.indexOf(marker);
  if (i === -1) continue;
  let tpl = html.slice(0, i);
  const rest = html.slice(i);
  const headEnd = rest.indexOf('</head>');
  const blogHead = rest.slice(0, headEnd);

  const metaTags = blogHead.match(/<meta [^>]*>/g) ?? [];
  const keys = new Set(metaTags.map((t) => attr(t, 'name') ?? attr(t, 'property')).filter(Boolean));
  const get = (k) => {
    const t = metaTags.find((t) => (attr(t, 'name') ?? attr(t, 'property')) === k);
    return t ? attr(t, 'content') : undefined;
  };

  // Şablondaki çakışan etiketleri sil
  const drop = new Set([...keys, 'og:title', 'og:description', 'og:type']);
  tpl = tpl.replace(/<meta [^>]*>\s*/g, (t) => {
    const k = attr(t, 'name') ?? attr(t, 'property');
    return k && drop.has(k) ? '' : t;
  });
  tpl = tpl.replace(/<link rel="canonical"[^>]*>\s*/g, '');
  tpl = tpl.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/g, '');

  const url = get('og:url');
  const extra = [
    url && `<link rel="canonical" href="${url}">`,
    get('twitter:title') && `<meta property="og:title" content="${esc(get('twitter:title'))}">`,
    get('description') && `<meta property="og:description" content="${esc(get('description'))}">`,
    '<meta property="og:type" content="article">',
  ].filter(Boolean).join('\n');

  html = tpl.replace('</head>', '') + extra + '\n' + rest;
  fs.writeFileSync(file, html);
  fixed++;
}
console.log(`postbuild: ${fixed} blog sayfası temizlendi`);

const homePath = path.join(dist, 'index.html');
const HOME_TITLE = 'UYUROOM HOTEL | Adana & Uşak Otel Rezervasyon';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function replaceTitle(html, title) {
  return html.replace(/(<title\b[^>]*>)[\s\S]*?(<\/title>)/i, `$1${escapeHtml(title)}$2`);
}

function replaceMeta(html, attr, key, value) {
  const re = new RegExp(
    `(<meta\\b[^>]*\\b${attr}=["']${key}["'][^>]*\\bcontent=["'])[^"']*(["'])`,
    'i',
  );
  if (!re.test(html)) {
    return html.replace(
      '</head>',
      `    <meta ${attr}="${key}" content="${escapeHtml(value)}" />\n  </head>`,
    );
  }
  return html.replace(re, `$1${escapeHtml(value)}$2`);
}

function replaceCanonical(html, url) {
  const link = `<link rel="canonical" href="${escapeHtml(url)}" />`;
  if (/<link\b[^>]*rel=["']canonical["'][^>]*>/i.test(html)) {
    return html.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/i, link);
  }
  return html.replace('</head>', `    ${link}\n  </head>`);
}

function replaceJsonLd(html, data) {
  assertNoStarRating(data);
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const tag = `<script id="uyuroom-lodging-jsonld" type="application/ld+json">${json}</script>`;
  if (/<script\b[^>]*id=["']uyuroom-lodging-jsonld["'][^>]*>[\s\S]*?<\/script>/i.test(html)) {
    return html.replace(/<script\b[^>]*id=["']uyuroom-lodging-jsonld["'][^>]*>[\s\S]*?<\/script>/i, tag);
  }
  if (/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i.test(html)) {
    return html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i, tag);
  }
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function stripJsonLd(html) {
  return html
    .replace(/<script\b[^>]*id=["']uyuroom-lodging-jsonld["'][^>]*>[\s\S]*?<\/script>\s*/gi, '')
    .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');
}

let homeHtml = fs.readFileSync(homePath, 'utf8');
if (!homeHtml.includes(HOME_TITLE) || !homeHtml.includes('data-mgx-overview="title"')) {
  throw new Error('Ana sayfa başlığı veya data-mgx-overview işareti kaybolmuş');
}
homeHtml = replaceJsonLd(homeHtml, jsonLdForPath('/'));
fs.writeFileSync(homePath, homeHtml);

for (const routePath of SHELL_PATHS) {
  const meta = metaForPath(routePath);
  if (!meta) throw new Error(`Sayfa meta eksik: ${routePath}`);
  const url = `${SITE_ORIGIN}${routePath}`;
  let html = homeHtml;
  html = replaceTitle(html, meta.title);
  html = replaceMeta(html, 'name', 'description', meta.description);
  html = replaceMeta(html, 'property', 'og:title', meta.title);
  html = replaceMeta(html, 'property', 'og:description', meta.description);
  html = replaceMeta(html, 'name', 'twitter:title', meta.title);
  html = replaceMeta(html, 'name', 'twitter:description', meta.description);
  html = replaceCanonical(html, url);
  html = replaceMeta(html, 'property', 'og:url', url);
  if (meta.image) {
    html = replaceMeta(html, 'property', 'og:image', meta.image);
    html = replaceMeta(html, 'name', 'twitter:image', meta.image);
  }
  const data = jsonLdForPath(routePath);
  html = data ? replaceJsonLd(html, data) : stripJsonLd(html);
  const dir = path.join(dist, routePath.replace(/^\//, ''));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}
console.log(`postbuild: ${SHELL_PATHS.length} sayfa kabuğu yazıldı`);

let notFoundHtml = homeHtml;
const notFoundTitle = 'Sayfa bulunamadı | UYUROOM Hotel';
const notFoundDescription = 'Aradığınız sayfa UYUROOM Hotel sitesinde yok.';
notFoundHtml = replaceTitle(notFoundHtml, notFoundTitle);
notFoundHtml = replaceMeta(notFoundHtml, 'name', 'description', notFoundDescription);
notFoundHtml = replaceMeta(notFoundHtml, 'property', 'og:title', notFoundTitle);
notFoundHtml = replaceMeta(notFoundHtml, 'property', 'og:description', notFoundDescription);
notFoundHtml = replaceMeta(notFoundHtml, 'name', 'twitter:title', notFoundTitle);
notFoundHtml = replaceMeta(notFoundHtml, 'name', 'twitter:description', notFoundDescription);
notFoundHtml = stripJsonLd(notFoundHtml);
notFoundHtml = notFoundHtml.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>\s*/i, '');
if (!/name=["']robots["']/i.test(notFoundHtml)) {
  notFoundHtml = notFoundHtml.replace(
    '</head>',
    '    <meta name="robots" content="noindex" />\n  </head>',
  );
}
fs.writeFileSync(path.join(dist, '404.html'), notFoundHtml);
console.log('postbuild: 404.html yazıldı');

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function canonicalPath(routePath) {
  const trimmed = routePath.replace(/\/+$/, '');
  return trimmed || '/';
}

function priorityFor(routePath) {
  if (routePath === '/') return '1.0';
  if (routePath.startsWith('/tesis/')) return '0.9';
  if (routePath === '/tesisler' || routePath === '/contact') return '0.8';
  if (routePath.startsWith('/room/')) return '0.7';
  if (routePath.startsWith('/blog')) return '0.6';
  return '0.4';
}

const lastmod = getSitemapLastmod();
const urls = new Map();
for (const routePath of INDEXABLE_PATHS) {
  urls.set(canonicalPath(routePath), null);
}
for (const routePath of getBlogRoutes()) {
  const canon = canonicalPath(routePath);
  const stamp = lastmod[routePath] || lastmod[routePath.endsWith('/') ? routePath : `${routePath}/`];
  urls.set(canon, stamp instanceof Date ? stamp.toISOString().slice(0, 10) : null);
}

const body = [...urls.entries()]
  .sort(([a], [b]) => a.localeCompare(b, 'tr'))
  .map(([routePath, date]) => {
    const loc = `${SITE_ORIGIN}${routePath === '/' ? '/' : routePath}`;
    const last = date ? `\n    <lastmod>${date}</lastmod>` : '';
    return `  <url>\n    <loc>${xmlEscape(loc)}</loc>${last}\n    <priority>${priorityFor(routePath)}</priority>\n  </url>`;
  })
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
console.log(`postbuild: sitemap ${urls.size} adres`);

const usakShell = fs.readFileSync(path.join(dist, 'tesis/2/index.html'), 'utf8');
const adanaShell = fs.readFileSync(path.join(dist, 'tesis/1/index.html'), 'utf8');
const homeCheck = fs.readFileSync(homePath, 'utf8');
if (!usakShell.includes('Uşak Otel | UYUROOM Hotel Uşak')) throw new Error('Uşak başlığı kabuğa yazılmadı');
if (!usakShell.includes('+905531222279')) throw new Error('Uşak telefonu şemada yok');
if (!adanaShell.includes('"latitude":36.98517') || !adanaShell.includes('"longitude":35.32564')) {
  throw new Error('Adana koordinatı şemada yok');
}
const roomShell = fs.readFileSync(path.join(dist, 'room/4/index.html'), 'utf8');
if (!roomShell.includes('"@type":"HotelRoom"') || !roomShell.includes('"@type":"Offer"')) {
  throw new Error('Oda sayfasında HotelRoom/Offer şeması yok');
}
const notFoundCheck = fs.readFileSync(path.join(dist, '404.html'), 'utf8');
if (!notFoundCheck.includes('Sayfa bulunamadı') || !notFoundCheck.includes('noindex')) {
  throw new Error('404.html eksik');
}
if (notFoundCheck.includes('uyuroom-lodging-jsonld')) throw new Error('404 sayfası otel şeması taşıyor');
if (/starRating/i.test(usakShell) || /starRating/i.test(adanaShell) || /starRating/i.test(homeCheck)) {
  throw new Error('Şemada starRating var');
}
if (!homeCheck.includes(HOME_TITLE) || !homeCheck.includes('data-mgx-overview="title"')) {
  throw new Error('Ana sayfa başlık işareti bozuldu');
}
if (!sitemap.includes(`${SITE_ORIGIN}/tesis/1`) || !sitemap.includes(`${SITE_ORIGIN}/blog/usak-otel-konaklama`)) {
  throw new Error('Sitemap otel veya blog adresini kaçırdı');
}
if (sitemap.includes('/yonetim') || sitemap.includes('/booking-confirmation') || sitemap.includes('/personel')) {
  throw new Error('Sitemap kapalı bir adresi listelemiş');
}
const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
if (!robots.includes('Sitemap: https://uyuroom.com/sitemap.xml')) throw new Error('robots sitemap satırı yok');
if (/^Disallow:\s*\/booking\s*$/m.test(robots)) throw new Error('Disallow /booking, rezervasyon sorgusunu da kapatır');
