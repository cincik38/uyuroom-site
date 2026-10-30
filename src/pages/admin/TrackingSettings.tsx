import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CircleDashed, LogOut, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { getSession, logoutAdmin } from '@/lib/ota';
import { TRACKING_PATTERNS } from '@/lib/analytics';

type Key = keyof typeof TRACKING_PATTERNS;
type Values = Record<Key, string>;

const EMPTY: Values = {
  ga4_id: '',
  ads_id: '',
  ads_booking_label: '',
  ads_phone_label: '',
  ads_whatsapp_label: '',
  meta_pixel_id: '',
};

const ERRORS: Record<Key, string> = {
  ga4_id: 'Ölçüm kimliği G- ile başlamalı, örneğin G-ABC123DEF4.',
  ads_id: 'Google Ads kimliği AW- ile başlayıp rakamlarla devam etmeli, örneğin AW-123456789.',
  ads_booking_label: 'Etiket 8-40 karakter olmalı; harf, rakam, tire ve alt çizgi içerebilir.',
  ads_phone_label: 'Etiket 8-40 karakter olmalı; harf, rakam, tire ve alt çizgi içerebilir.',
  ads_whatsapp_label: 'Etiket 8-40 karakter olmalı; harf, rakam, tire ve alt çizgi içerebilir.',
  meta_pixel_id: 'Pixel kimliği yalnızca rakamlardan oluşmalı (8-20 hane).',
};

const input =
  'w-full h-11 px-3 rounded-xl border bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400 font-mono';

const Field: React.FC<{
  id: Key;
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}> = ({ id, label, hint, placeholder, value, error, onChange }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-slate-800 mb-1.5">
      {label}
    </label>
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      spellCheck={false}
      aria-invalid={Boolean(error)}
      aria-describedby={`${id}-hint`}
      className={`${input} ${error ? 'border-red-400' : 'border-slate-200'}`}
    />
    <p id={`${id}-hint`} className={`mt-1.5 text-xs leading-relaxed ${error ? 'text-red-600' : 'text-slate-500'}`}>
      {error || hint}
    </p>
  </div>
);

const Status: React.FC<{ on: boolean }> = ({ on }) =>
  on ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
      <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
      <CircleDashed className="w-3.5 h-3.5" /> Girilmedi
    </span>
  );

