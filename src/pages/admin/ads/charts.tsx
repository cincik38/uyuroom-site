import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { DOW, fmtDay } from './lib';

/** Kapsayıcı genişliğini izler (grafik tam genişliğe oturur). */
export function useWidth<T extends HTMLElement>(): [React.RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setW(Math.max(260, Math.floor(el.clientWidth)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

export const Card: React.FC<{ title?: string; hint?: string; right?: React.ReactNode; className?: string; children: React.ReactNode }> = ({ title, hint, right, className = '', children }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm ${className}`}>
    {(title || right) && (
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          {title && <h3 className="text-sm sm:text-base font-bold text-slate-900">{title}</h3>}
          {hint && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{hint}</p>}
        </div>
        {right}
      </div>
    )}
    {children}
  </section>
);

/** Önceki döneme göre değişim. `invert`: düşüş iyi ise (maliyet gibi). */
export const Delta: React.FC<{ value: number | null; invert?: boolean }> = ({ value, invert }) => {
  if (value === null) return <span className="text-xs text-slate-400">yeni</span>;
  const r = Math.round(value);
  if (r === 0) return <span className="inline-flex items-center gap-0.5 text-xs text-slate-400"><Minus className="w-3 h-3" /> 0%</span>;
  const good = invert ? r < 0 : r > 0;
  const Icon = r > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${good ? 'text-emerald-700' : 'text-red-700'}`}>
      <Icon className="w-3.5 h-3.5" aria-hidden />
      {r > 0 ? '+' : ''}
      {r}%<span className="sr-only">{good ? ' iyileşme' : ' kötüleşme'}</span>
    </span>
  );
};

export const Spark: React.FC<{ values: number[]; color?: string }> = ({ values, color = '#2a78d6' }) => {
  const w = 96;
  const h = 28;
  if (values.length < 2) return <svg width={w} height={h} aria-hidden />;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * (w - 2) + 1},${h - 2 - (v / max) * (h - 4)}`);
  return (
    <svg width={w} height={h} aria-hidden className="shrink-0">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

export const KPI: React.FC<{ label: string; value: string; sub?: React.ReactNode; spark?: number[]; color?: string; title?: string }> = ({ label, value, sub, spark, color, title }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm min-w-0" title={title}>
    <p className="text-xs font-semibold text-slate-500 leading-tight">{label}</p>
    <div className="mt-1.5 flex items-end justify-between gap-2 flex-wrap">
      <p className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 tabular-nums">{value}</p>
      {spark && <span className="hidden xl:block"><Spark values={spark} color={color} /></span>}
    </div>
    {sub && <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">{sub}</div>}
  </div>
);

/* ------------------------------ Çizgi grafik ------------------------------ */
export interface LineSeries { key: string; label: string; color: string; values: number[]; dashed?: boolean }

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

export const LineChart: React.FC<{
  days: string[];
  series: LineSeries[];
  format?: (n: number) => string;
  height?: number;
  marks?: Array<{ day: string; label: string }>;
}> = ({ days, series, format = (n) => String(Math.round(n)), height = 240, marks = [] }) => {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 44, r: 12, t: 12, b: 26 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const n = days.length;
  const x = (i: number) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 70))));
  const markIdx = marks.map((m) => ({ ...m, i: days.indexOf(m.day) })).filter((m) => m.i >= 0);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - pad.l;
    setHover(Math.min(n - 1, Math.max(0, Math.round((px / Math.max(1, iw)) * (n - 1)))));
  };

  return (
    <div ref={ref} className="relative w-full">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Çizgi grafik: ${series.map((s) => s.label).join(', ')}`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        className="touch-pan-y select-none"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeWidth={1} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#64748b">{format(t)}</text>
          </g>
        ))}
        {days.map((d, i) =>
          i % step === 0 ? (
            <text key={d} x={x(i)} y={height - 8} textAnchor="middle" fontSize={11} fill="#64748b">{fmtDay(d)}</text>
          ) : null,
        )}
        {markIdx.map((m) => (
          <g key={m.day + m.label}>
            <line x1={x(m.i)} x2={x(m.i)} y1={pad.t} y2={pad.t + ih} stroke="#94a3b8" strokeDasharray="3 3" />
            <circle cx={x(m.i)} cy={pad.t + 3} r={4} fill="#475569" stroke="#fff" strokeWidth={2} />
          </g>
        ))}
        {series.map((s) => (
          <polyline
            key={s.key}
            points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dashed ? '5 4' : undefined}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="#475569" strokeWidth={1} />
            {series.map((s) => (
              <circle key={s.key} cx={x(hover)} cy={y(s.values[hover] ?? 0)} r={4} fill={s.color} stroke="#fff" strokeWidth={2} />
            ))}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: Math.min(Math.max(x(hover) - 70, 0), width - 150), top: 0 }}
        >
          <p className="font-bold text-slate-900 mb-1">{fmtDay(days[hover], true)}</p>
          {series.map((s) => (
            <p key={s.key} className="flex items-center gap-1.5 text-slate-700">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}: <b className="tabular-nums">{format(s.values[hover] ?? 0)}</b>
            </p>
          ))}
          {markIdx.filter((m) => m.i === hover).map((m) => (
            <p key={m.label} className="mt-1 text-slate-600 border-t border-slate-100 pt-1">📌 {m.label}</p>
          ))}
        </div>
      )}
      {series.length > 1 && <Legend items={series.map((s) => ({ label: s.label, color: s.color, dashed: s.dashed }))} />}
    </div>
  );
};

