import { supabase } from '@/lib/supabase';
import type { RateCalendarEntry } from '@/lib/types';
import { addDays, nightsBetween, toISODate } from '@/lib/ota';

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export interface StayParams {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  /** Adres çubuğunda geçerli bir tarih aralığı var mı? */
  hasDates: boolean;
}

/** Adres çubuğundaki (check_in, check_out, adults, children) değerlerini doğrulayıp okur. */
export function parseStayParams(params: URLSearchParams): StayParams {
  const today = toISODate(new Date());
  const ci = params.get('check_in') || '';
  const co = params.get('check_out') || '';
  const valid = ISO.test(ci) && ISO.test(co) && ci >= today && nightsBetween(ci, co) > 0 && nightsBetween(ci, co) <= 60;
  const adults = Math.min(Math.max(Number(params.get('adults')) || 2, 1), 10);
  const children = Math.min(Math.max(Number(params.get('children')) || 0, 0), 10);
  return {
    checkIn: valid ? ci : addDays(today, 1),
    checkOut: valid ? co : addDays(today, 2),
    adults,
    children,
    hasDates: valid,
  };
}

/** Verilen gece aralığı için tarih bazlı fiyat/müsaitlik kayıtlarını getirir (çıkış günü dahil değil). */
export async function loadCalendar(
  filter: { hotel_id?: number; room_id?: number },
  checkIn: string,
  checkOut: string,
): Promise<RateCalendarEntry[]> {
  if (!ISO.test(checkIn) || !ISO.test(checkOut) || nightsBetween(checkIn, checkOut) <= 0) return [];
  let q = supabase.from('rate_calendar').select('*').gte('stay_date', checkIn).lt('stay_date', checkOut).limit(2000);
  if (filter.hotel_id) q = q.eq('hotel_id', filter.hotel_id);
  if (filter.room_id) q = q.eq('room_id', filter.room_id);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data || []) as RateCalendarEntry[];
}

export const stayQueryString = (p: { checkIn: string; checkOut: string; adults: number; children: number }) =>
  new URLSearchParams({ check_in: p.checkIn, check_out: p.checkOut, adults: String(p.adults), children: String(p.children) }).toString();
