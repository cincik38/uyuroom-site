import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CircleDashed, Copy, Download, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Card, Empty, HBars, KPI, LineChart, TableWrap, Td, Th } from './charts';
import TrackingSettings from '../TrackingSettings';
import {
  CHANNELS, Ctx, DOW, Goals, Note, SPEND_CHANNELS, SpendRow, aggregateChannels, channelColor, channelLabel, daysBetween, div, downloadCsv, fmtDay, fmtDec, fmtInt, fmtMoney, fmtMoney2, fmtPct,
  parseSpendCsv, ratio, slug, sumSpend, todayIst,
} from './lib';

const PAY: Record<string, string> = { pay_at_hotel: 'Otelde ödeme', bank_transfer: 'Havale / EFT', card: 'Kart', credit_card: 'Kart' };
const STATUS: Record<string, string> = { pending: 'Beklemede', confirmed: 'Onaylı', cancelled: 'İptal', canceled: 'İptal', completed: 'Tamamlandı', no_show: 'Gelmedi', rejected: 'Reddedildi' };
const inputCls = 'w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';

const copy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Kopyalandı');
  } catch {
    toast.error('Kopyalanamadı, metni elle seçip kopyalayın.');
  }
};

/* ================================ REZERVASYONLAR ================================ */
export const BookingsTab: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const { rep } = ctx;
  const b = rep.bookings;
  const s = rep.search;
  const measured = rep.totals.bookings;
  const cover = ratio(measured, b.active);
  const days = b.daily.length ? rep.daily.map((d) => d.d) : [];
  const byDay = new Map(b.daily.map((x) => [x.d, x]));
  const lb = b.lead_buckets;
  const sl = s.lead_buckets;
  const ss = s.stay_buckets;
  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2.5 leading-relaxed">
        Bu sekme rezervasyon tablosundan gelir ve <b>eksiksizdir</b> (çerez kabulüne bağlı değildir). Kimlik, telefon ve e-posta gibi misafir bilgileri hiçbir zaman gösterilmez.
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <KPI label="Rezervasyon" value={fmtInt(b.active)} sub={`${fmtInt(b.cancelled)} iptal/red`} />
        <KPI label="Ciro" value={fmtMoney(b.revenue)} sub={b.discount_total > 0 ? `${fmtMoney(b.discount_total)} indirim` : undefined} />
        <KPI label="Ortalama tutar" value={fmtMoney(b.avg_value)} />
        <KPI label="Ortalama konaklama" value={`${fmtDec(b.avg_nights)} gece`} sub={`${fmtDec(b.avg_guests)} kişi`} />
        <KPI label="Ortalama öne alım" value={`${fmtDec(b.avg_lead_days)} gün`} sub="Rezervasyondan girişe" />
        <KPI label="Kupon kullanımı" value={fmtInt(b.promo_used)} />
      </div>

      <Card title="Günlük rezervasyon sayısı">
        {days.length === 0 || b.active === 0 ? (
          <Empty title="Bu aralıkta rezervasyon yok" text="" />
        ) : (
          <LineChart days={days} series={[{ key: 'n', label: 'Rezervasyon', color: '#eb6834', values: days.map((d) => byDay.get(d)?.n ?? 0) }]} height={200} />
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Rezervasyonlar hangi kaynaktan?" hint={`Site ölçümüyle eşleşen: ${fmtInt(measured)} / ${fmtInt(b.active)} (%${fmtDec(cover, 0)}). Eşleşmeyenler çerezi kabul etmeyen ya da telefonla gelen ziyaretçilerdir.`}>
          <HBars
            rows={rep.booking_sources.map((x) => ({ label: x.channel === 'bilinmiyor' ? 'Ölçülemeyen' : channelLabel(x.channel), value: x.n, color: channelColor(x.channel), right: fmtMoney(x.revenue) }))}
            format={fmtInt}
            empty="Veri yok"
          />
        </Card>
        <Card title="Otele göre">
          <HBars rows={b.by_hotel.map((x) => ({ label: x.k ?? '—', value: x.n, right: fmtMoney(x.revenue ?? 0), color: '#2a78d6' }))} format={fmtInt} />
        </Card>
        <Card title="Ödeme yöntemi">
          <HBars rows={b.by_payment.map((x) => ({ label: PAY[x.k ?? ''] ?? x.k ?? '—', value: x.n, right: fmtMoney(x.revenue ?? 0), color: '#1baf7a' }))} format={fmtInt} />
        </Card>
        <Card title="Durum">
          <HBars rows={b.by_status.map((x) => ({ label: STATUS[x.k ?? ''] ?? x.k ?? '—', value: x.n, color: '#eda100' }))} format={fmtInt} />
        </Card>
        <Card title="En çok rezervasyon alan odalar">
          <HBars rows={b.by_room.filter((x) => x.n > 0).slice(0, 8).map((x) => ({ label: `${x.k ?? '—'}${x.hotel ? ` · ${x.hotel.replace('UYUROOM Hotel ', '')}` : ''}`, value: x.n, right: fmtMoney(x.revenue ?? 0), color: '#6250d6' }))} format={fmtInt} />
        </Card>
        <Card title="Giriş tarihi: hangi günler dolu?" hint="Rezervasyonların konaklamaya başladığı hafta günü">
          <HBars rows={b.by_checkin_dow.map((x) => ({ label: DOW[x.dow - 1], value: x.n, color: '#2a78d6' }))} format={fmtInt} />
        </Card>
        <Card title="Ne kadar önceden rezervasyon yapılıyor?" hint="Rezervasyon tarihi ile giriş tarihi arasındaki süre">
          <HBars rows={[
            { label: 'Aynı gün / ertesi gün', value: lb.d0_1, color: '#eb6834' },
            { label: '2–7 gün önce', value: lb.d2_7, color: '#eda100' },
            { label: '8–30 gün önce', value: lb.d8_30, color: '#1baf7a' },
            { label: '30 günden fazla', value: lb.d31_plus, color: '#2a78d6' },
          ]} format={fmtInt} />
        </Card>
        <Card title="Giriş ayları" hint="Gelecekteki doluluk">
          <HBars rows={b.by_checkin_month.map((x) => ({ label: x.month, value: x.n, right: fmtMoney(x.revenue), color: '#2a78d6' }))} format={fmtInt} />
        </Card>
      </div>

      <Card title="Arama davranışı" hint="Sitede tarih arayanların istekleri (çerezi kabul edenler). Hangi tarihlere, kaç kişi için, ne kadar süreyle bakıyorlar?">
        {!s.searches ? (
          <Empty title="Henüz arama kaydı yok" text="Ana sayfadaki arama formu kullanıldıkça burada görünür." />
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <KPI label="Arama" value={fmtInt(s.searches)} />
              <KPI label="Ort. öne alım" value={`${fmtDec(s.avg_lead_days ?? 0)} gün`} />
              <KPI label="Ort. konaklama" value={`${fmtDec(s.avg_stay_nights ?? 0)} gece`} />
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Girişe kalan süre</p>
                <HBars rows={[
                  { label: '0–1 gün', value: sl?.d0_1 ?? 0 }, { label: '2–7 gün', value: sl?.d2_7 ?? 0 }, { label: '8–30 gün', value: sl?.d8_30 ?? 0 }, { label: '30+ gün', value: sl?.d31_plus ?? 0 },
                ]} format={fmtInt} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Kaç gece</p>
                <HBars rows={[
                  { label: '1 gece', value: ss?.n1 ?? 0 }, { label: '2 gece', value: ss?.n2 ?? 0 }, { label: '3 gece', value: ss?.n3 ?? 0 }, { label: '4+ gece', value: ss?.n4_plus ?? 0 },
                ]} format={fmtInt} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Kaç kişi</p>
                <HBars rows={(s.guests ?? []).map((g) => ({ label: `${g.guests} kişi`, value: g.n }))} format={fmtInt} />
              </div>
            </div>
            {(s.checkin_months?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Aranan giriş ayları (talep)</p>
                <HBars rows={s.checkin_months!.map((m) => ({ label: m.month, value: m.n }))} format={fmtInt} />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

/* ================================ MALİYET & ROAS ================================ */
export const SpendTab: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const { rep, spend, goals, demo, reload, range } = ctx;
  const channels = useMemo(() => aggregateChannels(rep, spend).filter((c) => c.cost > 0 || CHANNELS[c.channel]?.paid), [rep, spend]);
  const total = sumSpend(spend);
  const campaigns = useMemo(() => [...new Set(spend.map((s) => s.campaign).filter(Boolean))], [spend]);
  const guard = () => {
    if (demo) {
      toast.error('Örnek veri açıkken kayıt yapılamaz. Önce örnek veriyi kapatın.');
      return false;
    }
    return true;
  };

  /* tek kayıt */
  const [f, setF] = useState({ day: todayIst(), channel: 'google_ads', campaign: '', cost: '', clicks: '', impressions: '' });
  const [busy, setBusy] = useState(false);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guard()) return;
    const cost = Number(f.cost.replace(',', '.'));
    if (!f.day || !Number.isFinite(cost) || cost < 0) return toast.error('Tarih ve maliyeti kontrol edin.');
    setBusy(true);
    const { error } = await supabase.from('ad_spend').upsert(
      [{ day: f.day, channel: f.channel, campaign: f.campaign.trim().toLowerCase().slice(0, 100), cost, clicks: Math.max(0, Math.round(Number(f.clicks) || 0)), impressions: Math.max(0, Math.round(Number(f.impressions) || 0)) }],
      { onConflict: 'day,channel,campaign' },
    );
    setBusy(false);
    if (error) return toast.error('Kaydedilemedi: oturumunuz kapanmış olabilir.');
    toast.success('Harcama kaydedildi');
    setF({ ...f, cost: '', clicks: '', impressions: '' });
    reload();
  };

  /* CSV */
  const [csv, setCsv] = useState('');
  const [csvCh, setCsvCh] = useState('google_ads');
  const parsed = useMemo(() => (csv.trim() ? parseSpendCsv(csv, csvCh) : null), [csv, csvCh]);
  const onFile = async (file?: File | null) => {
    if (!file) return;
    if (file.size > 2_000_000) return toast.error('Dosya çok büyük (en fazla 2 MB).');
    setCsv(await file.text());
  };
  const importCsv = async () => {
    if (!guard() || !parsed || parsed.rows.length === 0) return;
    setBusy(true);
    for (let i = 0; i < parsed.rows.length; i += 400) {
      const { error } = await supabase.from('ad_spend').upsert(parsed.rows.slice(i, i + 400), { onConflict: 'day,channel,campaign' });
      if (error) {
        setBusy(false);
        return toast.error('İçe aktarma yarıda kesildi. Oturumunuzu kontrol edip tekrar deneyin.');
      }
    }
    setBusy(false);
    toast.success(`${parsed.rows.length} satır içe aktarıldı`);
    setCsv('');
    reload();
  };

  const del = async (r: SpendRow) => {
    if (!guard() || !window.confirm(`${fmtDay(r.day, true)} · ${channelLabel(r.channel)} · ${r.campaign || 'kampanyasız'} kaydı silinsin mi?`)) return;
    const { error } = await supabase.from('ad_spend').delete().eq('day', r.day).eq('channel', r.channel).eq('campaign', r.campaign);
    if (error) return toast.error('Silinemedi.');
    reload();
  };

  /* hedefler */
  const [g, setG] = useState<Record<keyof Goals, string>>({ monthly_budget: '', target_roas: '', target_cpa: '', monthly_bookings: '' });
  useEffect(() => {
    setG({ monthly_budget: String(goals.monthly_budget || ''), target_roas: String(goals.target_roas || ''), target_cpa: String(goals.target_cpa || ''), monthly_bookings: String(goals.monthly_bookings || '') });
  }, [goals]);
  const saveGoals = async () => {
    if (!guard()) return;
    const rows = (Object.keys(g) as Array<keyof Goals>).map((k) => ({ key: k, value: Math.max(0, Number(String(g[k]).replace(',', '.')) || 0) }));
    const { error } = await supabase.from('ad_goals').upsert(rows, { onConflict: 'key' });
    if (error) return toast.error('Hedefler kaydedilemedi.');
    toast.success('Hedefler kaydedildi');
    reload();
  };
  const monthStart = `${todayIst().slice(0, 8)}01`;
  const spentMonth = spend.filter((s) => s.day >= monthStart).reduce((a, x) => a + x.cost, 0);

  return (
    <div className="space-y-5">
      <Card title="Kanal bazında maliyet ve getiri" hint="ROAS = ölçülen ciro ÷ harcama. Rezervasyon başı maliyet = harcama ÷ ölçülen rezervasyon. Ölçüm yalnızca çerezi kabul edenleri kapsadığından gerçek değerler biraz daha iyidir.">
        {channels.length === 0 ? (
          <Empty title="Harcama girilmemiş" text="Aşağıdaki formdan günlük harcama ekleyin veya Google Ads / Meta raporunu CSV olarak yükleyin." />
        ) : (
          <TableWrap>
            <thead><tr><Th className="pl-4 sm:pl-5">Kanal</Th><Th right>Harcama</Th><Th right>Tıklama</Th><Th right>Tık başı</Th><Th right>Gösterim</Th><Th right>CTR</Th><Th right>Rezervasyon</Th><Th right>Rez. başı</Th><Th right>Ciro</Th><Th right className="pr-4 sm:pr-5">ROAS</Th></tr></thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.channel}>
                  <Td className="pl-4 sm:pl-5"><span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: channelColor(c.channel) }} />{channelLabel(c.channel)}</span></Td>
                  <Td right>{c.cost > 0 ? fmtMoney(c.cost) : '—'}</Td>
                  <Td right>{c.clicks > 0 ? fmtInt(c.clicks) : '—'}</Td>
                  <Td right>{c.clicks > 0 ? fmtMoney2(c.cost / c.clicks) : '—'}</Td>
                  <Td right>{c.impressions > 0 ? fmtInt(c.impressions) : '—'}</Td>
                  <Td right>{c.impressions > 0 ? fmtPct(ratio(c.clicks, c.impressions)) : '—'}</Td>
                  <Td right>{fmtInt(c.bookings)}</Td>
                  <Td right>{c.cost > 0 && c.bookings > 0 ? fmtMoney(c.cost / c.bookings) : '—'}</Td>
                  <Td right>{fmtMoney(c.revenue)}</Td>
                  <Td right className="pr-4 sm:pr-5 font-bold">{c.cost > 0 ? `${fmtDec(div(c.revenue, c.cost), 2)}x` : '—'}</Td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold"><Td className="pl-4 sm:pl-5">Toplam</Td><Td right>{fmtMoney(total)}</Td><Td right>{fmtInt(spend.reduce((a, x) => a + x.clicks, 0))}</Td><Td right /><Td right /><Td right /><Td right /><Td right /><Td right /><Td right className="pr-4 sm:pr-5" /></tr>
            </tbody>
          </TableWrap>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Hedefler" hint="Öneriler ve uyarılar bu hedeflere göre üretilir. Boş bırakılan hedef izlenmez.">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls} htmlFor="g1">Aylık bütçe (₺)</label><input id="g1" inputMode="decimal" className={inputCls} value={g.monthly_budget} onChange={(e) => setG({ ...g, monthly_budget: e.target.value })} /></div>
            <div><label className={labelCls} htmlFor="g2">Hedef ROAS (örn. 4)</label><input id="g2" inputMode="decimal" className={inputCls} value={g.target_roas} onChange={(e) => setG({ ...g, target_roas: e.target.value })} /></div>
            <div><label className={labelCls} htmlFor="g3">Hedef rezervasyon başı maliyet (₺)</label><input id="g3" inputMode="decimal" className={inputCls} value={g.target_cpa} onChange={(e) => setG({ ...g, target_cpa: e.target.value })} /></div>
            <div><label className={labelCls} htmlFor="g4">Aylık rezervasyon hedefi</label><input id="g4" inputMode="decimal" className={inputCls} value={g.monthly_bookings} onChange={(e) => setG({ ...g, monthly_bookings: e.target.value })} /></div>
          </div>
          <Button onClick={saveGoals} className="mt-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">Hedefleri kaydet</Button>
          {goals.monthly_budget > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-600 mb-1"><span>Bu ay harcanan</span><span className="tabular-nums font-semibold">{fmtMoney(spentMonth)} / {fmtMoney(goals.monthly_budget)}</span></div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-r-md" style={{ width: `${Math.min(100, ratio(spentMonth, goals.monthly_budget))}%`, background: spentMonth > goals.monthly_budget ? '#e34948' : '#2a78d6' }} /></div>
            </div>
          )}
        </Card>

        <Card title="Harcama ekle" hint="Her gün, kanal ve kampanya için bir satır. Aynı tarih, kanal ve kampanya adıyla tekrar girerseniz güncellenir.">
          <form onSubmit={add} className="grid grid-cols-2 gap-3">
            <div><label className={labelCls} htmlFor="s-day">Tarih</label><input id="s-day" type="date" className={inputCls} value={f.day} max={todayIst()} onChange={(e) => setF({ ...f, day: e.target.value })} required /></div>
            <div><label className={labelCls} htmlFor="s-ch">Kanal</label><select id="s-ch" className={inputCls} value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })}>{SPEND_CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
            <div className="col-span-2"><label className={labelCls} htmlFor="s-camp">Kampanya adı (bağlantıdaki utm_campaign ile aynı)</label><input id="s-camp" list="camp-list" className={inputCls} value={f.campaign} onChange={(e) => setF({ ...f, campaign: e.target.value })} placeholder="adana-marka" /><datalist id="camp-list">{campaigns.map((c) => <option key={c} value={c} />)}</datalist></div>
            <div><label className={labelCls} htmlFor="s-cost">Maliyet (₺)</label><input id="s-cost" inputMode="decimal" className={inputCls} value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value })} required /></div>
            <div><label className={labelCls} htmlFor="s-clk">Tıklama</label><input id="s-clk" inputMode="numeric" className={inputCls} value={f.clicks} onChange={(e) => setF({ ...f, clicks: e.target.value })} /></div>
            <div><label className={labelCls} htmlFor="s-imp">Gösterim</label><input id="s-imp" inputMode="numeric" className={inputCls} value={f.impressions} onChange={(e) => setF({ ...f, impressions: e.target.value })} /></div>
            <div className="flex items-end"><Button type="submit" disabled={busy} className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">Ekle</Button></div>
          </form>
        </Card>
      </div>

      <Card title="CSV ile toplu yükle" hint="Google Ads veya Meta raporunu CSV indirip yükleyin. Başlıkta en az “tarih” ve “maliyet” olmalı; “kampanya”, “tıklama”, “gösterim”, “kanal” isteğe bağlı. Ondalıkta virgül veya nokta, ayraç olarak ; , ya da sekme kullanılabilir.">
        <div className="flex flex-wrap items-end gap-3">
          <div><label className={labelCls} htmlFor="csv-ch">Dosyada kanal sütunu yoksa kanal</label><select id="csv-ch" className={inputCls} value={csvCh} onChange={(e) => setCsvCh(e.target.value)}>{SPEND_CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
          <label className="relative overflow-hidden inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-300 bg-white text-sm font-semibold cursor-pointer hover:bg-slate-50 focus-within:ring-2 focus-within:ring-amber-400"><Upload className="w-4 h-4" />Dosya seç<input type="file" accept=".csv,.txt,text/csv" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => onFile(e.target.files?.[0])} /></label>
          <Button type="button" variant="outline" onClick={() => downloadCsv('ornek_harcama.csv', [['tarih', 'kanal', 'kampanya', 'maliyet', 'tıklama', 'gösterim'], [todayIst(), 'google', 'adana-marka', '215,50', 62, 1480]])}><Download className="w-4 h-4 mr-1.5" />Örnek dosya</Button>
        </div>
        <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={4} placeholder="Ya da tabloyu buraya yapıştırın" className="mt-3 w-full rounded-lg border border-slate-200 p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-400/60" />
        {parsed && (
          <div className="mt-2 text-sm">
            <p className={parsed.rows.length ? 'text-emerald-700 font-semibold' : 'text-red-700 font-semibold'}>{parsed.rows.length} satır okundu{parsed.rows.length > 0 && <> · toplam {fmtMoney(parsed.rows.reduce((a, x) => a + x.cost, 0))} · {fmtDay(parsed.rows.map((r) => r.day).sort()[0], true)} – {fmtDay(parsed.rows.map((r) => r.day).sort().slice(-1)[0], true)}</>}</p>
            {parsed.errors.map((er) => <p key={er} className="text-xs text-red-700">{er}</p>)}
            <Button onClick={importCsv} disabled={busy || parsed.rows.length === 0} className="mt-2 bg-slate-900 hover:bg-slate-800 text-white">İçe aktar</Button>
          </div>
        )}
      </Card>

      <Card title={`Girilen harcamalar (${fmtDay(range.from)} – ${fmtDay(range.to, true)})`}>
        {spend.length === 0 ? <Empty title="Bu aralıkta kayıt yok" text="" /> : (
          <TableWrap>
            <thead><tr><Th className="pl-4 sm:pl-5">Tarih</Th><Th>Kanal</Th><Th>Kampanya</Th><Th right>Maliyet</Th><Th right>Tıklama</Th><Th right>Gösterim</Th><Th right className="pr-4 sm:pr-5"><span className="sr-only">Sil</span></Th></tr></thead>
            <tbody>
              {[...spend].sort((a, b) => b.day.localeCompare(a.day)).slice(0, 120).map((r) => (
                <tr key={`${r.day}|${r.channel}|${r.campaign}`}>
                  <Td className="pl-4 sm:pl-5">{fmtDay(r.day, true)}</Td><Td>{channelLabel(r.channel)}</Td><Td>{r.campaign || '—'}</Td>
                  <Td right>{fmtMoney2(r.cost)}</Td><Td right>{fmtInt(r.clicks)}</Td><Td right>{fmtInt(r.impressions)}</Td>
                  <Td right className="pr-4 sm:pr-5"><button type="button" onClick={() => del(r)} className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50" aria-label="Kaydı sil"><Trash2 className="w-4 h-4" /></button></Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
        {spend.length > 120 && <p className="text-xs text-slate-500 mt-2">İlk 120 kayıt gösteriliyor; hepsi hesaplamalara dahildir.</p>}
      </Card>
    </div>
  );
};

/* ================================ KAMPANYA LİNKLERİ ================================ */
interface Saved { id: number; name: string; url: string; created_at: string }
const SOURCES = [
  { id: 'google', label: 'Google Ads', source: 'google', medium: 'cpc' },
  { id: 'meta', label: 'Facebook reklamı', source: 'facebook', medium: 'paid_social' },
  { id: 'insta', label: 'Instagram reklamı', source: 'instagram', medium: 'paid_social' },
  { id: 'igbio', label: 'Instagram profil bağlantısı', source: 'instagram', medium: 'social' },
  { id: 'mail', label: 'E-posta bülteni', source: 'bulten', medium: 'email' },
  { id: 'wa', label: 'WhatsApp mesajı', source: 'whatsapp', medium: 'social' },
  { id: 'diger', label: 'Diğer', source: '', medium: '' },
];

export const LinksTab: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const [pages, setPages] = useState<Array<{ value: string; label: string }>>([
    { value: '/', label: 'Ana sayfa' },
    { value: '/tesisler', label: 'Tüm tesisler' },
  ]);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [preset, setPreset] = useState('google');
  const [f, setF] = useState({ page: '/', source: 'google', medium: 'cpc', campaign: '', content: '', term: '', name: '' });

  const load = useCallback(async () => {
    const [h, r, u] = await Promise.all([
      supabase.from('hotels').select('id,name').order('id'),
      supabase.from('rooms').select('id,name,hotel_id').order('hotel_id').order('id'),
      supabase.from('utm_links').select('id,name,url,created_at').order('created_at', { ascending: false }).limit(100),
    ]);
    const opts = [{ value: '/', label: 'Ana sayfa' }, { value: '/tesisler', label: 'Tüm tesisler' }];
    (h.data ?? []).forEach((x: { id: number; name: string }) => opts.push({ value: `/tesis/${x.id}`, label: `Tesis: ${x.name}` }));
    const hn = new Map((h.data ?? []).map((x: { id: number; name: string }) => [x.id, x.name.replace('UYUROOM Hotel ', '')]));
    (r.data ?? []).forEach((x: { id: number; name: string; hotel_id: number }) => opts.push({ value: `/room/${x.id}`, label: `Oda: ${x.name} (${hn.get(x.hotel_id) ?? ''})` }));
    setPages(opts);
    setSaved((u.data ?? []) as Saved[]);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const pick = (id: string) => {
    setPreset(id);
    const p = SOURCES.find((s) => s.id === id)!;
    setF((cur) => ({ ...cur, source: p.source, medium: p.medium }));
  };
  const qs = new URLSearchParams();
  if (f.source) qs.set('utm_source', slug(f.source));
  if (f.medium) qs.set('utm_medium', slug(f.medium).replace(/-/g, '_'));
  if (f.campaign) qs.set('utm_campaign', slug(f.campaign));
  if (f.content) qs.set('utm_content', slug(f.content));
  if (f.term) qs.set('utm_term', slug(f.term));
  const suffix = qs.toString();
  const url = `https://uyuroom.com${f.page === '/' ? '/' : f.page}${suffix ? `?${suffix}` : ''}`;
  const ready = Boolean(f.source && f.medium && f.campaign);

  const save = async () => {
    if (ctx.demo) return toast.error('Örnek veri açıkken kayıt yapılamaz.');
    const name = (f.name || f.campaign).trim().slice(0, 100);
    if (!ready || !name) return toast.error('Kaynak, ortam ve kampanya adı gerekli.');
    const { error } = await supabase.from('utm_links').insert({ name, url });
    if (error) return toast.error('Kaydedilemedi.');
    toast.success('Bağlantı kaydedildi');
    setF({ ...f, name: '' });
    void load();
  };
  const remove = async (s: Saved) => {
    if (!window.confirm(`“${s.name}” bağlantısı silinsin mi?`)) return;
    const { error } = await supabase.from('utm_links').delete().eq('id', s.id);
    if (error) return toast.error('Silinemedi.');
    void load();
  };

  return (
    <div className="space-y-5">
      <Card title="Kampanya bağlantısı oluştur" hint="Reklamlarınızdaki bağlantıya bu etiketler eklenirse, Reklam Merkezi her ziyareti doğru kampanyaya yazar. Etiketsiz bağlantılar “Doğrudan” görünür.">
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className={labelCls} htmlFor="u-page">Hangi sayfaya gitsin?</label><select id="u-page" className={inputCls} value={f.page} onChange={(e) => setF({ ...f, page: e.target.value })}>{pages.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
          <div><label className={labelCls} htmlFor="u-preset">Nerede kullanılacak?</label><select id="u-preset" className={inputCls} value={preset} onChange={(e) => pick(e.target.value)}>{SOURCES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
          <div><label className={labelCls} htmlFor="u-src">Kaynak (utm_source)</label><input id="u-src" className={inputCls} value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} /></div>
          <div><label className={labelCls} htmlFor="u-med">Ortam (utm_medium)</label><input id="u-med" className={inputCls} value={f.medium} onChange={(e) => setF({ ...f, medium: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className={labelCls} htmlFor="u-camp">Kampanya adı (utm_campaign) *</label><input id="u-camp" className={inputCls} value={f.campaign} onChange={(e) => setF({ ...f, campaign: e.target.value })} placeholder="örn. adana-marka-kasim" /></div>
          <div><label className={labelCls} htmlFor="u-cont">Reklam / görsel adı (isteğe bağlı)</label><input id="u-cont" className={inputCls} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} /></div>
          <div><label className={labelCls} htmlFor="u-term">Anahtar kelime (isteğe bağlı)</label><input id="u-term" className={inputCls} value={f.term} onChange={(e) => setF({ ...f, term: e.target.value })} /></div>
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3">
          <p className="text-xs font-semibold text-slate-600 mb-1">Hazır bağlantı</p>
          <p className="text-sm font-mono break-all text-slate-900">{ready ? url : 'Kampanya adı girin'}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button size="sm" disabled={!ready} onClick={() => copy(url)} className="bg-slate-900 text-white hover:bg-slate-800"><Copy className="w-4 h-4 mr-1.5" />Bağlantıyı kopyala</Button>
            <Button size="sm" variant="outline" disabled={!ready} onClick={() => copy(suffix)}>Yalnızca etiketleri kopyala</Button>
            <input aria-label="Kayıt adı" className={`${inputCls} !w-48 !h-9`} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Kayıt adı (isteğe bağlı)" />
            <Button size="sm" disabled={!ready} onClick={save} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">Kaydet</Button>
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-600 leading-relaxed space-y-1.5">
          <p><b>Google Ads’te:</b> kampanya ayarlarında “Nihai URL son eki” alanına <span className="font-mono">Yalnızca etiketleri kopyala</span> ile aldığınız metni yapıştırırsanız tüm reklamlara tek seferde eklenir. Google’ın otomatik etiketi (gclid) varsa kaynak zaten Google Ads olarak tanınır.</p>
          <p><b>Meta’da:</b> reklam düzeyinde “URL parametreleri” alanına aynı etiket metnini yapıştırın.</p>
          <p><b>Kampanya adı:</b> Maliyet sekmesinde girdiğiniz kampanya adıyla birebir aynı yazılırsa harcama ve getiri otomatik eşleşir.</p>
        </div>
      </Card>

      <Card title="Kayıtlı bağlantılar">
        {saved.length === 0 ? <Empty title="Henüz kayıtlı bağlantı yok" text="Oluşturduğunuz bağlantıları kaydedin, ekip arkadaşlarınızla ortak kullanın." /> : (
          <ul className="divide-y divide-slate-100">
            {saved.map((s) => (
              <li key={s.id} className="py-2.5 flex items-center gap-3">
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-900 truncate">{s.name}</p><p className="text-xs font-mono text-slate-500 truncate" title={s.url}>{s.url}</p></div>
                <Button size="sm" variant="outline" onClick={() => copy(s.url)} aria-label="Kopyala"><Copy className="w-4 h-4" /></Button>
                <button type="button" onClick={() => remove(s)} className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50" aria-label="Sil"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

/* ================================ NOTLAR ================================ */
const KINDS: Array<{ id: string; label: string }> = [
  { id: 'kampanya', label: 'Kampanya değişikliği' }, { id: 'butce', label: 'Bütçe değişikliği' }, { id: 'teklif', label: 'Teklif / fiyat' }, { id: 'not', label: 'Genel not' },
];
export const NotesTab: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const [f, setF] = useState({ day: todayIst(), kind: 'kampanya', body: '' });
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ctx.demo) return toast.error('Örnek veri açıkken kayıt yapılamaz.');
    const body = f.body.trim();
    if (!body) return;
    const { error } = await supabase.from('ad_notes').insert({ day: f.day, kind: f.kind, body: body.slice(0, 500) });
    if (error) return toast.error('Kaydedilemedi.');
    setF({ ...f, body: '' });
    ctx.reload();
  };
  const del = async (n: Note) => {
    if (!window.confirm('Not silinsin mi?')) return;
    const { error } = await supabase.from('ad_notes').delete().eq('id', n.id);
    if (error) return toast.error('Silinemedi.');
    ctx.reload();
  };
  return (
    <div className="space-y-5">
      <Card title="Değişiklik günlüğü" hint="Kampanya, bütçe veya fiyat değiştirdiğinizde not düşün. Genel Bakış grafiğinde 📌 olarak görünür; böylece bir değişikliğin sonucunu grafikte görebilirsiniz.">
        <form onSubmit={add} className="grid sm:grid-cols-[150px_200px_1fr_auto] gap-3 items-end">
          <div><label className={labelCls} htmlFor="n-day">Tarih</label><input id="n-day" type="date" className={inputCls} value={f.day} max={todayIst()} onChange={(e) => setF({ ...f, day: e.target.value })} required /></div>
          <div><label className={labelCls} htmlFor="n-kind">Tür</label><select id="n-kind" className={inputCls} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>{KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}</select></div>
          <div><label className={labelCls} htmlFor="n-body">Ne değişti?</label><input id="n-body" maxLength={500} className={inputCls} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder="örn. Adana marka kampanyası bütçesi %30 artırıldı" required /></div>
          <Button type="submit" className="h-10 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">Ekle</Button>
        </form>
      </Card>
      <Card title="Kayıtlar">
        {ctx.notes.length === 0 ? <Empty title="Not yok" text="" /> : (
          <ul className="divide-y divide-slate-100">
            {ctx.notes.map((n) => (
              <li key={n.id} className="py-2.5 flex gap-3 items-start">
                <div className="w-24 shrink-0 text-xs text-slate-500 pt-0.5">{fmtDay(n.day, true)}</div>
                <div className="min-w-0 flex-1"><p className="text-sm text-slate-900">{n.body}</p><p className="text-xs text-slate-500 mt-0.5">{KINDS.find((k) => k.id === n.kind)?.label}{n.created_by ? ` · ${n.created_by}` : ''}</p></div>
                <button type="button" onClick={() => del(n)} className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50" aria-label="Notu sil"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

/* ================================ CANLI ================================ */
interface Live {
  active_5m: number; active_30m: number; events_24h: number; events_7d: number; total_events: number;
  first_event_at: string | null; last_event_at: string | null;
  by_type_24h: Array<{ type: string; n: number }>;
  recent: Array<{ created_at: string; type: string; path: string | null; device: string | null; value: number | null; channel: string; campaign: string | null; visitor: string }>;
}
const EV: Record<string, string> = { page_view: 'Sayfa görüntüledi', view_room: 'Oda inceledi', search: 'Arama yaptı', begin_booking: 'Rezervasyon formunu açtı', booking_complete: 'Rezervasyon yaptı', contact_click: 'Telefon/WhatsApp tıkladı' };

export const LiveTab: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const [live, setLive] = useState<Live | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let alive = true;
    const pull = async () => {
      if (document.hidden) return;
      const { data, error } = await supabase.rpc('ads_live');
      if (!alive) return;
      if (error) setErr(true);
      else { setErr(false); setLive(data as Live); }
    };
    void pull();
    const id = window.setInterval(pull, 15000);
    return () => { alive = false; window.clearInterval(id); };
  }, []);
  const ago = (iso: string | null) => {
    if (!iso) return 'hiç';
    const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
    return s < 60 ? `${s} sn önce` : s < 3600 ? `${Math.round(s / 60)} dk önce` : s < 86400 ? `${Math.round(s / 3600)} sa önce` : `${Math.round(s / 86400)} gün önce`;
  };
  if (ctx.demo) return <Card><Empty title="Canlı akış örnek veriyle gösterilmez" text="Örnek veriyi kapatın." /></Card>;
  if (err) return <Card><Empty title="Canlı veri okunamadı" text="Oturumunuz kapanmış olabilir. Sayfayı yenileyin." /></Card>;
  if (!live) return <div className="flex justify-center py-16"><div className="w-9 h-9 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Şu an sitede (son 5 dk)" value={fmtInt(live.active_5m)} />
        <KPI label="Son 30 dakika" value={fmtInt(live.active_30m)} />
        <KPI label="Son 24 saatteki olay" value={fmtInt(live.events_24h)} />
        <KPI label="Son olay" value={ago(live.last_event_at)} sub={live.first_event_at ? `Ölçüm başlangıcı: ${fmtDay(live.first_event_at.slice(0, 10), true)}` : undefined} />
      </div>
      <Card title="Canlı akış" hint="Son 60 dakika. Ziyaretçiler anonim kodla gösterilir; kimlik bilgisi tutulmaz. 15 saniyede bir yenilenir.">
        {live.recent.length === 0 ? <Empty title="Son 1 saatte ölçülen ziyaret yok" text="Çerez bandını kabul eden ziyaretçiler burada görünür. Test için siteyi kendiniz açıp Kabul Et diyebilirsiniz; yönetici girişiniz açıkken kendi ziyaretiniz sayılmaz, çıkış yapıp deneyin." /> : (
          <TableWrap>
            <thead><tr><Th className="pl-4 sm:pl-5">Zaman</Th><Th>Ziyaretçi</Th><Th>Ne yaptı</Th><Th>Sayfa</Th><Th>Kaynak</Th><Th className="pr-4 sm:pr-5">Cihaz</Th></tr></thead>
            <tbody>
              {live.recent.map((r, i) => (
                <tr key={`${r.created_at}-${i}`} className={r.type === 'booking_complete' ? 'bg-emerald-50' : ''}>
                  <Td className="pl-4 sm:pl-5 whitespace-nowrap text-xs">{ago(r.created_at)}</Td>
                  <Td className="font-mono text-xs">#{r.visitor}</Td>
                  <Td>{EV[r.type] ?? r.type}{r.value ? ` · ${fmtMoney(r.value)}` : ''}</Td>
                  <Td className="font-mono text-xs">{r.path ?? '—'}</Td>
                  <Td>{channelLabel(r.channel)}{r.campaign ? <span className="block text-[11px] text-slate-500">{r.campaign}</span> : null}</Td>
                  <Td className="pr-4 sm:pr-5">{({ mobile: 'Mobil', desktop: 'Masaüstü', tablet: 'Tablet' } as Record<string, string>)[r.device ?? ''] ?? '—'}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </div>
  );
};

/* ================================ TAKİP KODLARI ================================ */
export const TrackingTab: React.FC = () => {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [live, setLive] = useState<Live | null>(null);
  useEffect(() => {
    void supabase.from('tracking_settings').select('key,value').then(({ data }) => {
      const m: Record<string, string> = {};
      (data ?? []).forEach((r: { key: string; value: string }) => { m[r.key] = r.value; });
      setVals(m);
    });
    void supabase.rpc('ads_live').then(({ data }) => data && setLive(data as Live));
  }, []);
  const items = [
    { ok: Boolean(vals.ga4_id), label: 'Google Analytics 4 kimliği', hint: 'Ziyaret ve davranış raporları için' },
    { ok: Boolean(vals.ads_id), label: 'Google Ads kimliği', hint: 'Reklam dönüşümlerini Google’a bildirmek için' },
    { ok: Boolean(vals.ads_booking_label), label: 'Rezervasyon dönüşüm etiketi', hint: 'Google Ads’in “rezervasyon yapıldı” olayını tanıması için' },
    { ok: Boolean(vals.meta_pixel_id), label: 'Meta Pixel', hint: 'Facebook / Instagram reklam ölçümü için' },
    { ok: Boolean(live && live.events_24h > 0), label: 'Birinci taraf ölçüm (Reklam Merkezi)', hint: live ? `Son 24 saatte ${fmtInt(live.events_24h)} olay, son olay: ${live.last_event_at ? new Date(live.last_event_at).toLocaleString('tr-TR') : 'yok'}` : 'Kontrol ediliyor' },
  ];
  return (
    <div className="space-y-5 max-w-3xl">
      <Card title="Kurulum durumu" hint="Yeşil işaret, ilgili kimliğin girildiğini gösterir. Gerçek veri akışını Google Tag Assistant veya Canlı sekmesinden doğrulayın.">
        <ul className="space-y-2.5">
          {items.map((i) => (
            <li key={i.label} className="flex items-start gap-2.5">
              {i.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-label="Tamam" /> : <CircleDashed className="w-5 h-5 text-slate-400 shrink-0" aria-label="Eksik" />}
              <div><p className="text-sm font-semibold text-slate-900">{i.label}</p><p className="text-xs text-slate-500">{i.hint}</p></div>
            </li>
          ))}
        </ul>
      </Card>
      <TrackingSettings embedded />
    </div>
  );
};
