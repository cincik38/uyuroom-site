import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, Code2, FileText, Filter, LayoutDashboard, Link2, LogOut, Megaphone, Radio, RefreshCw, StickyNote, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { getSession, logoutAdmin } from '@/lib/ota';
import { Ctx, Goals, Note, PRESETS, Range, Report, SpendRow, addDays, daysBetween, demoReport, demoSpend, fmtDay, previousRange, todayIst } from './lib';
import { FunnelTab, Overview, PagesTab, Sources } from './tabsA';
import { BookingsTab, LinksTab, LiveTab, NotesTab, SpendTab, TrackingTab } from './tabsB';

const TABS = [
  { id: 'genel', label: 'Genel Bakış', icon: LayoutDashboard },
  { id: 'kaynaklar', label: 'Kaynaklar & Kampanyalar', icon: Megaphone },
  { id: 'huni', label: 'Huni', icon: Filter },
  { id: 'sayfalar', label: 'Sayfalar & Odalar', icon: FileText },
  { id: 'rezervasyonlar', label: 'Rezervasyonlar', icon: CalendarCheck },
  { id: 'maliyet', label: 'Maliyet & ROAS', icon: Wallet },
  { id: 'linkler', label: 'Kampanya Linkleri', icon: Link2 },
  { id: 'notlar', label: 'Notlar', icon: StickyNote },
  { id: 'canli', label: 'Canlı', icon: Radio },
  { id: 'takip', label: 'Takip Kodları', icon: Code2 },
] as const;
type TabId = (typeof TABS)[number]['id'];

const NO_GOALS: Goals = { monthly_budget: 0, target_roas: 0, target_cpa: 0, monthly_bookings: 0 };
const safeGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* yoksay */ } };

