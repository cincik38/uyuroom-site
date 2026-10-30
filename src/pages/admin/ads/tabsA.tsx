import React, { useMemo, useState } from 'react';
import { Download, Lightbulb, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, Delta, Empty, Funnel, HBars, HeatGrid, KPI, LineChart, ShareBar, Td, TableWrap, Th } from './charts';
import {
  CHANNELS, Ctx, aggregateChannels, buildInsights, channelColor, channelLabel, delta, div, downloadCsv, fmtDec, fmtInt, fmtMoney, fmtMoney2, fmtPct, ratio, sumSpend, paidRevenue,
} from './lib';

const METRICS = [
  { id: 'sessions', label: 'Oturum', color: '#2a78d6', fmt: fmtInt },
  { id: 'room_views', label: 'Oda görüntüleme', color: '#1baf7a', fmt: fmtInt },
  { id: 'begin_bookings', label: 'Rezervasyon başlatma', color: '#eda100', fmt: fmtInt },
  { id: 'bookings', label: 'Rezervasyon', color: '#eb6834', fmt: fmtInt },
  { id: 'revenue', label: 'Ciro', color: '#6250d6', fmt: fmtMoney },
] as const;

const toneIcon = { good: CheckCircle2, warn: AlertTriangle, info: Info } as const;
const toneCls = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warn: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-slate-200 bg-slate-50 text-slate-800',
} as const;

