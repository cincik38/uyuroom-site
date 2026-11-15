/**
 * UYUROOM otelleri için arama ve harita verisi.
 * starRating bilinçli olarak yoktur; şema üreticisi bunu da reddeder.
 * Fiyat aralığı sitedeki gecelik oda fiyatlarına göredir.
 */

export const SITE_ORIGIN = 'https://uyuroom.com';

const CHECKIN = '14:00';
const CHECKOUT = '12:00';

export const HOTELS = [
  {
    id: 1,
    path: '/tesis/1',
    name: 'UYUROOM Hotel Adana',
    title: "Adana Otel | UYUROOM Hotel Adana – Seyhan'da Uygun Konaklama",
    description:
      "Seyhan Karasoku'da 30 odalı UYUROOM Hotel Adana: klima, ücretsiz otopark, mini mutfak, kahvaltı, asansör ve Wi-Fi. Giriş 14:00, çıkış 12:00.",
    telephone: '+905058987666',
    email: 'adana@uyuroom.com',
    image: `${SITE_ORIGIN}/images/uyuroom-adana-hotel-exterior.webp`,
    priceRange: '₺1600–₺3000',
    numberOfRooms: 30,
    checkinTime: CHECKIN,
    checkoutTime: CHECKOUT,
    address: {
      streetAddress: 'Karasoku Mahallesi 28003 Sokak No:1',
      addressLocality: 'Seyhan',
      addressRegion: 'Adana',
      postalCode: '01010',
      addressCountry: 'TR',
    },
    amenities: ['Klima', 'Ücretsiz otopark', 'Mini mutfak', 'Kahvaltı', 'Asansör', 'Ücretsiz Wi-Fi'],
  },
  {
    id: 2,
    path: '/tesis/2',
    name: 'UYUROOM Hotel Uşak',
    title: 'Uşak Otel | UYUROOM Hotel Uşak – Merkezde Uygun Konaklama',
    description:
      "Uşak Merkez Köme'de 20 odalı UYUROOM Hotel Uşak. Otopark ve Wi-Fi ile şehir merkezinde uygun konaklama. Giriş 14:00, çıkış 12:00.",
    telephone: '+905531222279',
    email: 'usak@uyuroom.com',
    image: `${SITE_ORIGIN}/images/uyuroom-usak-hotel-exterior.webp`,
    priceRange: '₺1800–₺2800',
    numberOfRooms: 20,
    checkinTime: CHECKIN,
    checkoutTime: CHECKOUT,
    // Taslak Sokak, Köme kısa bir sokak; kapı no OSM'de ayrı nokta değil. Sokak ortası.
    geo: { latitude: 38.6801393, longitude: 29.4049403 },
    address: {
      streetAddress: 'Köme Mahallesi Taslak Sokak No:7',
      addressLocality: 'Merkez',
      addressRegion: 'Uşak',
      postalCode: '64400',
      addressCountry: 'TR',
    },
    amenities: ['Otopark', 'Ücretsiz Wi-Fi'],
  },
];

const ROOM_SEED = [
  { id: 4, hotelId: 1, name: 'Standart Oda', capacity: 2 },
  { id: 5, hotelId: 1, name: 'Aile Odası', capacity: 3 },
  { id: 6, hotelId: 1, name: '4 Kişilik Oda', capacity: 4 },
  { id: 1, hotelId: 2, name: 'Standart Çift Kişilik', capacity: 2 },
  { id: 2, hotelId: 2, name: 'Süit Oda', capacity: 2 },
  { id: 3, hotelId: 2, name: '3 Kişilik Oda', capacity: 3 },
];

export function roomTitle(city, roomName, hotelName) {
  const place = city ? `${city} ` : '';
  const brand = hotelName || 'UYUROOM Hotel';
  return `${place}${roomName} | ${brand}`.replace(/\s+/g, ' ').trim();
}

export function roomDescription(hotelName, roomName, capacity, city) {
  const who = hotelName || 'UYUROOM Hotel';
  const where = city ? `${city} şehir merkezi` : 'şehir merkezi';
  return `${who} ${roomName}: ${capacity} kişilik oda, ${where}. Tarihe göre fiyatı görün, komisyonsuz doğrudan rezervasyon yapın.`;
}

export const ROOMS = ROOM_SEED.map((room) => {
  const hotel = HOTELS.find((item) => item.id === room.hotelId);
  const city = hotel?.address.addressRegion || '';
  return {
    ...room,
    path: `/room/${room.id}`,
    title: roomTitle(city, room.name, hotel?.name),
    description: roomDescription(hotel?.name, room.name, room.capacity, city),
    image: hotel?.image,
  };
});

