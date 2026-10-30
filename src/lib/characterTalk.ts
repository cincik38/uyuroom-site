/** Karakterin konuşma balonlarındaki cümleler. Saate ve güne göre seçilir; aynı cümle art arda tekrarlanmaz. */

export type Period = 'sabah' | 'ogle' | 'aksam' | 'gece';

export const periodOf = (d: Date = new Date()): Period => {
  const h = d.getHours();
  if (h >= 5 && h < 11) return 'sabah';
  if (h >= 11 && h < 17) return 'ogle';
  if (h >= 17 && h < 22) return 'aksam';
  return 'gece';
};

const GENEL = [
  'Otelimiz pırıl pırıl!',
  'Odalarımız misafirlerimiz için tertemiz hazırlanır.',
  'Çarşaflar bembeyaz, havlular pamuk gibi.',
  'Temizlik bizim işimiz, huzur sizin hakkınız.',
  'Her oda siz gelmeden önce özenle hazırlanır.',
  'Koridorlar, lobi, odalar... hepsi parlıyor!',
  'Temiz bir oda, iyi bir uykunun yarısıdır.',
  'Yastıklar kabarık, perdeler düzgün, her şey yerli yerinde.',
  'Mis gibi temizlik kokusu bizde standart.',
  'Arabamda temiz havlu ve güler yüzlü bir enerji var.',
  'Bir şey lazım olursa ben buradayım!',
  'Şehrin merkezinde rahat bir mola sizi bekliyor.',
  'Adana mı Uşak mı? İkisinde de sizi bekliyoruz.',
  'Havale ile ödemede %5 indirim var, kaçırmayın!',
  'Doğrudan rezervasyon yapın, ödemeyi otelde yapın.',
  'Şubelerin telefonları hemen aşağıda, bize ulaşabilirsiniz.',
  'Yol tarifine tek tıkla ulaşabilirsiniz.',
  'Odaları aşağıdan inceleyin, hepsi sade ve temiz.',
  'Bugün de her köşeyi parlattım!',
  'Temizlik kokusunu seversiniz, söz.',
];

const PERIOD_LINES: Record<Period, string[]> = {
  sabah: [
    'Günaydın! Güne temiz odalarla başlıyoruz.',
    'Günaydın! Odalar yeni misafirler için hazırlanıyor.',
    'Sabah mesaisi başladı, arabam dolu, kollar sıvalı!',
    'Güne güzel başlayın, odalarımız hazır.',
  ],
  ogle: [
    'Öğle oldu, odalarda temizlik sırası!',
    'Gün ortası ama ben hâlâ pırıl pırılım. Odalar da öyle!',
    'Çıkış yapan odaları hemen hazırlıyorum.',
    'Bugün hangi şehre gidiyorsunuz? Biz iki şehirdeyiz.',
  ],
  aksam: [
    'İyi akşamlar! Odalar giriş için hazır.',
    'Akşam oldu, yeni misafirlerimizi bekliyoruz.',
    'Gün bitti, odalar tertemiz. Yarın için de yer ayırtabilirsiniz.',
    'Akşam yorgunluğunu temiz bir odada atın.',
  ],
  gece: [
    'İyi geceler! Yarın için rezervasyon yapabilirsiniz.',
    'Gece geç oldu. Rahat bir uyku için temiz bir oda hazır.',
    'Uykunuzu yastıklarımız getirir, gerisi bizde.',
    'Sessiz saatler... Planlarınızı şimdiden yapabilirsiniz.',
  ],
};

const HAFTA_SONU = [
  'Hafta sonu planınız var mı? Odalarımız sizi bekler.',
  'Hafta sonu için erken rezervasyon yapın, oda dolmadan!',
];

const GREETINGS: Record<Period, string[]> = {
  sabah: ['Günaydın!', 'Günaydın, hoş geldiniz!'],
  ogle: ['Merhaba!', 'Hoş geldiniz!'],
  aksam: ['İyi akşamlar!', 'Hoş geldiniz!'],
  gece: ['İyi geceler!', 'Hoş geldiniz!'],
};

const CLICKS = [
  'Hihi!',
  'Gıdıklanıyorum!',
  'Merhaba, buradayım!',
  'Bana mı seslendiniz?',
  'Beni fark ettiniz!',
  'Temizliğe ara verdim, size her zaman vaktim var.',
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** Son söylenenleri tekrar etmeden bir cümle seçer. */
export const pickLine = (recent: string[], d: Date = new Date()): string => {
  const day = d.getDay(); // 4 = perşembe ... 6 = cumartesi
  const pool = [...GENEL, ...PERIOD_LINES[periodOf(d)], ...PERIOD_LINES[periodOf(d)], ...(day >= 4 && day <= 6 ? HAFTA_SONU : [])];
  const fresh = pool.filter((l) => !recent.includes(l));
  return pick(fresh.length ? fresh : pool);
};

export const greetingLine = (d: Date = new Date()): string => pick(GREETINGS[periodOf(d)]);
export const clickLine = (): string => pick(CLICKS);

/** Cümle uzunluğuna göre balonun ekranda kalma süresi (ms) */
export const holdMs = (text: string): number => Math.min(7500, Math.max(3500, 2200 + text.length * 55));