export const Legend: React.FC<{ items: Array<{ label: string; color: string; dashed?: boolean }> }> = ({ items }) => (
  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
    {items.map((i) => (
      <li key={i.label} className="flex items-center gap-1.5">
        <span className="inline-block w-3 h-1.5 rounded-sm" style={{ background: i.color, opacity: i.dashed ? 0.6 : 1 }} />
        {i.label}
      </li>
    ))}
  </ul>
);

/* ------------------------------ Yatay çubuklar ------------------------------ */
export interface BarRow { label: string; value: number; color?: string; right?: string; sub?: string }

export const HBars: React.FC<{ rows: BarRow[]; format?: (n: number) => string; empty?: string }> = ({ rows, format = (n) => String(Math.round(n)), empty = 'Veri yok' }) => {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="text-sm text-slate-400 py-6 text-center">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <span className="text-slate-800 truncate min-w-0" title={r.label}>{r.label}</span>
            <span className="text-slate-900 font-semibold tabular-nums shrink-0">
              {format(r.value)}
              {r.right && <span className="ml-2 text-xs font-normal text-slate-500">{r.right}</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden" role="presentation">
            <div className="h-full rounded-r-md" style={{ width: `${Math.max(1.5, (r.value / max) * 100)}%`, background: r.color ?? '#2a78d6' }} />
          </div>
          {r.sub && <p className="text-xs text-slate-500 mt-0.5">{r.sub}</p>}
        </li>
      ))}
    </ul>
  );
};