export const PUBLIC_META = {
  '/tesisler': {
    title: 'Adana ve Uşak Otelleri | UYUROOM Odalar ve Fiyatlar',
    description:
      'UYUROOM Hotel Adana ve Uşak odalarını karşılaştırın. Tarih seçin, müsaitliği ve gecelik fiyatı görün, komisyonsuz doğrudan rezervasyon yapın.',
  },
  '/booking': {
    title: 'Rezervasyon ve Ödeme | UYUROOM Hotel',
    description: 'Konaklamanızı tamamlayın: otelde ödeme veya havale/EFT ile %5 indirim.',
  },
  '/booking-confirmation': {
    title: 'Rezervasyon Onayı | UYUROOM Hotel',
    description: 'Rezervasyon kodunuz ve konaklama bilgileriniz.',
  },
  '/booking-query': {
    title: 'Rezervasyon Sorgulama | UYUROOM Hotel',
    description: 'Rezervasyon kodunuzla (PNR) UYUROOM Hotel Adana veya Uşak konaklamanızın durumunu sorgulayın.',
  },
  '/about': {
    title: 'Hakkımızda | UYUROOM Hotel Adana ve Uşak',
    description:
      "UYUROOM Hotel, Adana Seyhan ve Uşak Merkez'de temiz ve konforlu şehir otelleri işletir. Doğrudan rezervasyon, kapıda ödeme ve havale seçeneği.",
  },
  '/policies': {
    title: 'İptal ve Konaklama Koşulları | UYUROOM Hotel',
    description: 'Giriş 14:00, çıkış 12:00. İptal, iade, kapıda ödeme ve havale ile %5 indirim koşulları.',
  },
  '/contact': {
    title: 'İletişim | UYUROOM Hotel Adana ve Uşak',
    description:
      'Adana Seyhan ve Uşak Merkez şubelerinin adres, telefon ve harita bilgileri. Adana 0505 898 76 66, Uşak 0553 122 22 79.',
  },
  '/blog': {
    title: 'Adana ve Uşak Gezi Rehberi | UYUROOM Blog',
    description: 'Adana ve Uşak için gezi rehberleri, otel ipuçları ve doğrudan rezervasyon yazıları.',
  },
  '/mesafeli-satis': {
    title: 'Mesafeli Satış Sözleşmesi | UYUROOM Hotel',
    description: 'UYUROOM Hotel internet üzerinden konaklama satışına ilişkin mesafeli satış sözleşmesi ve ön bilgilendirme.',
  },
  '/kvkk': {
    title: 'KVKK Aydınlatma Metni ve Çerez Politikası | UYUROOM Hotel',
    description: 'UYUROOM Hotel kişisel verilerin korunması aydınlatma metni, çerez tercihleri ve başvuru yolları.',
  },
};

/** Arama motoruna açılan sayfalar. Ödeme adımı ve yönetim dahil değildir. */
export const INDEXABLE_PATHS = [
  '/',
  '/tesisler',
  ...HOTELS.map((hotel) => hotel.path),
  ...ROOMS.map((room) => room.path),
  '/about',
  '/contact',
  '/policies',
  '/kvkk',
  '/mesafeli-satis',
  '/booking-query',
  '/blog',
];

export const SHELL_PATHS = INDEXABLE_PATHS.filter((path) => path !== '/' && path !== '/blog');

function normalizePath(pathname) {
  return (pathname || '/').replace(/\/+$/, '') || '/';
}

export function metaForPath(pathname) {
  const path = normalizePath(pathname);
  const hotel = HOTELS.find((item) => item.path === path);
  if (hotel) return { title: hotel.title, description: hotel.description, image: hotel.image };
  const room = ROOMS.find((item) => item.path === path);
  if (room) return { title: room.title, description: room.description, image: room.image };
  return PUBLIC_META[path];
}

function hotelNode(hotel) {
  const node = {
    '@type': ['Hotel', 'LodgingBusiness'],
    '@id': `${SITE_ORIGIN}${hotel.path}#hotel`,
    name: hotel.name,
    url: `${SITE_ORIGIN}${hotel.path}`,
    image: hotel.image,
    telephone: hotel.telephone,
    email: hotel.email,
    priceRange: hotel.priceRange,
    numberOfRooms: hotel.numberOfRooms,
    checkinTime: hotel.checkinTime,
    checkoutTime: hotel.checkoutTime,
    address: {
      '@type': 'PostalAddress',
      streetAddress: hotel.address.streetAddress,
      addressLocality: hotel.address.addressLocality,
      addressRegion: hotel.address.addressRegion,
      postalCode: hotel.address.postalCode,
      addressCountry: hotel.address.addressCountry,
    },
    amenityFeature: hotel.amenities.map((name) => ({
      '@type': 'LocationFeatureSpecification',
      name,
      value: true,
    })),
  };
  if (hotel.geo) {
    node.geo = {
      '@type': 'GeoCoordinates',
      latitude: hotel.geo.latitude,
      longitude: hotel.geo.longitude,
    };
  }
  assertNoStarRating(node);
  return node;
}

export function hotelJsonLd(hotel) {
  const data = { '@context': 'https://schema.org', ...hotelNode(hotel) };
  assertNoStarRating(data);
  return data;
}

export function lodgingGraph(hotels = HOTELS) {
  const data = {
    '@context': 'https://schema.org',
    '@graph': hotels.map((hotel) => hotelNode(hotel)),
  };
  assertNoStarRating(data);
  return data;
}

export function jsonLdForPath(pathname) {
  const path = normalizePath(pathname);
  const hotel = HOTELS.find((item) => item.path === path);
  if (hotel) return hotelJsonLd(hotel);
  if (path === '/' || path === '/contact' || path === '/tesisler') return lodgingGraph();
  return null;
}

export function assertNoStarRating(value) {
  const text = JSON.stringify(value);
  if (/starRating/i.test(text)) {
    throw new Error('Otel şemasında starRating bulunamaz');
  }
}

assertNoStarRating(lodgingGraph());
