/**
 * Türkiye 81 il verisi: plaka kodu, il adı ve harita üzerindeki yaklaşık konum.
 * Koordinatlar 1000x450 viewBox'a göre normalize edilmiştir.
 */
export interface Province {
  plate: number;
  name: string;
  x: number;
  y: number;
}

export const PROVINCES: Province[] = [
  { plate: 1, name: 'Adana', x: 491, y: 327 },
  { plate: 2, name: 'Adıyaman', x: 629, y: 284 },
  { plate: 3, name: 'Afyonkarahisar', x: 270, y: 230 },
  { plate: 4, name: 'Ağrı', x: 847, y: 181 },
  { plate: 5, name: 'Amasya', x: 514, y: 130 },
  { plate: 6, name: 'Ankara', x: 377, y: 169 },
  { plate: 7, name: 'Antalya', x: 280, y: 332 },
  { plate: 8, name: 'Artvin', x: 790, y: 101 },
  { plate: 9, name: 'Aydın', x: 148, y: 281 },
  { plate: 10, name: 'Balıkesir', x: 150, y: 184 },
  { plate: 11, name: 'Bilecik', x: 246, y: 157 },
  { plate: 12, name: 'Bingöl', x: 730, y: 224 },
  { plate: 13, name: 'Bitlis', x: 804, y: 251 },
  { plate: 14, name: 'Bolu', x: 320, y: 125 },
  { plate: 15, name: 'Burdur', x: 260, y: 288 },
  { plate: 16, name: 'Bursa', x: 204, y: 155 },
  { plate: 17, name: 'Çanakkale', x: 81, y: 157 },
  { plate: 18, name: 'Çankırı', x: 412, y: 133 },
  { plate: 19, name: 'Çorum', x: 474, y: 135 },
  { plate: 20, name: 'Denizli', x: 206, y: 285 },
  { plate: 21, name: 'Diyarbakır', x: 718, y: 278 },
  { plate: 22, name: 'Edirne', x: 89, y: 74 },
  { plate: 23, name: 'Elazığ', x: 671, y: 236 },
  { plate: 24, name: 'Erzincan', x: 684, y: 178 },
  { plate: 25, name: 'Erzurum', x: 766, y: 170 },
  { plate: 26, name: 'Eskişehir', x: 271, y: 177 },
  { plate: 27, name: 'Gaziantep', x: 586, y: 324 },
  { plate: 28, name: 'Giresun', x: 632, y: 116 },
  { plate: 29, name: 'Gümüşhane', x: 683, y: 140 },
  { plate: 30, name: 'Hakkari', x: 878, y: 296 },
  { plate: 31, name: 'Hatay', x: 532, y: 370 },
  { plate: 32, name: 'Isparta', x: 272, y: 286 },
  { plate: 33, name: 'Mersin', x: 459, y: 338 },
  { plate: 34, name: 'İstanbul', x: 200, y: 110 },
  { plate: 35, name: 'İzmir', x: 115, y: 250 },
  { plate: 36, name: 'Kars', x: 849, y: 133 },
  { plate: 37, name: 'Kastamonu', x: 420, y: 90 },
  { plate: 38, name: 'Kayseri', x: 499, y: 234 },
  { plate: 39, name: 'Kırklareli', x: 119, y: 72 },
  { plate: 40, name: 'Kırşehir', x: 438, y: 211 },
  { plate: 41, name: 'Kocaeli', x: 243, y: 123 },
  { plate: 42, name: 'Konya', x: 360, y: 280 },
  { plate: 43, name: 'Kütahya', x: 246, y: 196 },
  { plate: 44, name: 'Malatya', x: 630, y: 254 },
  { plate: 45, name: 'Manisa', x: 128, y: 240 },
  { plate: 46, name: 'Kahramanmaraş', x: 565, y: 296 },
  { plate: 47, name: 'Mardin', x: 741, y: 310 },
  { plate: 48, name: 'Muğla', x: 171, y: 316 },
  { plate: 49, name: 'Muş', x: 777, y: 234 },
  { plate: 50, name: 'Nevşehir', x: 463, y: 240 },
  { plate: 51, name: 'Niğde', x: 462, y: 275 },
  { plate: 52, name: 'Ordu', x: 609, y: 112 },
  { plate: 53, name: 'Rize', x: 731, y: 110 },
  { plate: 54, name: 'Sakarya', x: 266, y: 124 },
  { plate: 55, name: 'Samsun', x: 538, y: 96 },
  { plate: 56, name: 'Siirt', x: 797, y: 277 },
  { plate: 57, name: 'Sinop', x: 483, y: 56 },
  { plate: 58, name: 'Sivas', x: 570, y: 178 },
  { plate: 59, name: 'Tekirdağ', x: 132, y: 112 },
  { plate: 60, name: 'Tokat', x: 548, y: 148 },
  { plate: 61, name: 'Trabzon', x: 694, y: 111 },
  { plate: 62, name: 'Tunceli', x: 686, y: 213 },
  { plate: 63, name: 'Şanlıurfa', x: 651, y: 318 },
  { plate: 64, name: 'Uşak', x: 220, y: 236 },
  { plate: 65, name: 'Van', x: 862, y: 247 },
  { plate: 66, name: 'Yozgat', x: 468, y: 175 },
  { plate: 67, name: 'Zonguldak', x: 329, y: 87 },
  { plate: 68, name: 'Aksaray', x: 432, y: 253 },
  { plate: 69, name: 'Bayburt', x: 718, y: 151 },
  { plate: 70, name: 'Karaman', x: 393, y: 317 },
  { plate: 71, name: 'Kırıkkale', x: 407, y: 173 },
  { plate: 72, name: 'Batman', x: 760, y: 279 },
  { plate: 73, name: 'Şırnak', x: 821, y: 299 },
  { plate: 74, name: 'Bartın', x: 354, y: 77 },
  { plate: 75, name: 'Ardahan', x: 831, y: 105 },
  { plate: 76, name: 'Iğdır', x: 893, y: 169 },
  { plate: 77, name: 'Yalova', x: 214, y: 130 },
  { plate: 78, name: 'Karabük', x: 368, y: 100 },
  { plate: 79, name: 'Kilis', x: 574, y: 342 },
  { plate: 80, name: 'Osmaniye', x: 534, y: 323 },
  { plate: 81, name: 'Düzce', x: 300, y: 119 },
];

