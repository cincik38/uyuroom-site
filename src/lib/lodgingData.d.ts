export const SITE_ORIGIN: string;

export interface SeoAddress {
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode?: string;
  addressCountry: string;
}

export interface HotelSeo {
  id: number;
  path: string;
  name: string;
  title: string;
  description: string;
  telephone: string;
  email: string;
  image: string;
  priceRange: string;
  numberOfRooms: number;
  checkinTime: string;
  checkoutTime: string;
  address: SeoAddress;
  geo?: { latitude: number; longitude: number };
  amenities: string[];
}

export interface RoomSeo {
  id: number;
  hotelId: number;
  name: string;
  capacity: number;
  path: string;
  title: string;
  description: string;
  image?: string;
}

export interface PageMeta {
  title: string;
  description: string;
  image?: string;
}

export const HOTELS: HotelSeo[];
export const ROOMS: RoomSeo[];
export const PUBLIC_META: Record<string, PageMeta>;
export const INDEXABLE_PATHS: string[];
export const SHELL_PATHS: string[];

export function roomTitle(city?: string, roomName?: string, hotelName?: string): string;
export function roomDescription(hotelName?: string, roomName?: string, capacity?: number, city?: string): string;
export function metaForPath(pathname?: string): PageMeta | undefined;
export function hotelJsonLd(hotel: HotelSeo): Record<string, unknown>;
export function lodgingGraph(hotels?: HotelSeo[]): Record<string, unknown>;
export function jsonLdForPath(pathname?: string): Record<string, unknown> | null;
export function assertNoStarRating(value: unknown): void;
