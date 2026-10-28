import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, ShieldCheck, CreditCard, Banknote, Building, ChevronRight, MessageCircle, Navigation } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { BRANCH_CONTACTS, buildWhatsAppLink, buildMapLink } from '@/lib/contacts';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <BrandLogo size={58} tagline="Lüks & Butik Konaklama" />
            <p className="text-sm text-slate-400 leading-relaxed">
              Mükemmel bir uyku ve üstün konaklama konforu için Adana ve Uşak şubelerimizle hizmetinizdeyiz. 
              Gelişmiş rezervasyon altyapısı ve çoklu ödeme kolaylığı.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-amber-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Güvenli Rezervasyon
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-emerald-400 font-medium">
                <Banknote className="w-3.5 h-3.5" /> 3 Ödeme Seçeneği
              </span>
            </div>
          </div>

          {/* Branches Contact */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-400" /> Şubelerimiz
            </h3>
            <div className="space-y-4 text-sm">
              {BRANCH_CONTACTS.map((branch) => (
                <div key={branch.key} className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                  <p className="font-semibold text-amber-300">{branch.name}</p>
                  <p className="text-xs text-slate-400 mt-1 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    {branch.address}
                  </p>
                  <a
                    href={`tel:${branch.phoneRaw}`}
                    className="text-sm font-bold text-white mt-2 flex items-center gap-1.5 hover:text-amber-400 transition-colors tabular-nums"
                  >
                    <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                    {branch.phoneDisplay}
                  </a>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <a
                      href={buildWhatsAppLink(branch)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg bg-[#25D366]/15 border border-[#25D366]/35 text-[11px] font-bold text-emerald-300 hover:bg-[#25D366]/25 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp ile Yaz
                    </a>
                    <a
                      href={buildMapLink(branch.address, branch.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg bg-amber-400/15 border border-amber-400/40 text-[11px] font-bold text-amber-300 hover:bg-amber-400/25 transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Konuma Git
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-base mb-4">Hızlı Bağlantılar</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/tesisler" className="hover:text-amber-400 flex items-center gap-1 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" /> Odalar ve Süitler
                </Link>
              </li>
              <li>
                <Link to="/tesisler" className="hover:text-amber-400 flex items-center gap-1 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" /> Tesislerimiz
                </Link>
              </li>
              <li>
                <Link to="/booking-query" className="hover:text-amber-400 flex items-center gap-1 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" /> Rezervasyon Sorgulama
                </Link>
              </li>
              <li>
                <Link to="/policies" className="hover:text-amber-400 flex items-center gap-1 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" /> İptal & Konaklama Kuralları
                </Link>
              </li>
              <li>
                <Link to="/tesisler" className="hover:text-amber-400 flex items-center gap-1 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" /> Tüm Tesisler
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-amber-400 flex items-center gap-1 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" /> Blog & Seyahat Rehberi
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-amber-400 flex items-center gap-1 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" /> Hakkımızda & Vizyonumuz
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-amber-400 flex items-center gap-1 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" /> İletişim & Konum
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment & Security */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-base">Esnek Ödeme Seçenekleri</h3>
            <p className="text-xs text-slate-400">
              İster otelde kapıda nakit/kartla ödeyin, ister banka havalesiyle %5 ek indirim kazanın.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 p-2 rounded border border-slate-800">
                <Banknote className="w-4 h-4 text-emerald-400" />
                <span>Otelde Kapıda Ödeme (Nakit / POS)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 p-2 rounded border border-slate-800">
                <Building className="w-4 h-4 text-blue-400" />
                <span>Banka Havalesi / EFT / FAST</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} UYUROOM HOTEL. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-6">
            <Link to="/policies" className="hover:text-slate-400">Gizlilik Sözleşmesi</Link>
            <Link to="/policies" className="hover:text-slate-400">KVKK Aydınlatma Metni</Link>
            <Link to="/policies" className="hover:text-slate-400">İptal ve İade Koşulları</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};