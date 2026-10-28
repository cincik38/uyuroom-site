import React, { useState } from 'react';
import { MessageCircle, X, Phone } from 'lucide-react';
import { BRANCH_CONTACTS, buildWhatsAppLink } from '@/lib/contacts';

/**
 * Tüm sayfalarda sağ altta sabit duran WhatsApp iletişim kutucuğu.
 * Tıklanınca Adana ve Uşak şubeleri listelenir, seçilen şubenin
 * WhatsApp hattı ön tanımlı Türkçe mesajla yeni sekmede açılır.
 */
export const WhatsAppWidget: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div className="w-[19rem] max-w-[calc(100vw-2.5rem)] rounded-2xl overflow-hidden shadow-2xl shadow-slate-950/40 border border-slate-800 bg-slate-900 animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Başlık */}
          <div className="bg-gradient-to-r from-[#075E54] to-[#128C7E] px-4 py-3.5 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">WhatsApp Destek</p>
                <p className="text-[11px] text-emerald-100/90">Genellikle dakikalar içinde yanıtlıyoruz</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="WhatsApp kutusunu kapat"
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Şube seçimi */}
          <div className="p-3.5 space-y-2.5 bg-slate-900">
            <p className="text-[11px] text-slate-400 font-medium px-0.5">
              Görüşmek istediğiniz şubeyi seçin:
            </p>

            {BRANCH_CONTACTS.map((branch) => (
              <a
                key={branch.key}
                href={buildWhatsAppLink(branch)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/70 border border-slate-700/70 hover:border-emerald-500/60 hover:bg-slate-800 transition-all group"
              >
                <div className="w-9 h-9 rounded-full bg-[#25D366]/15 border border-[#25D366]/40 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {branch.city} Şubesi
                  </p>
                  <p className="text-[11px] text-slate-400">{branch.phoneDisplay}</p>
                </div>
              </a>
            ))}

            {/* Telefonla arama alternatifi */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <p className="text-[11px] text-slate-500 font-medium px-0.5">Direkt telefonla arayın:</p>
              <div className="flex gap-2">
                {BRANCH_CONTACTS.map((branch) => (
                  <a
                    key={branch.key}
                    href={`tel:${branch.phoneRaw}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20 transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    {branch.city}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yüzen tetikleyici buton */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="WhatsApp ile iletişime geç"
        className="relative flex items-center gap-2.5 pl-4 pr-5 py-3.5 rounded-full bg-[#25D366] hover:bg-[#1fb855] text-white font-bold text-sm shadow-2xl shadow-emerald-900/40 transition-all hover:scale-105 active:scale-95"
      >
        {!open && (
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
        )}
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        <span className="hidden sm:inline">{open ? 'Kapat' : 'WhatsApp'}</span>
      </button>
    </div>
  );
};

export default WhatsAppWidget;