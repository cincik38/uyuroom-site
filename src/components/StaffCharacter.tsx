import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CHARACTERS, CharacterClip, CharacterRole, WALK_LOOP, clipUrl } from '@/lib/characters';

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
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const CLIPS: CharacterClip[] = ['bekleme', 'selam', 'tepki', 'yurume'];

/**
 * Tek bir personel karakteri: bekler, ara ara yeni bir yere yürür, vardığında selam verir,
 * tıklanınca tepki verir. Şeffaf videolar üst üste durur, aktif olan görünür.
 */
export const StaffCharacter: React.FC<Props> = ({ role, startX, minX = 0, maxX = 100, size = 170, lift = 0, wander = true }) => {
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
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      cancelAnimationFrame(raf.current);
    };
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
    if (Math.random() < 0.6) later(() => play('selam', def.greeting), 250);
  };

  // Gezinme döngüsü
  useEffect(() => {
    if (!wander || reduce.current) return;
    let alive = true;
    const step = () => {
      if (!alive) return;
      if (busy.current) {
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

  return (
    <div
      className="absolute"
      style={{
        bottom: lift,
        left: `clamp(${size / 2}px, ${x}%, calc(100% - ${size / 2}px))`,
        width: size,
        transform: 'translateX(-50%)',
        transition: moving ? `left ${dur}ms linear, opacity .4s` : 'opacity .4s',
        opacity: ready ? 1 : 0,
      }}
    >
      <button
        type="button"
        aria-label={`${def.label}, tıklayın`}
        onClick={() => play('tepki', 'Hihi!')}
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
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-lg ring-1 ring-black/5"
          style={{ top: '-2%' }}
          role="status"
        >
          {bubble}
        </span>
      )}
      <span className="mt-0.5 block text-center">
        <span className="inline-block rounded-full bg-slate-900/75 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
          {def.label}
        </span>
      </span>
    </div>
  );
};

export default StaffCharacter;
