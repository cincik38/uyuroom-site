import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ShieldCheck, Clock, FileText, CheckCircle2 } from 'lucide-react';

export const Policies: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <div className="pt-28 pb-12 bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Şartlar & Koşullar</span>
          <h1 className="text-3xl sm:text-5xl font-black text-white">Konaklama ve İptal Politikası</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-8 text-sm text-slate-700">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" /> Giriş ve Çıkış Saatleri
          </h2>
          <p>• Otele giriş saati en erken 14:00'tür.</p>
          <p>• Otelden ayrılış saati en geç 12:00'dir. Müsaitlik durumuna göre geç çıkış resepsiyon onayıyla yapılabilir.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" /> İptal ve İade Koşulları
          </h2>
          <p>• <strong>Ücretsiz İptal:</strong> Giriş tarihine 24 saat kalana kadar yapılan iptallerde hiçbir ücret talep edilmez.</p>
          <p>• <strong>Kapıda Ödeme:</strong> Ön ödeme alınmadığı için iptallerde ceza uygulanmaz, ancak iptal durumunu bildirmeniz rica olunur.</p>
          <p>• <strong>Havale / EFT:</strong> İptal talebiniz onaylandığında tutar 3 iş günü içinde hesabınıza iade edilir.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" /> Genel Kurallar ve Gizlilik
          </h2>
          <p>• T.C. İçişleri Bakanlığı mevzuatı gereği otele girişte tüm misafirlerin geçerli kimlik veya pasaport ibraz etmesi zorunludur.</p>
          <p>• Odalarda tütün ürünleri kullanımı belirlenen balkonlu odalar haricinde yasaktır.</p>
          <p>• Kişisel verileriniz KVKK kapsamında gizlilikle korunmaktadır.</p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Policies;