/** Tek çubukta pay dağılımı (segmentler arası 2px boşluk). */
export const ShareBar: React.FC<{ rows: Array<{ label: string; value: number; color: string }> }> = ({ rows }) => {
  const total = rows.reduce((a, r) => a + r.value, 0);
  if (total <= 0) return <p className="text-sm text-slate-400 py-4 text-center">Veri yok</p>;
  return (
    <div>
      <div className="flex h-5 w-full overflow-hidden rounded-md gap-[2px]" role="img" aria-label="Kaynak dağılımı">
        {rows.filter((r) => r.value > 0).map((r) => (
          <div key={r.label} style={{ width: `${(r.value / total) * 100}%`, background: r.color }} title={`${r.label}: %${Math.round((r.value / total) * 100)}`} />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-700">
        {rows.filter((r) => r.value > 0).map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: r.color }} />
              <span className="truncate">{r.label}</span>
            </span>
            <span className="tabular-nums font-semibold">%{Math.round((r.value / total) * 100)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ------------------------------ Huni ------------------------------ */
export const Funnel: React.FC<{ steps: Array<{ label: string; value: number; note?: string }> }> = ({ steps }) => {
  const top = Math.max(1, steps[0]?.value ?? 1);
  // Sıralı (ordinal) mavi basamaklar: yüzeye en yakın adım 250'den açık değil
  const shades = ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#104281'];
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        const loss = prev && prev > 0 ? Math.max(0, Math.round((1 - s.value / prev) * 100)) : null;
        return (
          <li key={s.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm mb-1">
              <span className="text-slate-800 font-medium">{s.label}</span>
              <span className="tabular-nums text-slate-900 font-bold">
                {s.value.toLocaleString('tr-TR')}
                <span className="ml-2 text-xs font-normal text-slate-500">%{Math.round((s.value / top) * 100)}</span>
              </span>
            </div>
            <div className="h-7 rounded-md bg-slate-100 overflow-hidden">
              <div className="h-full rounded-r-md" style={{ width: `${Math.max(1.5, (s.value / top) * 100)}%`, background: shades[Math.min(i, shades.length - 1)] }} />
            </div>
            {(loss !== null || s.note) && (
              <p className="text-xs text-slate-500 mt-0.5">
                {loss !== null && <>Önceki adımdan kayıp: <b className="text-slate-700">%{loss}</b></>}
                {s.note && <span className="ml-2">{s.note}</span>}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
};

/* ------------------------------ Isı haritası ------------------------------ */
const HEAT_STEPS = ['#eaf2fc', '#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95'];

export const HeatGrid: React.FC<{ data: Array<{ dow: number; hr: number; n: number }> }> = ({ data }) => {
  const [tip, setTip] = useState<{ dow: number; hr: number; n: number } | null>(null);
  const grid = useMemo(() => {
    const m = new Map<string, number>();
    data.forEach((d) => m.set(`${d.dow}-${d.hr}`, d.n));
    return m;
  }, [data]);
  const max = Math.max(1, ...data.map((d) => d.n));
  const level = (n: number) => (n <= 0 ? 0 : Math.min(HEAT_STEPS.length - 1, 1 + Math.floor((n / max) * (HEAT_STEPS.length - 2))));
  return (
    <div className="relative overflow-x-auto">
      <div className="min-w-[520px]">
        <div className="grid" style={{ gridTemplateColumns: '34px repeat(24, minmax(0,1fr))', gap: 2 }}>
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="text-[10px] text-slate-500 text-center">{h % 3 === 0 ? h : ''}</span>
          ))}
          {DOW.map((name, di) => (
            <React.Fragment key={name}>
              <span className="text-[11px] text-slate-600 leading-[18px]">{name}</span>
              {Array.from({ length: 24 }, (_, h) => {
                const n = grid.get(`${di + 1}-${h}`) ?? 0;
                return (
                  <button
                    type="button"
                    key={h}
                    aria-label={`${name} ${h}:00, ${n} oturum`}
                    onMouseEnter={() => setTip({ dow: di + 1, hr: h, n })}
                    onFocus={() => setTip({ dow: di + 1, hr: h, n })}
                    onMouseLeave={() => setTip(null)}
                    onBlur={() => setTip(null)}
                    className="h-[18px] rounded-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                    style={{ background: HEAT_STEPS[level(n)] }}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-600 h-4">
        {tip ? <>{DOW[tip.dow - 1]} {String(tip.hr).padStart(2, '0')}:00 – <b>{tip.n.toLocaleString('tr-TR')}</b> oturum</> : 'Koyu renk = daha çok ziyaretçi (İstanbul saati)'}
      </p>
    </div>
  );
};

/* ------------------------------ Tablo yardımcıları ------------------------------ */
export const Th: React.FC<{ children?: React.ReactNode; right?: boolean; className?: string }> = ({ children, right, className = '' }) => (
  <th className={`px-3 py-2 text-xs font-semibold text-slate-500 whitespace-nowrap ${right ? 'text-right' : 'text-left'} ${className}`}>{children}</th>
);
export const Td: React.FC<{ children?: React.ReactNode; right?: boolean; className?: string; title?: string }> = ({ children, right, className = '', title }) => (
  <td title={title} className={`px-3 py-2.5 text-sm text-slate-800 ${right ? 'text-right tabular-nums' : ''} ${className}`}>{children}</td>
);
export const TableWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative overflow-x-auto -mx-4 sm:-mx-5">
    <table className="w-full min-w-[560px] border-collapse [&_tbody_tr]:border-t [&_tbody_tr]:border-slate-100 [&_thead_tr]:border-b [&_thead_tr]:border-slate-200">{children}</table>
  </div>
);
export const Empty: React.FC<{ title: string; text: string }> = ({ title, text }) => (
  <div className="text-center py-10 px-4">
    <p className="font-semibold text-slate-700">{title}</p>
    <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">{text}</p>
  </div>
);
