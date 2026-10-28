import { supabase, MEDIA_BUCKET } from '@/lib/supabase';

/**
 * Görsel adresi çözümleme yardımcıları.
 *
 * Kayıtlar üç biçimde olabilir:
 *  - Tam URL (yeni yüklemeler kalıcı public URL olarak kaydedilir)
 *  - Proje içi göreli yol (`/assets/...`)
 *  - Eski `object_key` (backend yönlendirme ucu üzerinden gösterilir)
 */

/** Görsel bulunamadığında kullanılacak yedek görsel. */
export const IMAGE_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
      <rect width="640" height="420" fill="#eef2f7"/>
      <g fill="#94a3b8">
        <rect x="250" y="160" width="140" height="100" rx="10" fill="none" stroke="#94a3b8" stroke-width="6"/>
        <circle cx="288" cy="192" r="12"/>
        <path d="M262 250l36-38 28 30 22-18 30 26z"/>
      </g>
      <text x="320" y="310" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#94a3b8">Görsel yok</text>
    </svg>`,
  );

/** Kayıtlı değeri doğrudan `<img src>` içinde kullanılabilir adrese çevirir. */
export function resolveImageUrl(value?: string | null): string {
  const raw = (value || '').trim();
  if (!raw) return IMAGE_PLACEHOLDER;
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  if (raw.startsWith('/')) return raw;
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(raw).data.publicUrl;
}

/** Görsel listesini çözümler; boş listede yedek görsel döner. */
export function resolveImageUrls(values?: (string | null | undefined)[] | null): string[] {
  const list = (values || []).filter((v): v is string => Boolean(v && v.trim()));
  if (!list.length) return [IMAGE_PLACEHOLDER];
  return list.map(resolveImageUrl);
}

/** Kapak görselini çözer: açıkça seçilen kapak yoksa ilk görsel kullanılır. */
export function resolveCoverUrl(
  images?: (string | null | undefined)[] | null,
  cover?: string | null,
): string {
  if (cover && cover.trim()) return resolveImageUrl(cover);
  const list = (images || []).filter((v): v is string => Boolean(v && v.trim()));
  return list.length ? resolveImageUrl(list[0]) : IMAGE_PLACEHOLDER;
}

/** Oda kapağı: odanın kendi ilk fotoğrafı; yoksa tesis görseline düşer. */
export function resolveRoomCoverUrl(
  images?: (string | null | undefined)[] | null,
  fallback?: string | null,
): string {
  const list = (images || [])
    .map((v) => (v ? v.trim() : ''))
    .filter(Boolean);
  if (list.length) return resolveImageUrl(list[0]);
  return resolveCoverUrl([], fallback);
}

/** `<img onError>` için yedek görsele düşüren ortak işleyici. */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement>): void {
  const img = e.currentTarget;
  if (img.src === IMAGE_PLACEHOLDER) return;
  img.src = IMAGE_PLACEHOLDER;
}
