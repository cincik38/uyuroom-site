/**
 * Cihazdan medya yükleme bileşeni.
 * Object Storage'a yükler, object_key'i çözerek önizleme gösterir;
 * sıralama, kapak seçimi ve silme işlemlerini yönetir.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, MoveLeft, MoveRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase, MEDIA_BUCKET as BUCKET_NAME } from '@/lib/supabase';

export const MEDIA_BUCKET = BUCKET_NAME
const BUCKET = BUCKET_NAME;

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_MB = 10;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

const MAX_EDGE = 2000;
const OUTPUT_QUALITY = 0.85;

/**
 * Telefon fotoğraflarını yüklemeden önce uzun kenarı 2000px olacak şekilde
 * küçültür ve JPEG'e çevirir. Boyut limiti ve yavaş yükleme sorununu önler.
 */
async function prepareImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', OUTPUT_QUALITY),
    );
    if (!blob) return file;
    if (blob.size >= file.size && scale === 1) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  } catch (e) {
    console.warn('[MediaUploader] Görsel yeniden boyutlandırılamadı, orijinal gönderiliyor:', e);
    return file;
  }
}

/** Yükleme sırasında oluşan ağ/istemci hatasını mesaja çevirir. */
function describeUploadError(error: unknown): string {
  const message = String((error as { message?: string })?.message || '');
  if (/failed to fetch|network|timeout/i.test(message)) {
    return 'Sunucuya ulaşılamadı, internet bağlantınızı kontrol edip tekrar deneyin.';
  }
  return message || 'Beklenmeyen bir hata oluştu.';
}

/** object_key veya tam URL'i gösterilebilir bir adrese çevirir. */
export async function resolveMediaUrl(value: string): Promise<string> {
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value;
  return supabase.storage.from(BUCKET).getPublicUrl(value).data.publicUrl;
}

interface MediaUploaderProps {
  /** Kayıtlı değerler: object_key veya eski kayıtlardan gelen URL. */
  value: string[];
  onChange: (next: string[]) => void;
  /** Yükleme klasörü öneki, örn. "hotel-12/gallery". */
  prefix: string;
  label?: string;
  showCover?: boolean;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  value,
  onChange,
  prefix,
  label = 'Fotoğraflar',
  showCover = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const refreshPreviews = useCallback(async () => {
    const entries = await Promise.all(
      value.map(async (key) => [key, await resolveMediaUrl(key)] as const),
    );
    setPreviews(Object.fromEntries(entries));
  }, [value]);

  useEffect(() => {
    refreshPreviews();
  }, [refreshPreviews]);

  const uploadFiles = async (files: FileList | File[]) => {
    const selected = Array.from(files);
    if (!selected.length) return;

    const accepted: File[] = [];
    for (const file of selected) {
      const isImage = file.type.startsWith('image/') || ALLOWED_TYPES.includes(file.type);
      if (!isImage) {
        toast.error(`${file.name}: Yalnızca görsel dosyası yükleyebilirsiniz.`);
        continue;
      }
      accepted.push(file);
    }
    if (!accepted.length) {
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setUploading(true);
    setProgress({ done: 0, total: accepted.length });
    const added: string[] = [];
    let failed = 0;

    for (const file of accepted) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const prepared = await prepareImage(file);
        if (prepared.size > MAX_FILE_BYTES) {
          throw new Error(`Dosya ${MAX_FILE_MB} MB sınırını aşıyor.`);
        }
        const ext = prepared.type === 'image/jpeg' ? 'jpg' : (prepared.name.split('.').pop() || 'jpg');
        const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        // eslint-disable-next-line no-await-in-loop
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, prepared, { contentType: prepared.type, cacheControl: '31536000' });
        if (upErr) throw new Error(upErr.message);
        const stored: string = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        added.push(stored);
      } catch (e) {
        failed += 1;
        console.error('[MediaUploader] Yükleme hatası:', file.name, e);
        toast.error(`${file.name}: ${describeUploadError(e)}`);
      } finally {
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
    }

    if (added.length) {
      onChange([...value, ...added]);
      toast.success(`${added.length} görsel yüklendi.`);
    } else if (!failed) {
      toast.error('Görsel yüklenemedi.');
    }

    setUploading(false);
    setProgress({ done: 0, total: 0 });
    if (inputRef.current) inputRef.current.value = '';
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{label}</p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? 'border-amber-500 bg-amber-50' : 'border-slate-300 bg-slate-50'
        }`}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-700">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />{' '}
            {progress.total > 1
              ? `Yükleniyor... (${progress.done}/${progress.total})`
              : 'Yükleniyor...'}
          </div>
        ) : (
          <div className="space-y-1">
            <ImagePlus className="w-7 h-7 mx-auto text-amber-500" />
            <p className="text-sm font-bold text-slate-800">
              Bilgisayarınızdan fotoğraf seçin veya buraya sürükleyin
            </p>
            <p className="text-[11px] text-slate-500">JPG, PNG, WebP · en fazla {MAX_FILE_MB} MB · çoklu seçim yapabilirsiniz</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={uploading}
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {value.map((key, idx) => (
            <div
              key={`${key}-${idx}`}
              className="rounded-xl overflow-hidden border border-slate-200 bg-white"
            >
              {previews[key] ? (
                <img src={previews[key]} alt={`Görsel ${idx + 1}`} className="w-full h-28 object-cover" />
              ) : (
                <div className="w-full h-28 flex items-center justify-center bg-slate-100 text-[11px] text-slate-500">
                  Önizleme hazırlanıyor
                </div>
              )}
              <div className="p-2 flex flex-wrap items-center gap-1">
                {showCover && idx === 0 && (
                  <span className="px-1.5 py-1 rounded bg-amber-100 text-amber-800 text-[10px] font-black flex items-center gap-1">
                    <Star className="w-3 h-3" /> KAPAK
                  </span>
                )}
                {showCover && idx !== 0 && (
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => onChange([key, ...value.filter((_, i) => i !== idx)])}
                    className="h-8 px-2 bg-slate-950 text-amber-400 text-[10px] font-bold"
                  >
                    Kapak
                  </Button>
                )}
                <Button
                  size="sm"
                  type="button"
                  disabled={idx === 0}
                  onClick={() => move(idx, -1)}
                  className="h-8 px-2 bg-slate-200 text-slate-700"
                >
                  <MoveLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  type="button"
                  disabled={idx === value.length - 1}
                  onClick={() => move(idx, 1)}
                  className="h-8 px-2 bg-slate-200 text-slate-700"
                >
                  <MoveRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  type="button"
                  onClick={() => onChange(value.filter((_, i) => i !== idx))}
                  className="h-8 px-2 bg-red-500 hover:bg-red-600 text-white"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
