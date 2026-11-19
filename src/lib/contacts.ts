/**
 * UYUROOM HOTEL şube iletişim bilgileri.
 * Tüm sayfalar, footer, topbar ve WhatsApp widget'ı bu tek kaynaktan beslenir.
 */

export interface BranchContact {
  /** Şube anahtarı */
  key: 'adana' | 'usak';
  /** Şube adı */
  name: string;
  /** Şehir */
  city: string;
  /** Ekranda gösterilen telefon formatı */
  phoneDisplay: string;
  /** tel: linki için ham numara */
  phoneRaw: string;
  /** WhatsApp için uluslararası format (başındaki 0 kaldırılır, 90 eklenir) */
  whatsapp: string;
  /** Şube adresi */
  address: string;
  /** Şube e-posta adresi */
  email: string;
}

export const BRANCH_CONTACTS: BranchContact[] = [
  {
    key: 'adana',
    name: 'UYUROOM Hotel Adana',
    city: 'Adana',
    phoneDisplay: '0505 898 76 66',
    phoneRaw: '05058987666',
    whatsapp: '905058987666',
    address: 'Karasoku Mahallesi 28003 Sokak No:1 Seyhan/ADANA',
    email: 'adana@uyuroom.com',
  },
  {
    key: 'usak',
    name: 'UYUROOM Hotel Uşak',
    city: 'Uşak',
    phoneDisplay: '0553 122 22 79',
    phoneRaw: '05531222279',
    whatsapp: '905531222279',
    address: 'Köme Mahallesi Taslak Sokak No:7 Merkez/UŞAK',
    email: 'usak@uyuroom.com',
  },
];

/**
 * Şehir adına göre şube iletişim bilgisini bulur.
 */
export const findBranchContact = (city?: string | null): BranchContact | undefined => {
  if (!city) return undefined;
  const normalized = city.toLocaleLowerCase('tr-TR').trim();
  return BRANCH_CONTACTS.find(
    (b) =>
      normalized.includes(b.city.toLocaleLowerCase('tr-TR')) ||
      normalized.includes(b.key)
  );
};

/**
 * "Konum İste": müşteri haritaya yönlendirilmez; şubenin WhatsApp hattına
 * "konumu gönderebilir misiniz?" mesajı hazır gelir, müşteri gönder'e basar.
 */
export const LOCATION_REQUEST_LABEL = 'Konum İste';

export const buildLocationRequestLink = (city?: string | null): string | null => {
  const branch = findBranchContact(city);
  if (!branch) return null;
  const message = `Merhaba, UYUROOM HOTEL ${branch.city} şubesinin konumunu gönderebilir misiniz?`;
  return `https://wa.me/${branch.whatsapp}?text=${encodeURIComponent(message)}`;
};

/**
 * Şube adresini çözer.
 * Bilinen şubeler (Adana / Uşak) için merkezi sabitlerdeki güncel adres esas alınır;
 * yeni eklenen şubelerde veritabanındaki adres kullanılır.
 */
export const resolveBranchAddress = (city?: string | null, address?: string | null): string => {
  const branch = findBranchContact(city);
  if (branch) return branch.address;
  if (address?.trim()) return address.trim();
  return `${city ?? ''} Şehir Merkezi`;
};

/**
 * Şube için ön tanımlı Türkçe mesajla WhatsApp bağlantısı üretir.
 */
export const buildWhatsAppLink = (branch: BranchContact, customMessage?: string): string => {
  const message =
    customMessage ??
    `Merhaba, UYUROOM HOTEL ${branch.city} şubesi için rezervasyon ve müsaitlik bilgisi almak istiyorum.`;
  return `https://wa.me/${branch.whatsapp}?text=${encodeURIComponent(message)}`;
};
/**
 * Sosyal medya hesapları. Boş bırakılan hesap sitede gösterilmez.
 * Hesap adreslerini buraya yazın (ör. https://www.instagram.com/hesapadi).
 */
export const SOCIAL_LINKS: { key: 'instagram' | 'facebook' | 'google' | 'x' | 'youtube'; label: string; url: string }[] = [
  { key: 'instagram', label: 'Instagram', url: '' },
  { key: 'facebook', label: 'Facebook', url: '' },
  { key: 'google', label: 'Google İşletme Profili', url: '' },
  { key: 'x', label: 'X', url: '' },
  { key: 'youtube', label: 'YouTube', url: '' },
];
