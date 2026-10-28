import React from 'react';

interface BrandLogoProps {
  /** Kare logo işaretinin piksel boyutu */
  size?: number;
  /** Yanında "HOTEL" kelime markası gösterilsin mi */
  withWordmark?: boolean;
  /** Kelime markası altındaki küçük açıklama satırı */
  tagline?: string;
  /** Açık zeminde kullanım için (koyu metin) */
  variant?: 'dark' | 'light';
  className?: string;
}

/**
 * UYUROOM HOTEL marka kilidi.
 * Üst satırda büyük "UYU", altında ince harf aralıklı "ROOM" yazar.
 * SVG olduğu için her boyutta net görünür.
 */
export const BrandLogoMark: React.FC<{ size?: number; className?: string }> = ({
  size = 44,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    role="img"
    aria-label="UYUROOM"
    className={className}
  >
    <defs>
      <linearGradient id="uyuroomBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#101a30" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
      <linearGradient id="uyuroomGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="50%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>

    <rect x="1.5" y="1.5" width="61" height="61" rx="15" fill="url(#uyuroomBg)" />
    <rect
      x="1.5"
      y="1.5"
      width="61"
      height="61"
      rx="15"
      fill="none"
      stroke="url(#uyuroomGold)"
      strokeWidth="2.5"
    />

    <text
      x="32"
      y="30.5"
      textAnchor="middle"
      fill="url(#uyuroomGold)"
      fontFamily="Inter, Segoe UI, system-ui, sans-serif"
      fontSize="21"
      fontWeight="800"
      letterSpacing="1.2"
    >
      UYU
    </text>

    <rect x="17" y="36" width="30" height="1.4" rx="0.7" fill="url(#uyuroomGold)" opacity="0.65" />

    <text
      x="32"
      y="51"
      textAnchor="middle"
      fill="#f8fafc"
      fontFamily="Inter, Segoe UI, system-ui, sans-serif"
      fontSize="11.5"
      fontWeight="700"
      letterSpacing="2.6"
    >
      ROOM
    </text>
  </svg>
);

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 44,
  withWordmark = true,
  tagline,
  variant = 'dark',
  className = '',
}) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <BrandLogoMark size={size} className="shrink-0 drop-shadow-[0_4px_14px_rgba(251,191,36,0.25)]" />
    {withWordmark && (
      <div className="leading-tight">
        <span
          className={`block text-[13px] sm:text-sm font-extrabold tracking-[0.32em] ${
            variant === 'light' ? 'text-slate-900' : 'text-amber-400'
          }`}
        >
          HOTEL
        </span>
        {tagline && (
          <span
            className={`block text-[10px] tracking-[0.18em] uppercase font-medium ${
              variant === 'light' ? 'text-slate-500' : 'text-slate-300'
            }`}
          >
            {tagline}
          </span>
        )}
      </div>
    )}
  </div>
);