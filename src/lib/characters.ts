/** İşbaşındaki personeli temsil eden animasyonlu karakterler. Ziyaretçiye yalnızca rol gösterilir, isim asla. */
export type CharacterRole = 'kat-gorevlisi';

export interface CharacterDef {
  label: string;
  /** public/images/karakterler/ altındaki dosya öneki */
  file: string;
  /** Konuşma balonunda kullanılan selam metni */
  greeting: string;
}

export const CHARACTERS: Record<CharacterRole, CharacterDef> = {
  'kat-gorevlisi': {
    label: 'Kat görevlisi',
    file: 'kat-gorevlisi',
    greeting: 'Hoş geldiniz!',
  },
};

export type CharacterClip = 'bekleme' | 'selam' | 'tepki';

/** Safari ve iOS şeffaf videoyu yalnızca HEVC (.mov) ile oynatır; diğer tarayıcılar WebM kullanır. */
export const prefersHevc = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const safari = /Safari/.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR|Android/.test(ua);
  return ios || safari;
};

export const clipUrl = (role: CharacterRole, clip: CharacterClip): string =>
  `/images/karakterler/${CHARACTERS[role].file}-${clip}.${prefersHevc() ? 'mov' : 'webm'}`;
