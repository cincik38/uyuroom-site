// Blog sayfalarında şablon (ana sayfa) meta etiketleri ile makaleye özel etiketlerin
// çakışmasını temizler: tek canonical, tek og:*, tek description.
import fs from 'node:fs';
import path from 'node:path';

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
  tpl = tpl.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');

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
