/**
 * Veri katmanı: Atoms SDK ile aynı arayüzü (client.entities.<tablo>.query/get/create/update/delete)
 * Supabase üzerinden sağlar; böylece sayfalar değişmeden çalışır.
 */
import { supabase } from './supabase';

type Filter = Record<string, unknown>;

interface QueryArgs {
  query?: Filter;
  limit?: number;
  skip?: number;
  sort?: string;
}

// Tabloda bulunmayan eski (OTA) alanlar yazılırken sessizce atılır.
const DROP_FIELDS = new Set([
  'owner_email', 'owner_password', 'commission_rate', 'commission_amount', 'partner_net_amount',
  'payout_status', 'commission_invoice_status', 'listing_status', 'rejection_note', 'is_platform_owned',
  'hotel_name',
]);

function clean(data: Record<string, unknown> = {}) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (DROP_FIELDS.has(k)) continue;
    out[k] = v === '' && /(_date|_at)$/.test(k) ? null : v;
  }
  return out;
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function table(name: string) {
  return {
    async query({ query = {}, limit = 100, skip = 0, sort }: QueryArgs = {}) {
      // Misafir rezervasyon sorgusu: tabloyu okumak yerine kod ile güvenli fonksiyon
      if (name === 'bookings' && typeof query.booking_code === 'string' && Object.keys(query).length === 1) {
        const { data, error } = await supabase.rpc('lookup_booking', { p_code: query.booking_code });
        fail(error);
        return { data: { items: data || [], total: (data || []).length } };
      }
      let q = supabase.from(name).select('*', { count: 'exact' });
      for (const [k, v] of Object.entries(query)) q = q.eq(k, v as never);
      if (sort) {
        const desc = sort.startsWith('-');
        q = q.order(desc ? sort.slice(1) : sort, { ascending: !desc });
      }
      q = q.range(skip, skip + limit - 1);
      const { data, error, count } = await q;
      fail(error);
      return { data: { items: data || [], total: count ?? (data || []).length } };
    },
    async get({ id }: { id: string | number }) {
      const { data, error } = await supabase.from(name).select('*').eq('id', id).maybeSingle();
      fail(error);
      return { data };
    },
    async create({ data }: { data: Record<string, unknown> }) {
      // Misafir (anon) ekleme sonrası satırı okuyamaz; bu yüzden geri okuma yapılmaz.
      const { data: sess } = await supabase.auth.getSession();
      if (sess.session) {
        const { data: row, error } = await supabase.from(name).insert(clean(data)).select().single();
        fail(error);
        return { data: row };
      }
      const { error } = await supabase.from(name).insert(clean(data));
      fail(error);
      return { data: { ...data } };
    },
    async update({ id, data }: { id: string | number; data: Record<string, unknown> }) {
      const { data: row, error } = await supabase.from(name).update(clean(data)).eq('id', id).select().single();
      fail(error);
      return { data: row };
    },
    async delete({ id }: { id: string | number }) {
      const { error } = await supabase.from(name).delete().eq('id', id);
      fail(error);
      return { data: { id } };
    },
  };
}

const tables = ['hotels', 'rooms', 'bookings', 'reviews', 'inquiries', 'rate_calendar', 'promotions', 'platform_settings'];

export const client = {
  entities: Object.fromEntries(tables.map((t) => [t, table(t)])) as Record<string, ReturnType<typeof table>>,
};
