import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BedDouble, Phone, Menu, X, MessageCircle, Building2, Home } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { BRANCH_CONTACTS, buildWhatsAppLink } from '@/lib/contacts';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Tesislerimiz', path: '/tesisler' },
    { name: 'Blog', path: '/blog' },
    { name: 'Rezervasyon Sorgula', path: '/booking-query' },
    { name: 'İletişim', path: '/contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || location.pathname !== '/'
          ? 'bg-slate-900/95 backdrop-blur-md shadow-lg text-white'
          : 'bg-gradient-to-b from-slate-950/95 via-slate-900/70 to-transparent text-white'
      }`}
    >
      {/* Üst İletişim Şeridi — Şube Telefonları (tüm ekranlarda görünür) */}
      <div className="bg-slate-950/90 border-b border-amber-500/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center sm:justify-between gap-2 h-9">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <Phone className="w-3 h-3 text-amber-400" />
              Rezervasyon için hemen arayın:
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              {BRANCH_CONTACTS.map((branch) => (
                <a
                  key={branch.key}
                  href={`tel:${branch.phoneRaw}`}
                  className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md bg-amber-400/10 border border-amber-400/25 text-[11px] sm:text-xs font-bold text-amber-300 hover:bg-amber-400/20 hover:text-amber-200 transition-colors whitespace-nowrap"
                  title={`${branch.name} - ${branch.phoneDisplay}`}
                >
                  <Phone className="w-3 h-3" />
                  <span className="font-extrabold">{branch.city}:</span>
                  <span className="tabular-nums">{branch.phoneDisplay}</span>
                </a>
              ))}

              <a
                href={buildWhatsAppLink(BRANCH_CONTACTS[0])}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#25D366]/15 border border-[#25D366]/35 text-xs font-bold text-emerald-300 hover:bg-[#25D366]/25 transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all ${isScrolled ? 'py-2.5' : 'py-3'}`}>
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center group" aria-label="UYUROOM HOTEL ana sayfa">
            <BrandLogo
              size={56}
              tagline="Adana • Uşak"
              className="group-hover:scale-[1.03] transition-transform"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-7">
            <Link
              to="/"
              aria-label="Ana sayfa"
              title="Ana Sayfa"
              className={`transition-colors hover:text-amber-400 ${
                location.pathname === '/' ? 'text-amber-400' : 'text-slate-200'
              }`}
            >
              <Home className="w-5 h-5" />
            </Link>
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-amber-400 relative py-1 ${
                    isActive ? 'text-amber-400 font-semibold' : 'text-slate-200'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">

            <Link to="/tesisler">
              <Button
                variant="outline"
                className="border-amber-400/50 text-amber-300 hover:bg-amber-400/10 hover:text-amber-200 text-xs sm:text-sm !bg-transparent"
              >
                <BedDouble className="w-4 h-4 mr-1.5" />
                Hemen Oda Seç
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex lg:hidden items-center gap-2">
            <Link to="/" aria-label="Ana sayfa">
              <Button variant="ghost" size="icon" className="text-slate-300">
                <Home className="w-5 h-5 text-amber-400" />
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-200 hover:text-white focus:outline-none"
              aria-label="Menü"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800 hover:text-amber-400"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobil Şube İletişim Bloğu */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest px-1">
              Şube İletişim Hatları
            </p>
            {BRANCH_CONTACTS.map((branch) => (
              <div
                key={branch.key}
                className="flex items-center justify-between gap-2 bg-slate-800/60 border border-slate-700/70 rounded-xl p-2.5"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">{branch.city} Şubesi</p>
                  <p className="text-[11px] text-slate-400 tabular-nums">{branch.phoneDisplay}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`tel:${branch.phoneRaw}`}
                    className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center"
                    aria-label={`${branch.city} şubesini ara`}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href={buildWhatsAppLink(branch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-[#25D366] text-white flex items-center justify-center"
                    aria-label={`${branch.city} şubesine WhatsApp mesajı gönder`}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <Link to="/tesisler" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                <BedDouble className="w-4 h-4 mr-2" />
                Oda Ara & Rezervasyon Yap
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};