/* ================================ GENEL BAKIŞ ================================ */
export const Overview: React.FC<{ ctx: Ctx; goTab: (t: string) => void }> = ({ ctx, goTab }) => {
  const { rep, prev, spend, prevSpend, goals, notes, range } = ctx;
  const [metric, setMetric] = useState<(typeof METRICS)[number]['id']>('sessions');
  const t = rep.totals;
  const p = prev.totals;
  const cost = sumSpend(spend);
  const pCost = sumSpend(prevSpend);
  const paidRev = paidRevenue(rep);
  const pPaidRev = paidRevenue(prev);
  const conv = ratio(t.booked_sessions, t.sessions);
  const pConv = ratio(p.booked_sessions, p.sessions);
  const roas = div(paidRev, cost);
  const pRoas = div(pPaidRev, pCost);
  const cpa = div(cost, rep.sources.filter((s) => CHANNELS[s.channel]?.paid).reduce((a, x) => a + x.bookings, 0));
  const days = rep.daily.map((d) => d.d);
  const series = (r: typeof rep) => r.daily.map((d) => Number(d[metric]) || 0);
  const m = METRICS.find((x) => x.id === metric)!;
  const channels = useMemo(() => aggregateChannels(rep, []), [rep]);
  const insights = useMemo(() => buildInsights(rep, spend, goals, range), [rep, spend, goals, range]);
  const spark = (k: keyof (typeof rep.daily)[number]) => rep.daily.map((d) => Number(d[k]) || 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Oturum (ziyaret)" value={fmtInt(t.sessions)} sub={<><Delta value={delta(t.sessions, p.sessions)} /> önceki dönem</>} spark={spark('sessions')} />
        <KPI label="Oda sayfasına bakan" value={fmtInt(t.viewed_room)} sub={<><Delta value={delta(t.viewed_room, p.viewed_room)} /> · %{fmtDec(ratio(t.viewed_room, t.sessions), 0)} oturum</>} spark={spark('room_views')} color="#1baf7a" />
        <KPI label="Rezervasyon formunu açan" value={fmtInt(t.began)} sub={<><Delta value={delta(t.began, p.began)} /> · %{fmtDec(ratio(t.began, t.sessions), 0)} oturum</>} spark={spark('begin_bookings')} color="#eda100" />
        <KPI label="Rezervasyon (ölçülen)" value={fmtInt(t.bookings)} sub={<><Delta value={delta(t.bookings, p.bookings)} /> önceki dönem</>} spark={spark('bookings')} color="#eb6834" title="Yalnızca çerezi kabul eden ziyaretçilerin rezervasyonları" />
        <KPI label="Ciro (ölçülen)" value={fmtMoney(t.revenue)} sub={<><Delta value={delta(t.revenue, p.revenue)} /> önceki dönem</>} spark={spark('revenue')} color="#6250d6" />
        <KPI label="Dönüşüm oranı" value={fmtPct(conv)} sub={<><Delta value={delta(conv, pConv)} /> oturumdan rezervasyona</>} />
        <KPI label="Reklam harcaması" value={cost > 0 ? fmtMoney(cost) : '—'} sub={cost > 0 ? <><Delta value={delta(cost, pCost)} invert /> önceki dönem</> : <button className="underline text-amber-700" onClick={() => goTab('maliyet')}>Harcama girin</button>} />
        <KPI label="ROAS · rezervasyon başı maliyet" value={cost > 0 ? `${fmtDec(roas, 2)}x` : '—'} sub={cost > 0 ? <><Delta value={delta(roas, pRoas)} /> · {cpa > 0 ? fmtMoney(cpa) : '—'}</> : 'Harcama girilince hesaplanır'} title="ROAS: reklamdan gelen ölçülen ciro / harcama" />
      </div>

      <Card
        title="Zaman içinde"
        hint="Kesikli çizgi, bir önceki aynı uzunluktaki dönemdir. 📌 işaretli günler Notlar sekmesindeki kayıtlardır."
        right={
          <div className="flex flex-wrap gap-1 justify-end" role="tablist" aria-label="Gösterilen ölçü">
            {METRICS.map((x) => (
              <button
                key={x.id}
                role="tab"
                aria-selected={metric === x.id}
                onClick={() => setMetric(x.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${metric === x.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
              >
                {x.label}
              </button>
            ))}
          </div>
        }
      >
        {days.length === 0 || t.sessions === 0 ? (
          <Empty title="Bu aralıkta ölçülmüş ziyaret yok" text="Ziyaretçiler çerez bandında Kabul Et dediğinde sayılmaya başlar. Örnek veri düğmesiyle ekranların nasıl görüneceğini inceleyebilirsiniz." />
        ) : (
          <LineChart
            days={days}
            format={m.fmt}
            marks={notes.filter((n) => days.includes(n.day)).map((n) => ({ day: n.day, label: n.body }))}
            series={[
              { key: 'cur', label: m.label, color: m.color, values: series(rep) },
              { key: 'prev', label: 'Önceki dönem', color: '#94a3b8', values: series(prev).slice(0, days.length), dashed: true },
            ]}
          />
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Ziyaretçiler nereden geliyor?" hint="Oturum sayısına göre dağılım">
          <ShareBar rows={channels.map((c) => ({ label: channelLabel(c.channel), value: c.sessions, color: channelColor(c.channel) }))} />
        </Card>
        <Card title="Ciroyu getiren kaynaklar" hint="Ölçülen rezervasyon cirosu">
          <HBars
            rows={channels.filter((c) => c.revenue > 0).sort((a, b) => b.revenue - a.revenue).map((c) => ({ label: channelLabel(c.channel), value: c.revenue, color: channelColor(c.channel), right: `${fmtInt(c.bookings)} rez.` }))}
            format={fmtMoney}
            empty="Henüz ölçülen rezervasyon yok"
          />
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Rezervasyon hunisi" right={<button className="text-xs underline text-amber-700" onClick={() => goTab('huni')}>Ayrıntı</button>}>
          <Funnel
            steps={[
              { label: 'Oturum', value: t.sessions },
              { label: 'Oda sayfasına bakan', value: t.viewed_room },
              { label: 'Rezervasyon formunu açan', value: t.began },
              { label: 'Rezervasyonu tamamlayan', value: t.booked_sessions },
            ]}
          />
        </Card>
        <Card title="Öneriler" hint="Verilere bakarak otomatik çıkarılır">
          {insights.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">Şimdilik dikkat çeken bir durum yok.</p>
          ) : (
            <ul className="space-y-2.5">
              {insights.map((i) => {
                const Icon = toneIcon[i.tone];
                return (
                  <li key={i.title} className={`flex gap-2.5 rounded-xl border p-3 ${toneCls[i.tone]}`}>
                    <Icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-snug">{i.title}</p>
                      <p className="text-xs mt-0.5 leading-relaxed">{i.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <p className="flex items-start gap-2 text-xs text-slate-500 leading-relaxed px-1">
        <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
        <span>Bu sayfadaki ziyaret ve dönüşüm rakamları yalnızca çerez bandında “Kabul Et” diyen ziyaretçileri kapsar, bu yüzden gerçek trafikten düşüktür. Eksiksiz rezervasyon ve ciro toplamları için Rezervasyonlar sekmesine bakın. Yönetici ve reklamcı girişleri sayılmaz.</span>
      </p>
    </div>
  );
};

/* ================================ KAYNAKLAR ================================ */
export const Sources: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const { rep, spend } = ctx;
  const [filter, setFilter] = useState('hepsi');
  const channels = useMemo(() => aggregateChannels(rep, spend), [rep, spend]);
  const campSpend = useMemo(() => {
    const m = new Map<string, number>();
    spend.forEach((s) => m.set(`${s.channel}|${s.campaign}`, (m.get(`${s.channel}|${s.campaign}`) ?? 0) + s.cost));
    return m;
  }, [spend]);
  const rows = rep.sources.filter((s) => (s.campaign || CHANNELS[s.channel]?.paid) && (filter === 'hepsi' || s.channel === filter));

  const exportCsv = () =>
    downloadCsv(`kaynaklar_${ctx.range.from}_${ctx.range.to}.csv`, [
      ['Kanal', 'Kaynak', 'Ortam', 'Kampanya', 'Oturum', 'Oda gören', 'Formu açan', 'Rezervasyon', 'Ciro', 'Çıkış (tek sayfa)'],
      ...rep.sources.map((s) => [channelLabel(s.channel), s.source, s.medium, s.campaign, s.sessions, s.viewed, s.began, s.bookings, s.revenue, s.bounced]),
    ]);

  return (
    <div className="space-y-5">
      <Card title="Kanallar" hint="Her ziyaret, ilk geldiği kaynağa yazılır. Harcama Maliyet sekmesinden girilen tutardır." right={<Button size="sm" variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-1.5" />CSV</Button>}>
        {channels.length === 0 ? (
          <Empty title="Kaynak verisi yok" text="Ziyaretçi geldikçe burada listelenir." />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th className="pl-4 sm:pl-5">Kanal</Th><Th right>Oturum</Th><Th right>Oda gören</Th><Th right>Formu açan</Th><Th right>Rezervasyon</Th><Th right>Dönüşüm</Th><Th right>Ciro</Th><Th right>Tek sayfa</Th><Th right>Harcama</Th><Th right>Rez. başı</Th><Th right className="pr-4 sm:pr-5">ROAS</Th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.channel}>
                  <Td className="pl-4 sm:pl-5"><span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: channelColor(c.channel) }} />{channelLabel(c.channel)}</span></Td>
                  <Td right>{fmtInt(c.sessions)}</Td>
                  <Td right>%{fmtDec(ratio(c.viewed, c.sessions), 0)}</Td>
                  <Td right>%{fmtDec(ratio(c.began, c.sessions), 0)}</Td>
                  <Td right>{fmtInt(c.bookings)}</Td>
                  <Td right>{fmtPct(ratio(c.booked, c.sessions))}</Td>
                  <Td right>{fmtMoney(c.revenue)}</Td>
                  <Td right>%{fmtDec(ratio(c.bounced, c.sessions), 0)}</Td>
                  <Td right>{c.cost > 0 ? fmtMoney(c.cost) : '—'}</Td>
                  <Td right>{c.cost > 0 && c.bookings > 0 ? fmtMoney(c.cost / c.bookings) : '—'}</Td>
                  <Td right className="pr-4 sm:pr-5">{c.cost > 0 ? `${fmtDec(div(c.revenue, c.cost), 2)}x` : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">“Tek sayfa”: siteye girip başka hiçbir şey yapmadan çıkan oturumların oranı. Ücretli kanallarda yüksek olması reklamın yanlış kitleye veya yanlış sayfaya gittiğini gösterebilir.</p>
      </Card>

      <Card
        title="Kampanyalar"
        hint="Reklam bağlantılarındaki utm_campaign adına göre. Harcama, aynı adla girilen maliyetle eşleşir."
        right={
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm" aria-label="Kanal süz">
            <option value="hepsi">Tüm kanallar</option>
            {channels.map((c) => <option key={c.channel} value={c.channel}>{channelLabel(c.channel)}</option>)}
          </select>
        }
      >
        {rows.length === 0 ? (
          <Empty title="Kampanya adı olan ziyaret yok" text="Reklam bağlantılarına utm_campaign eklenmemiş olabilir. Kampanya Linkleri sekmesinden doğru bağlantıyı oluşturun." />
        ) : (
          <TableWrap>
            <thead>
              <tr><Th className="pl-4 sm:pl-5">Kampanya</Th><Th>Kanal</Th><Th right>Oturum</Th><Th right>Formu açan</Th><Th right>Rezervasyon</Th><Th right>Dönüşüm</Th><Th right>Ciro</Th><Th right>Harcama</Th><Th right>Rez. başı</Th><Th right className="pr-4 sm:pr-5">ROAS</Th></tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const cost = campSpend.get(`${s.channel}|${s.campaign}`) ?? 0;
                return (
                  <tr key={`${s.channel}|${s.source}|${s.medium}|${s.campaign}`}>
                    <Td className="pl-4 sm:pl-5 font-medium">{s.campaign || <span className="text-slate-400">(kampanya adı yok)</span>}<span className="block text-[11px] font-normal text-slate-500">{[s.source, s.medium].filter(Boolean).join(' / ')}</span></Td>
                    <Td>{channelLabel(s.channel)}</Td>
                    <Td right>{fmtInt(s.sessions)}</Td>
                    <Td right>{fmtInt(s.began)}</Td>
                    <Td right>{fmtInt(s.bookings)}</Td>
                    <Td right>{fmtPct(ratio(s.booked, s.sessions))}</Td>
                    <Td right>{fmtMoney(s.revenue)}</Td>
                    <Td right>{cost > 0 ? fmtMoney(cost) : '—'}</Td>
                    <Td right>{cost > 0 && s.bookings > 0 ? fmtMoney(cost / s.bookings) : '—'}</Td>
                    <Td right className="pr-4 sm:pr-5">{cost > 0 ? `${fmtDec(div(s.revenue, cost), 2)}x` : '—'}</Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </div>
  );
};

/* ================================ HUNİ ================================ */
export const FunnelTab: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const { rep, prev } = ctx;
  const t = rep.totals;
  const p = prev.totals;
  const rows: Array<[string, number, number]> = [
    ['Oturum', t.sessions, p.sessions],
    ['Arama yapan', t.searched, p.searched],
    ['Oda sayfasına bakan', t.viewed_room, p.viewed_room],
    ['Rezervasyon formunu açan', t.began, p.began],
    ['Rezervasyonu tamamlayan', t.booked_sessions, p.booked_sessions],
    ['Telefon / WhatsApp tıklayan', t.contacts, p.contacts],
  ];
  const sorted = [...rep.devices].sort((a, b) => b.sessions - a.sessions);
  const dev = { mobile: 'Mobil', desktop: 'Masaüstü', tablet: 'Tablet', bilinmiyor: 'Bilinmiyor' } as Record<string, string>;
  return (
    <div className="space-y-5">
      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Rezervasyon hunisi" hint="Her adımda kaç oturum kaldığı. Kayıp oranı, bir önceki adıma göredir.">
          <Funnel
            steps={[
              { label: 'Oturum', value: t.sessions },
              { label: 'Oda sayfasına bakan', value: t.viewed_room },
              { label: 'Rezervasyon formunu açan', value: t.began },
              { label: 'Rezervasyonu tamamlayan', value: t.booked_sessions },
            ]}
          />
          <p className="text-xs text-slate-500 mt-4 leading-relaxed">Arama yapmadan doğrudan oda sayfasına gelenler de olduğundan “Arama yapan” bu hunide ayrı bir adım sayılmaz.</p>
        </Card>
        <Card title="Önceki dönemle karşılaştırma">
          <TableWrap>
            <thead><tr><Th className="pl-4 sm:pl-5">Adım</Th><Th right>Şimdi</Th><Th right>Önceki</Th><Th right className="pr-4 sm:pr-5">Değişim</Th></tr></thead>
            <tbody>
              {rows.map(([name, a, b]) => (
                <tr key={name}><Td className="pl-4 sm:pl-5">{name}</Td><Td right>{fmtInt(a)}</Td><Td right>{fmtInt(b)}</Td><Td right className="pr-4 sm:pr-5"><Delta value={delta(a, b)} /></Td></tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      </div>
      <Card title="Cihaza göre dönüşüm" hint="Mobil ve masaüstü arasındaki fark, sayfa ya da form sorunlarının en hızlı göstergesidir.">
        <TableWrap>
          <thead><tr><Th className="pl-4 sm:pl-5">Cihaz</Th><Th right>Oturum</Th><Th right>Pay</Th><Th right>Rezervasyon</Th><Th right>Dönüşüm</Th><Th right className="pr-4 sm:pr-5">Ciro</Th></tr></thead>
          <tbody>
            {sorted.map((d) => (
              <tr key={d.device}><Td className="pl-4 sm:pl-5">{dev[d.device] ?? d.device}</Td><Td right>{fmtInt(d.sessions)}</Td><Td right>%{fmtDec(ratio(d.sessions, t.sessions), 0)}</Td><Td right>{fmtInt(d.booked)}</Td><Td right>{fmtPct(ratio(d.booked, d.sessions))}</Td><Td right className="pr-4 sm:pr-5">{fmtMoney(d.revenue)}</Td></tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
};

/* ================================ SAYFALAR & ODALAR ================================ */
export const PagesTab: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const { rep } = ctx;
  const t = rep.totals;
  const names: Record<string, string> = { '/': 'Ana sayfa', '/tesisler': 'Tesisler', '/booking': 'Rezervasyon formu', '/booking-confirmation': 'Rezervasyon onayı', '/contact': 'İletişim', '/about': 'Hakkımızda', '/policies': 'Politikalar' };
  const pageName = (p: string) => (names[p] ? `${names[p]}  ${p}` : p);
  return (
    <div className="space-y-5">
      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="En çok görüntülenen sayfalar">
          <HBars rows={rep.pages.slice(0, 10).map((p) => ({ label: pageName(p.path), value: p.views, right: `${fmtInt(p.sessions)} oturum` }))} format={fmtInt} />
        </Card>
        <Card title="Açılış sayfaları" hint="Ziyaretçinin siteye ilk girdiği sayfa. Tek sayfa oranı yüksekse o sayfa ziyaretçiyi tutamıyor.">
          {rep.landings.length === 0 ? <Empty title="Veri yok" text="" /> : (
            <TableWrap>
              <thead><tr><Th className="pl-4 sm:pl-5">Sayfa</Th><Th right>Oturum</Th><Th right>Tek sayfa</Th><Th right className="pr-4 sm:pr-5">Rezervasyon</Th></tr></thead>
              <tbody>
                {rep.landings.slice(0, 10).map((l) => (
                  <tr key={l.path}><Td className="pl-4 sm:pl-5 font-mono text-xs">{l.path}</Td><Td right>{fmtInt(l.sessions)}</Td><Td right><span className={ratio(l.bounced, l.sessions) > 60 && l.sessions >= 20 ? 'text-red-700 font-semibold' : ''}>%{fmtDec(ratio(l.bounced, l.sessions), 0)}</span></Td><Td right className="pr-4 sm:pr-5">{fmtInt(l.booked)}</Td></tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Card>
      </div>

      <Card title="Oda performansı" hint="Görüntüleyenlerin ne kadarı rezervasyon formunu açıyor, ne kadarı tamamlıyor.">
        {rep.rooms.length === 0 ? <Empty title="Oda verisi yok" text="Oda sayfaları görüntülendikçe burada listelenir." /> : (
          <TableWrap>
            <thead><tr><Th className="pl-4 sm:pl-5">Oda</Th><Th right>Fiyat/gece</Th><Th right>Görüntüleme</Th><Th right>Formu açan</Th><Th right>Rezervasyon</Th><Th right>Görüntüleme → rez.</Th><Th right className="pr-4 sm:pr-5">Ciro</Th></tr></thead>
            <tbody>
              {rep.rooms.map((r) => (
                <tr key={r.room_id}>
                  <Td className="pl-4 sm:pl-5 font-medium">{r.room_name ?? `Oda ${r.room_id}`}<span className="block text-[11px] font-normal text-slate-500">{r.hotel_name}</span></Td>
                  <Td right>{r.price_per_night ? fmtMoney(r.price_per_night) : '—'}</Td>
                  <Td right>{fmtInt(r.views)}</Td><Td right>{fmtInt(r.began)}</Td><Td right>{fmtInt(r.bookings)}</Td>
                  <Td right><span className={r.views >= 40 && r.bookings === 0 ? 'text-red-700 font-semibold' : ''}>{fmtPct(ratio(r.bookings, r.views))}</span></Td>
                  <Td right className="pr-4 sm:pr-5">{fmtMoney(r.revenue)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card title="Cihaz">
          <HBars rows={rep.devices.map((d) => ({ label: ({ mobile: 'Mobil', desktop: 'Masaüstü', tablet: 'Tablet' } as Record<string, string>)[d.device] ?? 'Bilinmiyor', value: d.sessions, right: `%${fmtDec(ratio(d.sessions, t.sessions), 0)}` }))} format={fmtInt} />
        </Card>
        <Card title="Tarayıcı"><HBars rows={rep.browsers.map((b) => ({ label: b.browser, value: b.sessions }))} format={fmtInt} /></Card>
        <Card title="İşletim sistemi"><HBars rows={rep.os.map((b) => ({ label: b.os, value: b.sessions }))} format={fmtInt} /></Card>
      </div>

      <Card title="Hangi gün ve saatte geliyorlar?" hint="Reklam zamanlaması ve bütçe dağılımı için kullanın.">
        <HeatGrid data={rep.heat} />
      </Card>
    </div>
  );
};

export { fmtMoney2 };
