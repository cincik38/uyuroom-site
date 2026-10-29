import React, { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BRANCH_CONTACTS } from '@/lib/contacts';
import { setConsent, getConsent } from '@/lib/analytics';
import { Shield, Cookie } from 'lucide-react';
import { toast } from 'sonner';

const Section: React.FC<{ id?: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section id={id} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-3 scroll-mt-28">
    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    <div className="space-y-2 text-sm text-slate-700 leading-relaxed">{children}</div>
  </section>
);

export const Kvkk: React.FC = () => {
  useEffect(() => {
    document.title = 'KVKK Aydınlatma Metni ve Çerez Politikası | UYUROOM HOTEL';
  }, []);

  const [adana, usak] = BRANCH_CONTACTS;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <div className="pt-28 pb-12 bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">6698 sayılı KVKK</span>
          <h1 className="text-3xl sm:text-5xl font-black text-white">Aydınlatma Metni ve Çerez Politikası</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-6">
        <Section title="1. Veri Sorumlusu">
          <p>
            Kişisel verileriniz, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu
            sıfatıyla <strong>UYUROOM HOTEL (ŞAHASTE ÇİNÇİK)</strong> (Adana ve Uşak şubeleri) tarafından işlenmektedir.
          </p>
          <p>
            <strong>Ticari ünvan:</strong> UYUROOM HOTEL (ŞAHASTE ÇİNÇİK) · <strong>Vergi Kimlik No:</strong> 9810713434
          </p>
          <p>
            <strong>{adana.name}:</strong> {adana.address} · {adana.phoneDisplay} · {adana.email}
          </p>
          <p>
            <strong>{usak.name}:</strong> {usak.address} · {usak.phoneDisplay} · {usak.email}
          </p>
        </Section>

        <Section title="2. İşlenen Kişisel Veriler">
          <p>• <strong>Kimlik ve iletişim:</strong> ad soyad, telefon numarası, e-posta adresi.</p>
          <p>
            • <strong>Rezervasyon bilgileri:</strong> otel, oda, giriş-çıkış tarihleri, misafir sayısı, tutar, ödeme
            yöntemi, özel istekleriniz ve rezervasyon kodu.
          </p>
          <p>
            • <strong>Konaklama sırasında:</strong> mevzuat gereği otelde giriş sırasında kimlik veya pasaport bilgileri
            (internet sitesi üzerinden alınmaz).
          </p>
          <p>
            • <strong>İşlem güvenliği ve kullanım:</strong> IP adresi, tarayıcı ve cihaz bilgisi, sitede gezinme verileri
            (çerezler aracılığıyla, bkz. Madde 7).
          </p>
          <p>• Kredi/banka kartı bilgileriniz internet sitemiz üzerinden alınmaz ve saklanmaz.</p>
        </Section>

        <Section title="3. İşleme Amaçları">
          <p>• Rezervasyon talebinizin alınması, oluşturulması, yönetilmesi ve size bildirilmesi.</p>
          <p>• Konaklama hizmetinin sunulması, ödeme ve iptal/iade süreçlerinin yürütülmesi.</p>
          <p>• Müşteri iletişimi, talep ve şikâyetlerin yanıtlanması.</p>
          <p>• Yasal yükümlülüklerin yerine getirilmesi (kimlik bildirimi, muhasebe ve vergi mevzuatı).</p>
          <p>• Sitenin güvenliğinin sağlanması, performansının ölçülmesi ve iyileştirilmesi.</p>
          <p>• Onay vermeniz halinde reklam ve pazarlama faaliyetlerinin ölçülmesi.</p>
        </Section>

        <Section title="4. Hukuki Sebepler">
          <p>
            Verileriniz KVKK m.5/2 kapsamında; <strong>sözleşmenin kurulması ve ifası</strong> (rezervasyon),
            <strong> hukuki yükümlülüğün yerine getirilmesi</strong>, <strong>bir hakkın tesisi, kullanılması veya
            korunması</strong> ve <strong>meşru menfaat</strong> (site güvenliği) sebeplerine; analitik ve pazarlama
            çerezleri bakımından ise <strong>açık rızanıza</strong> dayanılarak işlenir.
          </p>
        </Section>

        <Section title="5. Verilerin Aktarılması">
          <p>Verileriniz, yukarıdaki amaçlarla ve KVKK m.8–9 hükümlerine uygun olarak şu alıcı gruplarına aktarılabilir:</p>
          <p>• Yetkili kamu kurum ve kuruluşları (ör. kimlik bildirim sistemi, mali ve idari makamlar).</p>
          <p>
            • Hizmet sağlayıcılarımız: web sitesi ve veri tabanı barındırma, e-posta gönderimi ve bildirim hizmetleri.
            Bu sağlayıcıların sunucuları yurt dışında bulunabilir.
          </p>
          <p>
            • Onay vermeniz halinde analiz ve reklam ölçümü sağlayıcıları (Google, Meta). Bu sağlayıcılar çerezler
            aracılığıyla kendi politikaları çerçevesinde veri işleyebilir.
          </p>
          <p>Verileriniz, pazarlama amacıyla üçüncü kişilere satılmaz.</p>
        </Section>

        <Section title="6. Saklama Süresi ve Haklarınız">
          <p>
            Verileriniz işleme amacının gerektirdiği süre ve ilgili mevzuatta öngörülen saklama süreleri boyunca
            saklanır, sürenin sonunda silinir, yok edilir veya anonim hale getirilir.
          </p>
          <p>KVKK m.11 uyarınca şu haklara sahipsiniz:</p>
          <p>• Verilerinizin işlenip işlenmediğini öğrenme ve bilgi talep etme,</p>
          <p>• İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</p>
          <p>• Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</p>
          <p>• Eksik veya yanlış işlenmişse düzeltilmesini isteme,</p>
          <p>• Şartları oluşmuşsa silinmesini veya yok edilmesini isteme ve bunun aktarılan kişilere bildirilmesini isteme,</p>
          <p>• Otomatik sistemlerle analiz sonucu aleyhinize bir sonuç doğmasına itiraz etme,</p>
          <p>• Kanuna aykırı işlenmesi nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme.</p>
          <p>
            Başvurularınızı <strong>{adana.email}</strong> veya <strong>{usak.email}</strong> adresine e-posta ile ya da
            şube adreslerimize yazılı olarak iletebilirsiniz. Başvurular en geç 30 gün içinde sonuçlandırılır.
          </p>
        </Section>

        <Section id="cerezler" title="7. Çerez Politikası">
          <p>
            Sitemizde, siteyi çalıştırmak, kullanımı ölçmek ve reklam performansını değerlendirmek için çerezler ve
            benzeri teknolojiler kullanılır.
          </p>
          <p>• <strong>Zorunlu çerezler/depolama:</strong> sitenin ve yönetim girişinin çalışması ve tercihinizin hatırlanması için gereklidir.</p>
          <p>• <strong>Analitik (Google Analytics):</strong> hangi sayfaların ziyaret edildiğini anonim olarak ölçer. Yalnızca onayınızla çerez kullanır.</p>
          <p>• <strong>Pazarlama (Google Ads, Meta Pixel):</strong> reklamlardan gelen rezervasyonları ölçer. Yalnızca onayınızla çalışır.</p>
          <p>
            Çerez bandında "Reddet" seçtiğinizde analitik ve pazarlama çerezleri kullanılmaz. Tercihinizi aşağıdan
            istediğiniz zaman değiştirebilir, ayrıca tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setConsent('granted');
                toast.success('Tercihiniz kaydedildi: çerezler kabul edildi.');
              }}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1.5"
            >
              <Cookie className="w-3.5 h-3.5" /> Çerezleri kabul et
            </button>
            <button
              type="button"
              onClick={() => {
                setConsent('denied');
                toast.success('Tercihiniz kaydedildi: analitik ve pazarlama çerezleri kapalı.');
              }}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" /> Çerezleri reddet
            </button>
            <span className="text-xs text-slate-500 self-center">
              Mevcut tercih: {getConsent() === 'granted' ? 'Kabul' : getConsent() === 'denied' ? 'Reddedildi' : 'Henüz seçilmedi'}
            </span>
          </div>
        </Section>

        <p className="text-xs text-slate-400 text-center">Son güncelleme: Ekim 2026</p>
      </div>

      <Footer />
    </div>
  );
};

export default Kvkk;