const Section: React.FC<{ title: string; active: boolean; children: React.ReactNode }> = ({ title, active, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-5">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base sm:text-lg font-bold text-slate-900">{title}</h2>
      <Status on={active} />
    </div>
    {children}
  </section>
);

/** Reklamcı ve yönetici için: Analytics, Google Ads ve Meta Pixel kimliklerini girme sayfası. */
export const TrackingSettings: React.FC = () => {
  const session = getSession();
  const [saved, setSaved] = useState<Values>(EMPTY);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stamp, setStamp] = useState<{ at: string; by: string } | null>(null);

  useEffect(() => {
    document.title = 'Takip Kodları | UYUROOM HOTEL';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tracking_settings').select('key,value,updated_at,updated_by');
    if (error) {
      toast.error('Ayarlar okunamadı. Sayfayı yenileyip tekrar deneyin.');
      setLoading(false);
      return;
    }
    const next = { ...EMPTY };
    let latest: { at: string; by: string } | null = null;
    for (const row of data ?? []) {
      if (row.key in next) next[row.key as Key] = row.value ?? '';
      if (row.updated_by && (!latest || row.updated_at > latest.at)) latest = { at: row.updated_at, by: row.updated_by };
    }
    setSaved(next);
    setValues(next);
    setStamp(latest);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(() => (Object.keys(EMPTY) as Key[]).some((k) => values[k] !== saved[k]), [values, saved]);

  const set = (k: Key, raw: string) => {
    let v = raw.trim();
    const next: Partial<Values> = {};
    if (k === 'ga4_id' || k === 'ads_id') v = v.toUpperCase();
    if (k === 'meta_pixel_id') v = v.replace(/\D/g, '');
    // "AW-123456789/AbCdEfGhIj" biçiminde yapıştırılırsa kimliği ve etiketi ayır
    if ((k === 'ads_booking_label' || k === 'ads_phone_label' || k === 'ads_whatsapp_label') && v.includes('/')) {
      const [id, label] = v.split('/');
      if (/^AW-[0-9]+$/i.test(id) && !values.ads_id) next.ads_id = id.toUpperCase();
      v = label.trim();
    }
    setValues((cur) => ({ ...cur, ...next, [k]: v }));
    setErrors((cur) => ({ ...cur, [k]: undefined }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Partial<Record<Key, string>> = {};
    (Object.keys(EMPTY) as Key[]).forEach((k) => {
      if (values[k] && !TRACKING_PATTERNS[k].test(values[k])) found[k] = ERRORS[k];
    });
    if ((values.ads_booking_label || values.ads_phone_label || values.ads_whatsapp_label) && !values.ads_id) {
      found.ads_id = 'Dönüşüm etiketi girdiyseniz Google Ads kimliğini de girmelisiniz.';
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error('Kırmızı işaretli alanları düzeltin.');
      return;
    }
    setSaving(true);
    const rows = (Object.keys(EMPTY) as Key[]).map((k) => ({ key: k, value: values[k] }));
    const { error } = await supabase.from('tracking_settings').upsert(rows, { onConflict: 'key' });
    setSaving(false);
    if (error) {
      toast.error('Kaydedilemedi. Oturumunuz kapanmış olabilir, yeniden giriş yapın.');
      return;
    }
    toast.success('Kaydedildi. Yeni ziyaretçilerde hemen, daha önce gelenlerde bir sonraki ziyarette geçerli olur.');
    await load();
  };

  const stampText = stamp
    ? `${new Date(stamp.at).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })} · ${stamp.by}`
    : null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <BrandLogo size={44} tagline="Takip Kodları" />
          <div className="flex items-center gap-2">
            {session?.role === 'super_admin' && (
              <Link to="/yonetim/panel">
                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white !bg-transparent text-xs">
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Panel
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:text-white !bg-transparent text-xs"
              onClick={() => logoutAdmin().then(() => { window.location.href = '/yonetim'; })}
            >
              <LogOut className="w-4 h-4 mr-1.5" /> Çıkış
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Takip Kodları</h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
            Google Analytics, Google Ads ve Meta Pixel kimliklerini buraya girin. Kaydedince siteye otomatik eklenir, ayrıca
            kod yüklemeniz gerekmez. Ziyaretçi çerez bandında kabul etmeden hiçbir takip çalışmaz.
          </p>
          <p className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-900 leading-relaxed max-w-2xl">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Bu hesap yalnızca bu sayfayı kullanabilir. Rezervasyonlara ve misafir bilgilerine erişimi yoktur.
              {session?.email ? ` Giriş yapan: ${session.email}` : ''}
            </span>
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-9 h-9 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={save} className="space-y-5" noValidate>
            <Section title="Google Analytics 4" active={Boolean(saved.ga4_id)}>
              <Field
                id="ga4_id"
                label="Ölçüm Kimliği"
                placeholder="G-XXXXXXXXXX"
                hint="Analytics → Yönetici → Veri akışları → Web akışı sayfasında görünür."
                value={values.ga4_id}
                error={errors.ga4_id}
                onChange={(v) => set('ga4_id', v)}
              />
            </Section>

            <Section title="Google Ads dönüşümleri" active={Boolean(saved.ads_id)}>
              <Field
                id="ads_id"
                label="Google Ads Kimliği"
                placeholder="AW-123456789"
                hint="Dönüşüm etiketi kurulumunda göreceğiniz AW- ile başlayan kimlik."
                value={values.ads_id}
                error={errors.ads_id}
                onChange={(v) => set('ads_id', v)}
              />
              <Field
                id="ads_booking_label"
                label="Rezervasyon tamamlandı etiketi"
                placeholder="AbCdEfGhIjKlMnOp"
                hint={'Kodda "send_to" satırındaki eğik çizgiden sonraki bölüm. "AW-123456789/AbCd..." olarak olduğu gibi yapıştırabilirsiniz.'}
                value={values.ads_booking_label}
                error={errors.ads_booking_label}
                onChange={(v) => set('ads_booking_label', v)}
              />
              <Field
                id="ads_phone_label"
                label="Telefon tıklaması etiketi (isteğe bağlı)"
                placeholder="Boş bırakılabilir"
                hint="Ziyaretçi sayfadaki telefon numarasına tıkladığında bu dönüşüm sayılır."
                value={values.ads_phone_label}
                error={errors.ads_phone_label}
                onChange={(v) => set('ads_phone_label', v)}
              />
              <Field
                id="ads_whatsapp_label"
                label="WhatsApp tıklaması etiketi (isteğe bağlı)"
                placeholder="Boş bırakılabilir"
                hint="Ziyaretçi WhatsApp bağlantısına tıkladığında bu dönüşüm sayılır."
                value={values.ads_whatsapp_label}
                error={errors.ads_whatsapp_label}
                onChange={(v) => set('ads_whatsapp_label', v)}
              />
            </Section>

            <Section title="Meta Pixel (Facebook ve Instagram)" active={Boolean(saved.meta_pixel_id)}>
              <Field
                id="meta_pixel_id"
                label="Pixel Kimliği"
                placeholder="1234567890123456"
                hint="Meta Olay Yöneticisi → Veri kaynakları bölümünde görünen rakamlardan oluşan kimlik."
                value={values.meta_pixel_id}
                error={errors.meta_pixel_id}
                onChange={(v) => set('meta_pixel_id', v)}
              />
            </Section>

            <div className="sticky bottom-0 -mx-4 sm:mx-0 bg-slate-100/95 backdrop-blur px-4 sm:px-0 py-3 flex flex-wrap items-center gap-3 border-t border-slate-200 sm:border-0">
              <Button
                type="submit"
                disabled={saving || !dirty}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold h-11 px-6 disabled:opacity-50"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
              {dirty && !saving && <span className="text-xs text-slate-500">Kaydedilmemiş değişiklikler var.</span>}
              {!dirty && stampText && <span className="text-xs text-slate-500">Son güncelleme: {stampText}</span>}
            </div>
          </form>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-600 leading-relaxed space-y-1.5">
          <p className="font-bold text-slate-800 text-sm">Sitenin gönderdiği olaylar</p>
          <p>page_view (sayfa görüntüleme), view_item (oda sayfası), begin_checkout (rezervasyon başladı), purchase (rezervasyon tamamlandı; tutar ve rezervasyon koduyla), contact (telefon veya WhatsApp tıklaması).</p>
          <p>Kontrol için Google Tag Assistant ile uyuroom.com adresini açıp çerez bandında "Kabul Et" seçebilirsiniz.</p>
        </div>
      </main>
    </div>
  );
};

export default TrackingSettings;
