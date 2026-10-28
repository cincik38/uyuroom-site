export type ListingStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type PropertyType = 'hotel' | 'apart' | 'pansiyon' | 'villa' | 'butik' | 'hostel';
export type PaymentMethod = 'pay_at_hotel' | 'bank_transfer' | 'credit_card';

export interface Hotel {
  id: number;
  name: string;
  city: string;
  district?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  image_url?: string;
  gallery?: string;
  features?: string;
  rating?: number;
  map_embed?: string;
  status?: string;

  /** OTA / pazar yeri alanları */
  property_type?: PropertyType | string;
  star_rating?: number;
  owner_email?: string;
  owner_password?: string;
  owner_name?: string;
  owner_phone?: string;
  legal_name?: string;
  tax_number?: string;
  bank_name?: string;
  iban?: string;
  bank_accounts?: string;
  commission_rate?: number;
  listing_status?: ListingStatus | string;
  rejection_note?: string;
  payment_methods?: string;
  check_in_time?: string;
  check_out_time?: string;
  cancellation_policy?: string;
  house_rules?: string;
  guest_score?: number;
  review_count?: number;
  is_platform_owned?: boolean;

  created_at?: string;
  updated_at?: string;
}

export interface Room {
  id: number;
  hotel_id: number;
  name: string;
  room_type: string;
  description?: string;
  price_per_night: number;
  discounted_price?: number;
  capacity: number;
  bed_type?: string;
  size_sqm?: number;
  amenities?: string;
  images?: string;
  is_featured?: boolean;
  available_count?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Booking {
  id?: number;
  booking_code: string;
  hotel_id: number;
  room_id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;

  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  adult_count?: number;
  child_count?: number;
  room_count?: number;
  night_count: number;
  total_price: number;
  discount_amount?: number;
  promo_code?: string;
  rate_plan?: 'refundable' | 'non_refundable' | string;

  commission_rate?: number;
  commission_amount?: number;
  partner_net_amount?: number;
  payout_status?: 'pending' | 'scheduled' | 'paid';
  /** Süper admin tarafından yönetilen komisyon fatura/tahsilat durumu. */
  commission_invoice_status?: 'pending' | 'invoiced' | 'collected' | string;

  payment_method: PaymentMethod;
  payment_status: 'pending' | 'completed' | 'awaiting_transfer' | 'failed';
  booking_status: 'confirmed' | 'pending' | 'cancelled' | 'checked_in' | 'completed' | 'no_show';
  special_requests?: string;
  receipt_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Review {
  id?: number;
  hotel_id?: number;
  room_id?: number;
  booking_code?: string;
  guest_name: string;
  rating: number;
  comment: string;
  stay_date?: string;
  is_approved?: boolean;
  partner_reply?: string;
  created_at?: string;
}

export interface Inquiry {
  id?: number;
  hotel_id?: number;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status?: 'unread' | 'read' | 'replied';
  created_at?: string;
}

export interface RateCalendarEntry {
  id?: number;
  hotel_id: number;
  room_id: number;
  stay_date: string;
  price?: number;
  allotment?: number;
  min_stay?: number;
  is_closed?: boolean;
}

export interface Promotion {
  id?: number;
  hotel_id: number;
  title: string;
  promo_type?: 'early_bird' | 'last_minute' | 'coupon' | 'general' | string;
  discount_type: 'percent' | 'amount';
  discount_value: number;
  promo_code?: string;
  start_date?: string;
  end_date?: string;
  min_nights?: number;
  is_active?: boolean;
}

export interface Payout {
  id?: number;
  hotel_id: number;
  period_label: string;
  gross_amount?: number;
  commission_amount?: number;
  net_amount: number;
  booking_count?: number;
  status?: 'pending' | 'scheduled' | 'paid';
  paid_at?: string;
  note?: string;
}

export interface PlatformSetting {
  id?: number;
  setting_key: string;
  setting_value: string;
}

export interface BankAccount {
  bank_name: string;
  account_holder: string;
  iban: string;
  branch: string;
  note?: string;
}