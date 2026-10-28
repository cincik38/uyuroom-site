import { client } from './api';

/** Rezervasyon ödeme adımında gösterilen havale/EFT hesabı. */
export interface BankAccount {
  bank_name: string;
  account_holder: string;
  iban: string;
  branch: string;
  note?: string;
}

const SETTING_KEY = 'bank_accounts';

/** Gerçek hesap girilene kadar boş: sahte IBAN asla gösterilmez. */
export const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [];

/** IBAN'ı 4'erli gruplar halinde okunaklı biçimde döndürür. */
export function formatIban(iban: string): string {
  const compact = normalizeIban(iban);
  return compact.replace(/(.{4})/g, '$1 ').trim();
}

/** Boşluk ve küçük harfleri temizleyip standart IBAN gösterimi üretir. */
export function normalizeIban(iban: string): string {
  return String(iban || '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

/** Türkiye IBAN formatını (TR + 24 rakam) doğrular. */
export function isValidIban(iban: string): boolean {
  return /^TR\d{24}$/.test(normalizeIban(iban));
}

function sanitize(list: unknown): BankAccount[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((raw) => {
      const item = (raw || {}) as Partial<BankAccount>;
      return {
        bank_name: String(item.bank_name || '').trim(),
        account_holder: String(item.account_holder || '').trim(),
        iban: normalizeIban(item.iban || ''),
        branch: String(item.branch || '').trim(),
        note: String(item.note || '').trim(),
      };
    })
    .filter((item) => item.bank_name && item.iban);
}

/** Süper adminin kaydettiği banka hesaplarını yükler, yoksa varsayılana düşer. */
export async function loadBankAccounts(): Promise<BankAccount[]> {
  try {
    const response = await client.entities.platform_settings.query({
      query: { setting_key: SETTING_KEY },
      limit: 1,
    });
    const value = response?.data?.items?.[0]?.setting_value;
    if (value) {
      const parsed = sanitize(JSON.parse(String(value)));
      if (parsed.length > 0) return parsed;
    }
  } catch {
    /* varsayılana düş */
  }
  return DEFAULT_BANK_ACCOUNTS;
}

/**
 * Tesise ait banka hesaplarını çözer.
 * Yeni yapı `bank_accounts` JSON alanıdır; eski tekil `bank_name` + `iban`
 * alanları da güvenli şekilde bu yapıya dönüştürülür.
 */
export function resolveHotelBankAccounts(hotel: unknown): BankAccount[] {
  const record = (hotel || {}) as Record<string, unknown>;
  const raw = record.bank_accounts;
  if (raw) {
    try {
      const parsed = sanitize(typeof raw === 'string' ? JSON.parse(raw) : raw);
      if (parsed.length > 0) return parsed;
    } catch {
      /* eski alana düş */
    }
  }
  const legacy = sanitize([
    {
      bank_name: record.bank_name,
      account_holder: record.legal_name || record.name,
      iban: record.iban,
      branch: '',
      note: '',
    },
  ]);
  return legacy;
}

/** Tesis banka hesaplarını `hotels` kaydına kalıcı olarak yazar. */
export async function saveHotelBankAccounts(
  hotelId: string | number,
  accounts: BankAccount[],
): Promise<BankAccount[]> {
  const clean = sanitize(accounts);
  await client.entities.hotels.update({
    id: String(hotelId),
    data: {
      bank_accounts: JSON.stringify(clean),
      bank_name: clean[0]?.bank_name || '',
      iban: clean[0]?.iban || '',
    },
  });
  return clean;
}

/**
 * Ödeme ekranlarında gösterilecek hesapları öncelik kuralıyla döndürür:
 * tesisin kendi hesapları varsa onlar, yoksa platform hesapları.
 */
export async function resolvePayableBankAccounts(
  hotel: unknown,
): Promise<{ accounts: BankAccount[]; source: 'hotel' | 'platform' }> {
  const hotelAccounts = resolveHotelBankAccounts(hotel);
  if (hotelAccounts.length > 0) return { accounts: hotelAccounts, source: 'hotel' };
  return { accounts: await loadBankAccounts(), source: 'platform' };
}

/** Banka hesaplarını platform ayarlarına kalıcı olarak yazar. */
export async function saveBankAccounts(accounts: BankAccount[]): Promise<void> {
  const payload = JSON.stringify(sanitize(accounts));
  const response = await client.entities.platform_settings.query({
    query: { setting_key: SETTING_KEY },
    limit: 1,
  });
  const existing = response?.data?.items?.[0];
  if (existing?.id) {
    await client.entities.platform_settings.update({
      id: String(existing.id),
      data: { setting_value: payload },
    });
    return;
  }
  await client.entities.platform_settings.create({
    data: { setting_key: SETTING_KEY, setting_value: payload },
  });
}
