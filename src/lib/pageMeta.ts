import { useEffect } from 'react';

const SITE = 'UYUROOM HOTEL';

function setMeta(selector: string, attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  const prev = el.content;
  el.content = value;
  return () => { el!.content = prev; };
}

/** Sayfa başlığı + açıklama + canonical; sayfadan çıkınca eski değerlere döner. */
export function usePageMeta(title: string | undefined, description?: string, canonicalPath?: string) {
  useEffect(() => {
    if (!title) return;
    const full = title.includes(SITE) ? title : `${title} | ${SITE}`;
    const prevTitle = document.title;
    document.title = full;
    const undo: Array<() => void> = [
      setMeta('meta[property="og:title"]', 'property', 'og:title', full),
      setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', full),
    ];
    if (description) {
      undo.push(
        setMeta('meta[name="description"]', 'name', 'description', description),
        setMeta('meta[property="og:description"]', 'property', 'og:description', description),
        setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description),
      );
    }
    let canon = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const prevCanon = canon?.href;
    if (canonicalPath && canon) canon.href = `https://uyuroom.com${canonicalPath}`;
    return () => {
      document.title = prevTitle;
      undo.forEach((u) => u());
      if (canon && prevCanon) canon.href = prevCanon;
    };
  }, [title, description, canonicalPath]);
}

export const STATIC_META: Record<string, { title: string; description: string }> = {
  '/tesisler': {
    title: 'Adana ve Uşak Otelleri',
    description: 'UYUROOM HOTEL Adana ve Uşak şubeleri: tarih seçin, müsait odaları ve güncel fiyatları görün. Komisyonsuz doğrudan rezervasyon.',
  },
  '/booking': {
    title: 'Rezervasyon ve Ödeme',
    description: 'Konaklamanızı tamamlayın: otelde ödeme veya havale/EFT ile %5 indirim.',
  },
  '/booking-confirmation': { title: 'Rezervasyon Onayı', description: 'Rezervasyon kodunuz ve konaklama bilgileriniz.' },
  '/booking-query': {
    title: 'Rezervasyon Sorgulama',
    description: 'Rezervasyon kodunuzla (PNR) rezervasyonunuzun durumunu sorgulayın.',
  },
  '/about': {
    title: 'Hakkımızda',
    description: 'UYUROOM HOTEL: Adana Seyhan ve Uşak Merkez’de temiz, sade ve konforlu konaklama.',
  },
  '/policies': {
    title: 'İptal ve Konaklama Koşulları',
    description: 'İptal, iade, havale ile ödeme, giriş-çıkış saatleri ve konaklama kuralları.',
  },
  '/contact': {
    title: 'İletişim ve Konum',
    description: 'UYUROOM HOTEL Adana ve Uşak şubelerinin adres, telefon, WhatsApp ve harita bilgileri.',
  },
  '/blog': {
    title: 'Blog ve Seyahat Rehberi',
    description: 'Adana ve Uşak için gezi rehberleri, konaklama ipuçları ve otel önerileri.',
  },
  '/mesafeli-satis': {
    title: 'Mesafeli Satış Sözleşmesi',
    description: 'UYUROOM HOTEL internet üzerinden konaklama satışına ilişkin mesafeli satış sözleşmesi ve ön bilgilendirme.',
  },
};
