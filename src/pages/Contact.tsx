import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { client } from '@/lib/api';
import { Hotel } from '@/lib/types';
import { MapPin, Phone, Mail, Send, MessageCircle, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BRANCH_CONTACTS, buildWhatsAppLink, buildMapLink } from '@/lib/contacts';

export const Contact: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await client.entities.hotels.query({ query: { status: 'active' } });
        if (res?.data?.items) {
          setHotels(res.data.items);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchHotels();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await client.entities.inquiries.create({
        data: {
          hotel_id: selectedHotelId ? Number(selectedHotelId) : undefined,
          name,
          email,
          phone,
          subject: subject || 'Genel İletişim Formu',
          message,
          status: 'unread',
        },
      });

      toast.success('Mesajınız başarıyla iletildi. En kısa sürede dönüş yapacağız.');
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error(err);
      toast.error('Mesaj gönderilemedi, lütfen daha sonra tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <div className="pt-36 pb-12 bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Bize Ulaşın</span>
          <h1 className="text-3xl sm:text-5xl font-black text-white">İletişim & Konumlar</h1>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            Sorularınız, kurumsal rezervasyon talepleriniz veya önerileriniz için 7/24 hizmetinizdeyiz.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Branch Contact Details */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Şube İletişim Bilgileri</h2>

            {BRANCH_CONTACTS.map((branch) => (
              <div key={branch.key} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <h3 className="font-bold text-base text-slate-900">{branch.name}</h3>
                </div>

                {/* Belirgin Telefon Numarası */}
                <a
                  href={`tel:${branch.phoneRaw}`}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950 hover:bg-slate-900 transition-colors group"
                >
                  <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                      {branch.city} Rezervasyon Hattı
                    </p>
                    <p className="text-xl font-black text-amber-400 tabular-nums group-hover:text-amber-300 transition-colors">
                      {branch.phoneDisplay}
                    </p>
                  </div>
                </a>

                <div className="space-y-2 text-xs text-slate-600">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="font-medium text-slate-700">{branch.address}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                    {branch.email}
                  </p>
                </div>

                <div className="space-y-2">
                  <a
                    href={buildMapLink(branch.address, branch.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-400 font-bold text-sm transition-colors border border-amber-500/40"
                  >
                    <Navigation className="w-4 h-4" />
                    Konuma Git ({branch.city})
                  </a>
                  <a
                    href={buildWhatsAppLink(branch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#1fb855] text-white font-bold text-sm transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {branch.city} Şubesine WhatsApp'tan Yaz
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Mesaj Gönderin</h2>
                <p className="text-xs text-slate-500 mt-1">Formu doldurun, temsilcimiz size en kısa sürede dönüş yapsın.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Ad Soyad *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Adınız Soyadınız"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">E-Posta *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="eposta@adresiniz.com"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Telefon</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">İlgili Şube</label>
                    <select
                      value={selectedHotelId}
                      onChange={(e) => setSelectedHotelId(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Genel Merkez / Tüm Şubeler</option>
                      {hotels.map((h) => (
                        <option key={h.id} value={h.id.toString()}>
                          {h.name} ({h.city})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Konu</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Rezervasyon, Kurumsal Anlaşma, Bilgi Talebi vb."
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mesajınız *</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Mesajınızı detaylı olarak buraya yazabilirsiniz..."
                    className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? 'Gönderiliyor...' : 'Mesajı Gönder'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;