/** İl adına göre plaka kodu. */
export const PLATE_BY_CITY: Record<string, number> = PROVINCES.reduce(
  (acc, p) => {
    acc[p.name] = p.plate;
    return acc;
  },
  {} as Record<string, number>,
);

/** Yaygın ilçe listeleri (öne çıkan iller için); diğer illerde serbest giriş yapılır. */
export const DISTRICTS_BY_CITY: Record<string, string[]> = {
  Adana: ['Seyhan', 'Çukurova', 'Yüreğir', 'Sarıçam', 'Ceyhan', 'Kozan'],
  Uşak: ['Merkez', 'Banaz', 'Eşme', 'Karahallı', 'Sivaslı', 'Ulubey'],
  İstanbul: ['Fatih', 'Beyoğlu', 'Şişli', 'Kadıköy', 'Beşiktaş', 'Bakırköy', 'Üsküdar'],
  Ankara: ['Çankaya', 'Keçiören', 'Yenimahalle', 'Altındağ', 'Mamak', 'Etimesgut'],
  İzmir: ['Konak', 'Bornova', 'Karşıyaka', 'Çeşme', 'Buca', 'Alsancak'],
  Antalya: ['Muratpaşa', 'Konyaaltı', 'Kepez', 'Alanya', 'Manavgat', 'Side'],
  Bursa: ['Osmangazi', 'Nilüfer', 'Yıldırım', 'Mudanya', 'İnegöl'],
  Muğla: ['Bodrum', 'Fethiye', 'Marmaris', 'Datça', 'Menteşe'],
  Mersin: ['Akdeniz', 'Yenişehir', 'Mezitli', 'Erdemli', 'Silifke'],
  Gaziantep: ['Şahinbey', 'Şehitkamil', 'Oğuzeli', 'Nizip'],
  Trabzon: ['Ortahisar', 'Akçaabat', 'Yomra', 'Of'],
  Konya: ['Selçuklu', 'Meram', 'Karatay', 'Beyşehir'],
};

export function districtsFor(city: string): string[] {
  return DISTRICTS_BY_CITY[city] || [];
}
