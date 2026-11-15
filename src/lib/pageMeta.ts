import { useEffect } from 'react';
import { jsonLdForPath, metaForPath, PUBLIC_META } from './lodgingData.mjs';

function setMeta(selector: string, attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  const prev = el.content;
  el.content = value;
  return () => {
    el!.content = prev;
  };
}

function absoluteUrl(pathname: string) {
  return `https://uyuroom.com${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

/** Sayfa başlığı + açıklama + canonical; sayfadan çıkınca eski değerlere döner. */
export function usePageMeta(
  title: string | undefined,
  description?: string,
  canonicalPath?: string,
  image?: string,
) {
  useEffect(() => {
    if (!title) return;
    const full = /uyuroom/i.test(title) ? title : `${title} | UYUROOM HOTEL`;
    const prevTitle = document.title;
    document.title = full;
    const undo: Array<() => void> = [
      setMeta('meta[property="og:title"]', 'property', 'og:title', full),
      setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', full),
      setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image'),
    ];
    if (description) {
      undo.push(
        setMeta('meta[name="description"]', 'name', 'description', description),
        setMeta('meta[property="og:description"]', 'property', 'og:description', description),
        setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description),
      );
    }
    if (image) {
      const imageUrl = image.startsWith('http') ? image : absoluteUrl(image);
      undo.push(
        setMeta('meta[property="og:image"]', 'property', 'og:image', imageUrl),
        setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl),
      );
    }
    let canon = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const prevCanon = canon?.href;
    let createdCanon = false;
    if (canonicalPath) {
      const href = absoluteUrl(canonicalPath);
      if (!canon) {
        canon = document.createElement('link');
        canon.rel = 'canonical';
        document.head.appendChild(canon);
        createdCanon = true;
      }
      canon.href = href;
      undo.push(setMeta('meta[property="og:url"]', 'property', 'og:url', href));
    }
    return () => {
      document.title = prevTitle;
      undo.forEach((fn) => fn());
      if (canon && createdCanon) canon.remove();
      else if (canon && prevCanon) canon.href = prevCanon;
    };
  }, [title, description, canonicalPath, image]);
}

/** Ana sayfa şablonundaki başlığı ezmez. Otel, oda ve sabit sayfalar buradan gelir. */
export function useRouteSeo(pathname: string) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const meta = path === '/' ? undefined : metaForPath(path);
  usePageMeta(meta?.title, meta?.description, meta ? path : undefined, meta?.image);
  useLodgingJsonLd(path);
}

function useLodgingJsonLd(path: string) {
  useEffect(() => {
    const data = jsonLdForPath(path);
    let el = document.getElementById('uyuroom-lodging-jsonld') as HTMLScriptElement | null;
    if (!data) {
      el?.remove();
      return;
    }
    if (!el) {
      el = document.createElement('script');
      el.id = 'uyuroom-lodging-jsonld';
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  }, [path]);
}

export const STATIC_META: Record<string, { title: string; description: string }> = PUBLIC_META;
