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
 * Verilen adres için Google Maps arama bağlantısı üretir.
 * Mobilde tıklandığında cihazın harita uygulamasında konumu açar.
 */
export const buildMapLink = (address: string, branchName?: string): string => {
  const query = branchName ? `${branchName}, ${address}` : address;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

/**
 * Şube kaydından (veritabanı veya sabit) harita bağlantısı üretir.
 * Veritabanı adresi boşsa merkezi sabitlerdeki adres kullanılır.
 */
export const buildBranchMapLink = (city?: string | null, address?: string | null, name?: string | null): string => {
  const branch = findBranchContact(city);
  const resolvedAddress = resolveBranchAddress(city, address);
  const resolvedName = name?.trim() || branch?.name || 'UYUROOM Hotel';
  return buildMapLink(resolvedAddress, resolvedName);
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