import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BRANCH_CONTACTS } from '@/lib/contacts';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-3">
    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    {children}
  </section>
);

export const DistanceSales: React.FC = () => (
  <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
    <Navbar />
    <div className="pt-36 pb-12 bg-slate-950 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
        <h1 className="text-3xl sm:text-5xl font-black text-white">Mesafeli Satış Sözleşmesi</h1>
        <p className="text-sm text-slate-300">Ön Bilgilendirme Formu ve konaklama hizmeti satış şartları</p>
      </div>
    </div>

    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-6 text-sm leading-relaxed text-slate-700">
      <Section title="1. Taraflar">
        <p><strong>Satıcı:</strong> UYUROOM HOTEL (ŞAHASTE ÇİNÇİK) · Vergi Kimlik No: 9810713434</p>
        {BRANCH_CONTACTS.map((b) => (
          <p key={b.key}>
            <strong>{b.name}:</strong> {b.address} · Tel: {b.phoneDisplay} · E-posta: {b.email}
          </p>
        ))}
        <p><strong>Alıcı:</strong> uyuroom.com üzerinden rezervasyon formunu dolduran kişi. Alıcının ad, soyad, telefon ve e-posta bilgileri rezervasyon formundaki bilgilerdir.</p>
      </Section>

      <Section title="2. Sözleşmenin Konusu">
        <p>İşbu sözleşme, Alıcı’nın uyuroom.com üzerinden elektronik ortamda rezervasyonunu yaptığı konaklama hizmetinin satışı ve ifasına ilişkin tarafların hak ve yükümlülüklerini, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ile Mesafeli Sözleşmeler Yönetmeliği hükümleri çerçevesinde düzenler.</p>
      </Section>

      <Section title="3. Hizmetin Nitelikleri ve Fiyat">
        <p>Şube, oda tipi, giriş ve çıkış tarihleri, gece sayısı, misafir sayısı ve toplam bedel; rezervasyon özetinde ve rezervasyon onayında gösterilir. Gösterilen fiyatlar Türk Lirası cinsindendir ve vergiler dahildir. Seçilen tarihler için özel fiyat tanımlıysa (ör. yılbaşı) rezervasyon özetindeki gecelik fiyat o tarihe göredir.</p>
        <p>Giriş saati en erken 14:00, çıkış saati en geç 12:00’dir.</p>
      </Section>

      <Section title="4. Ödeme">
        <p><strong>Kapıda ödeme:</strong> Bedel, otele girişte resepsiyonda nakit veya POS ile ödenir; ön ödeme alınmaz.</p>
        <p><strong>Havale / EFT:</strong> Bedel, rezervasyon sırasında gösterilen şube banka hesabına, rezervasyon kodu (PNR) açıklamada yer alacak şekilde yatırılır. Havale ile ödemelerde toplam tutar üzerinden %5 indirim uygulanır.</p>
        <p>Ödeme bilgileri ve toplam bedel, rezervasyonu tamamlamadan önce Alıcı’ya gösterilir.</p>
      </Section>

      <Section title="5. Cayma Hakkı">
        <p>Sözleşme konusu hizmet, belirli bir tarihte veya dönemde yapılması gereken konaklama hizmetidir. Mesafeli Sözleşmeler Yönetmeliği’nin cayma hakkı istisnaları kapsamında bu tür sözleşmelerde cayma hakkı kullanılamaz. Bununla birlikte Satıcı, aşağıdaki iptal koşullarını Alıcı lehine uygular.</p>
      </Section>

      <Section title="6. İptal ve İade">
        <p>Giriş tarihine 24 saatten fazla kala yapılan iptallerde ücret alınmaz; havale ile ödenmiş tutarın tamamı iptalin onayından sonra 3 iş günü içinde iade edilir.</p>
        <p>Giriş tarihine 24 saatten az kala yapılan iptallerde veya otele gelinmediğinde ilk gecenin bedeli alınır, kalan tutar varsa iade edilir.</p>
        <p>Ayrıntılar için <a href="/policies" className="underline text-amber-700">İptal ve Konaklama Koşulları</a> sayfasına bakınız.</p>
      </Section>

      <Section title="7. Satıcının Yükümlülükleri">
        <p>Satıcı, onaylanan rezervasyondaki oda tipini ve tarihleri Alıcı’ya sunmakla yükümlüdür. Mücbir sebep veya otelin kontrolü dışındaki bir nedenle odanın sunulamaması halinde Satıcı eşdeğer bir oda önerir; Alıcı kabul etmezse ödenen tutar iade edilir.</p>
      </Section>

      <Section title="8. Alıcının Yükümlülükleri">
        <p>Alıcı, rezervasyon sırasında doğru ve eksiksiz bilgi vermeyi, otele girişte geçerli kimlik veya pasaport ibraz etmeyi ve otelin konaklama kurallarına uymayı kabul eder.</p>
      </Section>

      <Section title="9. Kişisel Veriler">
        <p>Alıcı’nın kişisel verileri, <a href="/kvkk" className="underline text-amber-700">KVKK Aydınlatma Metni</a> kapsamında yalnızca rezervasyonun yürütülmesi ve yasal yükümlülükler için işlenir.</p>
      </Section>

      <Section title="10. Uyuşmazlıkların Çözümü">
        <p>İşbu sözleşmeden doğan uyuşmazlıklarda, parasal sınırlar dahilinde Alıcı’nın veya Satıcı’nın yerleşim yerindeki Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir.</p>
      </Section>

      <Section title="11. Yürürlük">
        <p>Alıcı, rezervasyon formunu onayladığında bu sözleşmenin ve Ön Bilgilendirme Formu’nun tüm maddelerini okuyup kabul etmiş sayılır. Sözleşme, rezervasyon onayı ile yürürlüğe girer. Rezervasyon kodu (PNR) ile sözleşmeye konu rezervasyon bilgilerine ulaşılabilir.</p>
      </Section>
    </div>
    <Footer />
  </div>
);

export default DistanceSales;
