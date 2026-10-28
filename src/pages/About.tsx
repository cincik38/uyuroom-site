import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Sparkles, Award, Heart, ShieldCheck, MapPin, Building2, BedDouble } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      {/* Hero */}
      <div className="pt-28 pb-16 bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Hakkımızda</span>
          <h1 className="text-3xl sm:text-5xl font-black text-white">
            UYUROOM HOTEL Hikayesi
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            "İyi bir gün, kusursuz bir uykuyla başlar" felsefesiyle yola çıktık.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 flex-1 space-y-16">
        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Vizyonumuz</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Adana ve Uşak'tan başlayarak tüm Türkiye'de modern, hijyenik, teknolojik ve erişilebilir lüks konaklama zinciri olmak.
              Misafirlerimize sadece bir yatak değil, ev konforunda huzurlu bir yaşam alanı sunuyoruz.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Misyonumuz</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Her şubemizde standart yüksek kalite, kusursuz ses yalıtımı, ortopedik yatak teknolojisi ve 
              esnek ödeme yöntemleriyle misafir memnuniyetini daima en üst seviyede tutmak.
            </p>
          </div>
        </div>

        {/* Growth & Branches */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-6">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Büyüme Yolculuğumuz</span>
          <h3 className="text-2xl sm:text-3xl font-extrabold">Adana & Uşak ile Başladık, Yakında Tüm Türkiye'deyiz</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Şu an Adana ve Uşak şubelerimizde misafirlerimize üst düzey hizmet sunmaktayız. 
            Çok şubeli yönetim altyapımız sayesinde portföyümüze çok yakında yeni şehirler ve lokasyonlar eklenecektir.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;