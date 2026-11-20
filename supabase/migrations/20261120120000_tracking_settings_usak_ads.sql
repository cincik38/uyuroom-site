-- Uşak Google Ads hesabı için tracking_settings anahtarları.
-- Mevcut satırları değiştirmez. Betik tek transaction'dır; hata olursa geri alınır.
-- Supabase SQL Editor'da bir kez çalıştırın (site yayını bu tabloyu kendisi güncellemez).
--
-- Yeni anahtarlar:
--   ads_usak_id, ads_usak_booking_label, ads_usak_phone_label, ads_usak_whatsapp_label
-- Biçim kuralları mevcut anahtarlarla aynıdır (AW- kimliği, 8-40 karakter etiket, boş değer serbest).

begin;

do $$
declare
  r record;
begin
  for r in
    select c.conname, pg_get_constraintdef(c.oid) as def
    from pg_constraint c
    where c.conrelid = 'public.tracking_settings'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) not ilike '%ads_usak_id%'
      and (
        pg_get_constraintdef(c.oid) ilike '%ads_id%'
        or pg_get_constraintdef(c.oid) ilike '%ads_booking_label%'
        or pg_get_constraintdef(c.oid) ilike '%ga4_id%'
        or pg_get_constraintdef(c.oid) ilike '%meta_pixel_id%'
      )
  loop
    execute format('alter table public.tracking_settings drop constraint %I', r.conname);
    raise notice 'tracking_settings kısıtı güncellenmek üzere kaldırıldı: %', r.conname;
  end loop;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.tracking_settings'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%ads_usak_id%'
  ) then
    alter table public.tracking_settings
      add constraint tracking_settings_value_format check (
        key in (
          'ga4_id',
          'ads_id',
          'ads_booking_label',
          'ads_phone_label',
          'ads_whatsapp_label',
          'meta_pixel_id',
          'ads_usak_id',
          'ads_usak_booking_label',
          'ads_usak_phone_label',
          'ads_usak_whatsapp_label'
        )
        and (
          value = ''
          or (key = 'ga4_id' and value ~ '^G-[A-Z0-9]{6,14}$')
          or (key in ('ads_id', 'ads_usak_id') and value ~ '^AW-[0-9]{6,14}$')
          or (
            key in (
              'ads_booking_label',
              'ads_phone_label',
              'ads_whatsapp_label',
              'ads_usak_booking_label',
              'ads_usak_phone_label',
              'ads_usak_whatsapp_label'
            )
            and value ~ '^[A-Za-z0-9_-]{8,40}$'
          )
          or (key = 'meta_pixel_id' and value ~ '^[0-9]{8,20}$')
        )
      );
  end if;
end $$;

insert into public.tracking_settings (key, value)
values
  ('ads_usak_id', ''),
  ('ads_usak_booking_label', ''),
  ('ads_usak_phone_label', ''),
  ('ads_usak_whatsapp_label', '')
on conflict (key) do nothing;

commit;
