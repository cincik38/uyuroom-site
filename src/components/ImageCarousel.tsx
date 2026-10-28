import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, ImageOff } from 'lucide-react';
import { IMAGE_PLACEHOLDER, handleImageError } from '@/lib/media';

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
  /** Ana görselin en-boy oranı sınıfı (varsayılan 16/9). */
  aspectClassName?: string;
}

const SWIPE_THRESHOLD = 48;

/**
 * Tek büyük görsel + ok butonları + mobil swipe + küçük önizleme şeridi ve
 * tam ekran lightbox sunan ortak galeri bileşeni.
 */
const ImageCarousel = ({
  images,
  alt = '',
  className = '',
  aspectClassName = 'aspect-[16/9]',
}: ImageCarouselProps) => {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const total = images.length;
  const hasMultiple = total > 1;

  const go = useCallback(
    (delta: number) => {
      if (total === 0) return;
      setIndex((prev) => (prev + delta + total) % total);
    },
    [total],
  );

  useEffect(() => {
    setIndex(0);
  }, [total]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightbox, go]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start === null || !hasMultiple) return;
    const diff = start - (e.changedTouches[0]?.clientX ?? start);
    if (Math.abs(diff) < SWIPE_THRESHOLD) return;
    go(diff > 0 ? 1 : -1);
  };

  if (total === 0) {
    return (
      <div
        className={`rounded-2xl bg-slate-200 ${aspectClassName} flex flex-col items-center justify-center text-slate-400 gap-2 ${className}`}
      >
        <ImageOff className="w-8 h-8" />
        <span className="text-xs font-semibold">Görsel eklenmemiş</span>
      </div>
    );
  }

  const arrowClass =
    'absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-950/60 hover:bg-slate-950/85 text-white flex items-center justify-center transition-colors backdrop-blur-sm';

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        className={`relative rounded-2xl overflow-hidden bg-slate-900 ${aspectClassName} select-none`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={images[index] || IMAGE_PLACEHOLDER}
          onError={handleImageError}
          alt={alt}
          onClick={() => setLightbox(true)}
          className="w-full h-full object-cover cursor-zoom-in"
        />

        {hasMultiple && (
          <>
            <button
              type="button"
              aria-label="Önceki görsel"
              onClick={() => go(-1)}
              className={`${arrowClass} left-3`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              aria-label="Sonraki görsel"
              onClick={() => go(1)}
              className={`${arrowClass} right-3`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {images.map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  aria-label={`${i + 1}. görsel`}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? 'w-6 bg-amber-400' : 'w-2 bg-white/60 hover:bg-white'
                  }`}
                />
              ))}
            </div>
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-950/70 text-white text-[11px] font-bold">
              {index + 1} / {total}
            </div>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={`thumb-${img}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${i + 1}. görseli göster`}
              className={`shrink-0 w-24 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                i === index ? 'border-amber-500' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} onError={handleImageError} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-4"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            type="button"
            aria-label="Kapat"
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>

          {hasMultiple && (
            <button
              type="button"
              aria-label="Önceki görsel"
              onClick={() => go(-1)}
              className={`${arrowClass} left-4`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <img
            src={images[index] || IMAGE_PLACEHOLDER}
            onError={handleImageError}
            alt={alt}
            className="max-w-full max-h-[85vh] object-contain rounded-xl"
          />

          {hasMultiple && (
            <button
              type="button"
              aria-label="Sonraki görsel"
              onClick={() => go(1)}
              className={`${arrowClass} right-4`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg">
            {index + 1} / {total}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
