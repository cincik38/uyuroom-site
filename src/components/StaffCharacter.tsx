import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CHARACTERS, CharacterClip, CharacterRole, WALK_LOOP, clipUrl } from '@/lib/characters';
import { clickLine, greetingLine, holdMs, pickLine } from '@/lib/characterTalk';

interface Props {
  role: CharacterRole;
  /** Başlangıç konumu, sahne genişliğinin yüzdesi (0-100) */
  startX: number;
  /** Sahne içinde gezinebileceği aralık (yüzde) */
  minX?: number;
  maxX?: number;
  size?: number;
  /** Alttan boşluk (px): ön/arka sıra hissi için */
  lift?: number;
  /** Gezinme ve kendiliğinden selam; test ve azaltılmış hareket için kapatılabilir */
  wander?: boolean;
  /** Ara sıra konuşma balonuyla otel hakkında bir şey söyler */
  talk?: boolean;
  /** Üst bilgideki küçük hâl: yerinde durur, kutuyu kaplar, balon aşağı açılır */
  inline?: boolean;
  /** Altında rol etiketi göster */
  showLabel?: boolean;
  /** Yerinde dururken ara sıra el sallar */
  greet?: boolean;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const CLIPS: CharacterClip[] = ['bekleme', 'selam', 'tepki', 'yurume'];

/**
 * Tek bir personel karakteri: bekler, ara ara yeni bir yere yürür, vardığında selam verir,
 * tıklanınca tepki verir. Şeffaf videolar üst üste durur, aktif olan görünür.
 */
export const StaffCharacter: React.FC<Props> = ({ role, startX, minX = 0, maxX = 100, size = 170, lift = 0, wander = true, talk = false, inline = false, showLabel = false, greet = false }) => {
  const def = CHARACTERS[role];
  const urls = useMemo(
    () => Object.fromEntries(CLIPS.map((c) => [c, clipUrl(role, c)])) as Record<CharacterClip, string>,
    [role],
  );
  const refs = {
    bekleme: useRef<HTMLVideoElement>(null),
    selam: useRef<HTMLVideoElement>(null),
    tepki: useRef<HTMLVideoElement>(null),
    yurume: useRef<HTMLVideoElement>(null),
  };
  const [clip, setClip] = useState<CharacterClip>('bekleme');
  const [x, setX] = useState(startX);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [moving, setMoving] = useState(false);
  const [dur, setDur] = useState(3000);
  const [bubble, setBubble] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loadExtras, setLoadExtras] = useState(false);
  const busy = useRef(false);
  const xRef = useRef(startX);
  const timers = useRef<number[]>([]);
  const raf = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  const bubbleEl = useRef<HTMLSpanElement>(null);
  const visible = useRef(true);
  const recent = useRef<string[]>([]);
  const [shift, setShift] = useState(0);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      cancelAnimationFrame(raf.current);
    };
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      const idle = refs.bekleme.current;
      if (!idle) return;
      if (!e.isIntersecting) idle.pause();
      else if (!busy.current) void idle.play().catch(() => undefined);
    });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
  };

  const play = useCallback((name: 'selam' | 'tepki', text?: string) => {
    const v = refs[name].current;
    if (!v || busy.current) return;
    busy.current = true;
    v.currentTime = 0;
    setClip(name);
    if (text) setBubble(text);
    void v.play().catch(() => {
      busy.current = false;
      setClip('bekleme');
      setBubble(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = (name: 'selam' | 'tepki') => {
    if (clip !== name) return;
    busy.current = false;
    setClip('bekleme');
    setBubble(null);
  };

  /** Hedefe yürür: yana dön, adım döngüsü, varınca öne dön, selam ver. */
  const walkTo = useCallback((target: number, travel: number) => {
    const v = refs.yurume.current;
    if (!v || busy.current) return;
    busy.current = true;
    const period = WALK_LOOP.end - WALK_LOOP.start;
    let arrived = false;
    let exitDone = false;

    setBubble(null);
    setFacing(target > xRef.current ? 1 : -1);
    v.currentTime = 0;
    setClip('yurume');
    void v.play().catch(() => {
      busy.current = false;
      setClip('bekleme');
    });
    setDur(travel);
    setMoving(true);
    xRef.current = target;
    setX(target);

    const tick = () => {
      const t = v.currentTime;
      if (!arrived) {
        if (t >= WALK_LOOP.end) v.currentTime = t - period;
      } else if (!exitDone && t >= WALK_LOOP.start) {
        // Aynı adım evresinden çıkış bölümüne atla
        exitDone = true;
        v.currentTime = Math.min(t, WALK_LOOP.end) + period;
        return;
      }
      if (!exitDone) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    later(() => {
      arrived = true;
      setMoving(false);
    }, travel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onWalkEnded = () => {
    busy.current = false;
    setFacing(1);
    setClip('bekleme');
    if (Math.random() < 0.6) later(() => play('selam', greetingLine()), 250);
  };

  // Gezinme döngüsü
  useEffect(() => {
    if (!wander || reduce.current) return;
    let alive = true;
    const step = () => {
      if (!alive) return;
      if (busy.current || !visible.current || document.hidden) {
        later(step, 1500);
        return;
      }
      const target = rand(minX, maxX);
      const dist = Math.abs(target - xRef.current);
      if (dist < 12) {
        later(step, 1200);
        return;
      }
      const travel = 3200 + dist * 45;
      walkTo(target, travel);
      later(step, travel + rand(7000, 12000));
    };
    later(step, rand(3000, 6000));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wander]);

  // Yerinde dururken ara sıra el sallar
  useEffect(() => {
    if (!greet) return;
    let alive = true;
    const hello = () => {
      if (!alive) return;
      if (!busy.current && visible.current && !document.hidden) play('selam', greetingLine());
      later(hello, rand(30000, 55000));
    };
    later(hello, rand(7000, 12000));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [greet]);

  // Konuşma döngüsü: ara sıra bir cümle söyler
  useEffect(() => {
    if (!talk) return;
    let alive = true;
    const speak = () => {
      if (!alive) return;
      if (busy.current || !visible.current || document.hidden) {
        later(speak, 3000);
        return;
      }
      const text = pickLine(recent.current);
      recent.current = [...recent.current, text].slice(-8);
      setShift(0);
      setBubble(text);
      later(() => setBubble((b) => (b === text ? null : b)), holdMs(text));
      later(speak, holdMs(text) + rand(9000, 20000));
    };
    later(speak, rand(5000, 9000));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talk]);

  // Balon ekran kenarından taşmasın
  useEffect(() => {
    const b = bubbleEl.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const pad = 10;
    const vw = document.documentElement.clientWidth;
    if (r.left < pad) setShift(pad - r.left);
    else if (r.right > vw - pad) setShift(vw - pad - r.right);
  }, [bubble]);

  return (
    <div
      ref={box}
      className={inline ? 'absolute inset-0' : 'absolute'}
      style={
        inline
          ? { opacity: ready ? 1 : 0, transition: 'opacity .4s' }
          : {
              bottom: lift,
              left: `clamp(${size / 2}px, ${x}%, calc(100% - ${size / 2}px))`,
              width: size,
              transform: 'translateX(-50%)',
              transition: moving ? `left ${dur}ms linear, opacity .4s` : 'opacity .4s',
              opacity: ready ? 1 : 0,
            }
      }
    >
      <button
        type="button"
        aria-label={`${def.label}, tıklayın`}
        onClick={() => play('tepki', clickLine())}
        className="relative block w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl"
        style={{ aspectRatio: '1 / 1', background: 'transparent' }}
      >
        {/* zemin gölgesi */}
        <span
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/30 blur-[3px]"
          style={{ bottom: '3%', width: '46%', height: '5%' }}
        />
        <div style={{ position: 'absolute', inset: 0, transform: `scaleX(${facing})` }}>
          {CLIPS.map((n) => (
            <video
              key={n}
              ref={refs[n]}
              src={n === 'bekleme' || loadExtras ? urls[n] : undefined}
              muted
              playsInline
              loop={n === 'bekleme'}
              autoPlay={n === 'bekleme'}
              preload="auto"
              onPlaying={n === 'bekleme' ? () => { setReady(true); setLoadExtras(true); } : undefined}
              onEnded={n === 'bekleme' ? undefined : n === 'yurume' ? onWalkEnded : () => finish(n)}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                opacity: clip === n ? 1 : 0,
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>
      </button>

      {bubble && (
        <span
          ref={bubbleEl}
          className={`pointer-events-none absolute z-10 w-max rounded-2xl bg-white px-3 py-2 text-center text-xs font-semibold leading-snug text-slate-800 shadow-lg ring-1 ring-black/5 sm:text-sm ${
            inline
              ? 'top-[calc(100%+2px)] left-0 max-w-[190px] lg:top-1/2 lg:left-full lg:ml-2.5 lg:max-w-[210px] lg:-translate-y-1/2'
              : 'max-w-[190px] sm:max-w-[250px]'
          }`}
          style={
            inline
              ? { translate: `${shift}px 0` }
              : {
                  top: '6%',
                  ...(x < 50
                    ? { left: `calc(50% + ${Math.round(size * 0.27)}px)` }
                    : { right: `calc(50% + ${Math.round(size * 0.27)}px)` }),
                  transform: `translateX(${shift}px)`,
                }
          }
          role="status"
        >
          {bubble}
          <span
            aria-hidden
            className={`absolute h-2.5 w-2.5 rotate-45 bg-white ${
              inline ? '-top-1 left-5 lg:top-1/2 lg:-left-1 lg:-mt-[5px]' : ''
            }`}
            style={inline ? undefined : { top: '40%', ...(x < 50 ? { left: -4 } : { right: -4 }) }}
          />
        </span>
      )}
      {showLabel && (
      <span className="mt-0.5 block text-center">
        <span className="inline-block rounded-full bg-slate-900/75 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
          {def.label}
        </span>
      </span>
      )}
    </div>
  );
};

export default StaffCharacter;
