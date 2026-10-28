import React from 'react';
import { Minus, Plus, Users, Baby } from 'lucide-react';

export const MAX_ADULTS = 8;
export const MAX_CHILDREN = 6;

interface GuestSelectorProps {
  adults: number;
  children: number;
  onAdultsChange: (value: number) => void;
  onChildrenChange: (value: number) => void;
  /** Koyu tema üzerinde mi kullanılıyor */
  variant?: 'light' | 'dark';
  /** Kompakt (filtre kenar çubuğu) görünümü */
  compact?: boolean;
}

interface StepperRowProps {
  icon: React.ReactNode;
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  compact: boolean;
  dark: boolean;
}

const StepperRow: React.FC<StepperRowProps> = ({
  icon,
  label,
  hint,
  value,
  min,
  max,
  onChange,
  compact,
  dark,
}) => {
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl border transition-colors ${
        compact ? 'px-2.5 py-2' : 'px-3 py-2.5'
      } ${dark ? 'bg-slate-900/70 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-amber-500 shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className={`text-xs font-bold leading-tight ${dark ? 'text-white' : 'text-slate-800'}`}>
            {label}
          </p>
          <p className={`text-[10px] leading-tight ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            {hint}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          aria-label={`${label} azalt`}
          disabled={!canDecrease}
          onClick={() => canDecrease && onChange(value - 1)}
          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
            canDecrease
              ? dark
                ? 'border-slate-600 text-amber-400 hover:bg-slate-800'
                : 'border-slate-300 text-slate-700 hover:bg-white'
              : 'border-slate-200 text-slate-300 cursor-not-allowed'
          }`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <span
          className={`w-6 text-center text-sm font-black tabular-nums ${
            dark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {value}
        </span>

        <button
          type="button"
          aria-label={`${label} arttır`}
          disabled={!canIncrease}
          onClick={() => canIncrease && onChange(value + 1)}
          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
            canIncrease
              ? 'border-amber-500 bg-amber-500 text-slate-950 hover:bg-amber-600'
              : 'border-slate-200 text-slate-300 cursor-not-allowed'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/**
 * Yetişkin ve çocuk misafir sayısını ayrı ayrı seçmeye yarayan stepper bileşeni.
 * Yetişkin minimum 1, çocuk minimum 0 olacak şekilde sınırlandırılmıştır.
 */
export const GuestSelector: React.FC<GuestSelectorProps> = ({
  adults,
  children,
  onAdultsChange,
  onChildrenChange,
  variant = 'light',
  compact = false,
}) => {
  const dark = variant === 'dark';

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <StepperRow
        icon={<Users className="w-4 h-4" />}
        label="Yetişkin"
        hint="13 yaş ve üzeri"
        value={adults}
        min={1}
        max={MAX_ADULTS}
        onChange={onAdultsChange}
        compact={compact}
        dark={dark}
      />
      <StepperRow
        icon={<Baby className="w-4 h-4" />}
        label="Çocuk"
        hint="0 - 12 yaş"
        value={children}
        min={0}
        max={MAX_CHILDREN}
        onChange={onChildrenChange}
        compact={compact}
        dark={dark}
      />
    </div>
  );
};

export default GuestSelector;