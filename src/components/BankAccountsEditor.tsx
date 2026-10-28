import React from 'react';
import { Button } from '@/components/ui/button';
import { formatIban, isValidIban, normalizeIban, type BankAccount } from '@/lib/bank';

interface BankAccountsEditorProps {
  accounts: BankAccount[];
  onChange: (accounts: BankAccount[]) => void;
  onSave: () => void;
  title?: string;
  description?: string;
  saveLabel?: string;
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm min-h-[44px] bg-white';

/**
 * Banka/IBAN hesaplarının eklenip düzenlendiği ortak editör.
 * Hem süper admin platform hesapları hem de tesis bazlı hesaplar için kullanılır.
 */
export const BankAccountsEditor: React.FC<BankAccountsEditorProps> = ({
  accounts,
  onChange,
  onSave,
  title = 'Havale / EFT Banka Hesapları',
  description,
  saveLabel = 'Banka Hesaplarını Kaydet',
}) => {
  const updateField = (index: number, field: keyof BankAccount, value: string) => {
    onChange(
      accounts.map((item, i) =>
        i === index ? { ...item, [field]: field === 'iban' ? normalizeIban(value) : value } : item,
      ),
    );
  };

  const addAccount = () =>
    onChange([...accounts, { bank_name: '', account_holder: '', iban: '', branch: '', note: '' }]);

  const removeAccount = (index: number) => onChange(accounts.filter((_, i) => i !== index));

  const moveAccount = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= accounts.length) return;
    const next = [...accounts];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>

      {accounts.length === 0 && (
        <p className="text-sm text-slate-500 p-4 rounded-xl border border-dashed border-slate-300">
          Henüz banka hesabı eklenmedi.
        </p>
      )}

      <div className="space-y-4">
        {accounts.map((acc, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={acc.bank_name}
                onChange={(e) => updateField(idx, 'bank_name', e.target.value)}
                placeholder="Banka adı"
                className={inputClass}
              />
              <input
                value={acc.account_holder}
                onChange={(e) => updateField(idx, 'account_holder', e.target.value)}
                placeholder="Hesap sahibi / yasal ünvan"
                className={inputClass}
              />
              <input
                value={acc.branch}
                onChange={(e) => updateField(idx, 'branch', e.target.value)}
                placeholder="Şube"
                className={inputClass}
              />
              <input
                value={acc.iban}
                onChange={(e) => updateField(idx, 'iban', e.target.value)}
                placeholder="TR000000000000000000000000"
                className={`${inputClass} font-mono ${
                  acc.iban && !isValidIban(acc.iban) ? 'border-red-400 bg-red-50' : ''
                }`}
              />
            </div>
            <input
              value={acc.note || ''}
              onChange={(e) => updateField(idx, 'note', e.target.value)}
              placeholder="Açıklama notu (opsiyonel)"
              className={inputClass}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 font-mono">
                {acc.iban ? formatIban(acc.iban) : 'IBAN girilmedi'}
                {acc.iban && !isValidIban(acc.iban) && (
                  <span className="text-red-600 font-bold ml-2">Geçersiz IBAN</span>
                )}
              </span>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="bg-slate-950 text-amber-400 text-[11px] min-h-[36px]"
                  onClick={() => moveAccount(idx, -1)}
                  disabled={idx === 0}
                >
                  Yukarı
                </Button>
                <Button
                  size="sm"
                  className="bg-slate-950 text-amber-400 text-[11px] min-h-[36px]"
                  onClick={() => moveAccount(idx, 1)}
                  disabled={idx === accounts.length - 1}
                >
                  Aşağı
                </Button>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white text-[11px] min-h-[36px]"
                  onClick={() => removeAccount(idx)}
                >
                  Sil
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={addAccount}
          className="bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold min-h-[44px]"
        >
          Hesap Ekle
        </Button>
        <Button
          onClick={onSave}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black min-h-[44px]"
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  );
};

export default BankAccountsEditor;