export const AdsCenter: React.FC = () => {
  const session = getSession();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some((t) => t.id === params.get('sekme')) ? params.get('sekme') : 'genel') as TabId;
  const [presetId, setPresetId] = useState('30');
  const [custom, setCustom] = useState<Range>(() => PRESETS.find((p) => p.id === '30')!.get());
  const range = useMemo<Range>(() => (presetId === 'ozel' ? custom : PRESETS.find((p) => p.id === presetId)!.get()), [presetId, custom]);
  const prevRange = useMemo(() => previousRange(range), [range]);
  const [hotel, setHotel] = useState<number | null>(null);
  const [hotels, setHotels] = useState<Array<{ id: number; name: string }>>([]);
  const [demo, setDemo] = useState(() => safeGet('uyu_ads_demo') === '1');
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Pick<Ctx, 'rep' | 'prev' | 'spend' | 'prevSpend' | 'goals' | 'notes'> | null>(null);

  useEffect(() => {
    document.title = 'Reklam Merkezi | UYUROOM HOTEL';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    void supabase.from('hotels').select('id,name').order('id').then(({ data: h }) => setHotels((h ?? []) as Array<{ id: number; name: string }>));
  }, []);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [g, n] = await Promise.all([
          supabase.from('ad_goals').select('key,value'),
          supabase.from('ad_notes').select('*').order('day', { ascending: false }).order('id', { ascending: false }).limit(200),
        ]);
        const goals: Goals = { ...NO_GOALS };
        (g.data ?? []).forEach((r: { key: keyof Goals; value: number }) => { if (r.key in goals) goals[r.key] = Number(r.value) || 0; });
        const notes = (n.data ?? []) as Note[];
        if (demo) {
          if (!alive) return;
          setData({ rep: demoReport(range), prev: demoReport(prevRange), spend: demoSpend(range), prevSpend: demoSpend(prevRange), goals: { ...goals, monthly_budget: goals.monthly_budget || 15000, target_roas: goals.target_roas || 4 }, notes });
          return;
        }
        const call = (r: Range) => supabase.rpc('ads_report', { p_from: r.from, p_to: r.to, p_hotel: hotel });
        const sp = (r: Range) => supabase.from('ad_spend').select('day,channel,campaign,cost,clicks,impressions').gte('day', r.from).lte('day', r.to).limit(5000);
        const [cur, prev, s1, s2] = await Promise.all([call(range), call(prevRange), sp(range), sp(prevRange)]);
        if (!alive) return;
        if (cur.error) throw cur.error;
        if (prev.error) throw prev.error;
        const num = (rows: unknown) => ((rows ?? []) as SpendRow[]).map((r) => ({ ...r, cost: Number(r.cost) || 0, clicks: Number(r.clicks) || 0, impressions: Number(r.impressions) || 0 }));
        setData({ rep: cur.data as Report, prev: prev.data as Report, spend: num(s1.data), prevSpend: num(s2.data), goals, notes });
      } catch (e) {
        if (!alive) return;
        const msg = (e as { message?: string; code?: string }) || {};
        setError(msg.code === '42501' ? 'Bu verileri görme yetkiniz yok.' : 'Veriler okunamadı. Oturumunuz kapanmış olabilir; sayfayı yenileyin.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    void run();
    return () => { alive = false; };
  }, [range, prevRange, hotel, demo, tick]);

  const toggleDemo = () => {
    const next = !demo;
    setDemo(next);
    safeSet('uyu_ads_demo', next ? '1' : '0');
  };
  const setTab = (id: TabId) => setParams((p) => { const n = new URLSearchParams(p); n.set('sekme', id); return n; }, { replace: true });

  const ctx: Ctx | null = data ? { ...data, range, prevRange, hotel, demo, reload } : null;
  const empty = !loading && ctx && ctx.rep.totals.sessions === 0;
  const setCustomRange = (k: 'from' | 'to', v: string) => {
    if (!v) return;
    const next = { ...custom, [k]: v };
    if (next.to < next.from) return toast.error('Bitiş tarihi başlangıçtan önce olamaz.');
    if (daysBetween(next.from, next.to) > 399) return toast.error('En fazla 400 gün seçilebilir.');
    if (next.to > todayIst()) next.to = todayIst();
    setCustom(next);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <BrandLogo size={44} tagline="Reklam Merkezi" />
          <div className="flex items-center gap-2">
            {session?.role === 'super_admin' && (
              <Link to="/yonetim/panel">
                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white !bg-transparent text-xs"><ArrowLeft className="w-4 h-4 mr-1.5" />Panel</Button>
              </Link>
            )}
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white !bg-transparent text-xs" onClick={() => logoutAdmin().then(() => { window.location.href = '/yonetim'; })}>
              <LogOut className="w-4 h-4 mr-1.5" />Çıkış
            </Button>
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-2 sm:px-4 overflow-x-auto" aria-label="Reklam Merkezi bölümleri">
          <ul className="flex gap-1 min-w-max pb-0">
            {TABS.map((t) => {
              const Icon = t.icon;
              const on = t.id === tab;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setTab(t.id)}
                    aria-current={on ? 'page' : undefined}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${on ? 'border-amber-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                  >
                    <Icon className="w-4 h-4" aria-hidden />{t.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      {!['linkler', 'notlar', 'canli', 'takip'].includes(tab) && (
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-2">
            <select value={presetId} onChange={(e) => setPresetId(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium" aria-label="Tarih aralığı">
              {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              <option value="ozel">Özel aralık</option>
            </select>
            {presetId === 'ozel' && (
              <>
                <input type="date" aria-label="Başlangıç" value={custom.from} max={todayIst()} onChange={(e) => setCustomRange('from', e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm" />
                <span className="text-slate-400">–</span>
                <input type="date" aria-label="Bitiş" value={custom.to} max={todayIst()} onChange={(e) => setCustomRange('to', e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm" />
              </>
            )}
            <span className="text-xs text-slate-500 hidden sm:inline">{fmtDay(range.from, true)} – {fmtDay(range.to, true)} · karşılaştırma: {fmtDay(prevRange.from)} – {fmtDay(prevRange.to)}</span>
            <div className="ml-auto flex items-center gap-2">
              {hotels.length > 1 && !demo && (
                <select value={hotel ?? ''} onChange={(e) => setHotel(e.target.value ? Number(e.target.value) : null)} className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm" aria-label="Otel süz" title="Seçilen otelin odalarına bakan oturumlar">
                  <option value="">Tüm oteller</option>
                  {hotels.map((h) => <option key={h.id} value={h.id}>{h.name.replace('UYUROOM Hotel ', '')}</option>)}
                </select>
              )}
              <button type="button" onClick={toggleDemo} aria-pressed={demo} className={`h-9 px-3 rounded-lg border text-xs font-semibold ${demo ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                {demo ? 'Örnek veri açık' : 'Örnek veriyi göster'}
              </button>
              <Button variant="outline" size="sm" onClick={reload} className="h-9" aria-label="Yenile"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></Button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {demo && ['genel', 'kaynaklar', 'huni', 'sayfalar', 'rezervasyonlar', 'maliyet'].includes(tab) && (
          <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">Bu ekranda <b>uydurma örnek veri</b> gösteriliyor; gerçek rakamlar değildir. Kapatmak için üstteki “Örnek veri açık” düğmesine basın.</p>
        )}
        {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p>}

        {tab === 'takip' ? (
          <TrackingTab />
        ) : !ctx ? (
          loading ? (
            <div className="flex justify-center py-24"><div className="w-9 h-9 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : null
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {empty && !demo && ['genel', 'kaynaklar', 'huni', 'sayfalar'].includes(tab) && (
              <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
                <p className="font-bold text-slate-900">Bu aralıkta henüz ölçülmüş ziyaret yok</p>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed max-w-2xl">Ölçüm, ziyaretçi çerez bandında “Kabul Et” dediği andan itibaren çalışır. Reklam bağlantılarını Kampanya Linkleri sekmesinden oluşturup kullanırsanız her ziyaret doğru kampanyaya yazılır. Ekranların nasıl görüneceğini görmek için örnek veriyi açabilirsiniz.</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button size="sm" onClick={toggleDemo} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">Örnek veriyi göster</Button>
                  <Button size="sm" variant="outline" onClick={() => setTab('linkler')}>Kampanya linki oluştur</Button>
                  <Button size="sm" variant="outline" onClick={() => setTab('takip')}>Takip kodlarını gir</Button>
                </div>
              </div>
            )}
            {tab === 'genel' && <Overview ctx={ctx} goTab={(t) => setTab(t as TabId)} />}
            {tab === 'kaynaklar' && <Sources ctx={ctx} />}
            {tab === 'huni' && <FunnelTab ctx={ctx} />}
            {tab === 'sayfalar' && <PagesTab ctx={ctx} />}
            {tab === 'rezervasyonlar' && <BookingsTab ctx={ctx} />}
            {tab === 'maliyet' && <SpendTab ctx={ctx} />}
            {tab === 'linkler' && <LinksTab ctx={ctx} />}
            {tab === 'notlar' && <NotesTab ctx={ctx} />}
            {tab === 'canli' && <LiveTab ctx={ctx} />}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdsCenter;
export { addDays };
