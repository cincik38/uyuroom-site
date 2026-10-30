import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { client } from '@/lib/api';
import { Hotel, Room, Booking, Inquiry } from '@/lib/types';
import { handleImageError, resolveRoomCoverUrl, resolveImageUrl } from '@/lib/media';
import { 
  Building2, 
  BedDouble, 
  CalendarCheck, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowLeft,
  DollarSign,
  Users,
  Navigation,
  Image as ImageIcon
} from 'lucide-react';
import { buildBranchMapLink, resolveBranchAddress } from '@/lib/contacts';
import { BrandLogoMark } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { logoutAdmin, parseList, serializeList, PROPERTY_TYPE_LABELS } from '@/lib/ota';
import MediaUploader from '@/components/MediaUploader';

const hotelInput = 'w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400';
const hotelArea = 'w-full p-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400';

const HotelField: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="block">
    <span className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
  </label>
);

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'rooms' | 'hotels' | 'inquiries'>('bookings');
  
  // Data State
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals / Form State
  const [showHotelModal, setShowHotelModal] = useState(false);
  const emptyHotelForm = {
    name: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    image_url: '',
    features: '',
    property_type: '',
    star_rating: '',
    district: '',
    whatsapp: '',
    map_url: '',
    check_in_time: '14:00',
    check_out_time: '12:00',
    legal_name: '',
    tax_number: '',
    payment_methods: '',
    gallery: '',
    cancellation_policy: '',
    house_rules: '',
  };
  const [hotelForm, setHotelForm] = useState<Record<string, string | number>>(emptyHotelForm);
  const [editingHotelId, setEditingHotelId] = useState<number | null>(null);

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [roomForm, setRoomForm] = useState({
    hotel_id: 1,
    name: '',
    room_type: 'Deluxe Suite',
    description: '',
    price_per_night: 2500,
    discounted_price: 2200,
    capacity: 2,
    bed_type: '1 Çift Kişilik King Yatak',
    size_sqm: 40,
    amenities: 'Klima, Jakuzi, Smart TV, Minibar, Wi-Fi',
    images: '',
    is_featured: true,
  });

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      const [hRes, rRes, bRes, iRes] = await Promise.all([
        client.entities.hotels.query({ limit: 50 }),
        client.entities.rooms.query({ limit: 100 }),
        client.entities.bookings.query({ limit: 100, sort: '-id' }),
        client.entities.inquiries.query({ limit: 50, sort: '-id' }),
      ]);

      if (hRes?.data?.items) setHotels(hRes.data.items);
      if (rRes?.data?.items) setRooms(rRes.data.items);
      if (bRes?.data?.items) setBookings(bRes.data.items);
      if (iRes?.data?.items) setInquiries(iRes.data.items);
    } catch (err) {
      console.error('Admin data error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Booking status update
  const handleUpdateBookingStatus = async (bookingId: number, status: string, paymentStatus?: string) => {
    try {
      await client.entities.bookings.update({
        id: bookingId.toString(),
        data: {
          booking_status: status,
          ...(paymentStatus ? { payment_status: paymentStatus } : {}),
        },
      });
      toast.success('Rezervasyon durumu güncellendi');
      loadAllAdminData();
    } catch (err: any) {
      toast.error('Güncelleme başarısız');
    }
  };

  // Hotel creation
  const handleSaveHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...hotelForm,
        star_rating: hotelForm.star_rating ? Number(hotelForm.star_rating) : null,
        status: 'active',
      };
      if (editingHotelId) {
        await client.entities.hotels.update({
          id: String(editingHotelId),
          data: payload,
        });
        toast.success('Tesis bilgileri güncellendi');
      } else {
        await client.entities.hotels.create({ data: payload });
        toast.success('Yeni şube başarıyla eklendi');
      }
      setShowHotelModal(false);
      setEditingHotelId(null);
      setHotelForm(emptyHotelForm);
      loadAllAdminData();
    } catch (err: any) {
      toast.error('Tesis kaydedilemedi');
    }
  };

  // Room save / edit
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoomId) {
        await client.entities.rooms.update({
          id: editingRoomId.toString(),
          data: {
            ...roomForm,
            status: 'active',
          },
        });
        toast.success('Oda başarıyla güncellendi');
      } else {
        await client.entities.rooms.create({
          data: {
            ...roomForm,
            status: 'active',
          },
        });
        toast.success('Yeni oda başarıyla eklendi');
      }
      setShowRoomModal(false);
      setEditingRoomId(null);
      loadAllAdminData();
    } catch (err: any) {
      toast.error('Oda kaydedilemedi');
    }
  };

  // Delete Room
  const handleDeleteRoom = async (id: number) => {
    if (!confirm('Bu odayı silmek istediğinize emin misiniz?')) return;
    try {
      await client.entities.rooms.delete({ id: id.toString() });
      toast.success('Oda silindi');
      loadAllAdminData();
    } catch (err) {
      toast.error('Oda silinemedi');
    }
  };

  // Open Edit Room
  const handleEditRoomClick = (room: Room) => {
    setEditingRoomId(room.id);
    setRoomForm({
      hotel_id: room.hotel_id,
      name: room.name,
      room_type: room.room_type,
      description: room.description || '',
      price_per_night: room.price_per_night,
      discounted_price: room.discounted_price || room.price_per_night,
      capacity: room.capacity,
      bed_type: room.bed_type || '',
      size_sqm: room.size_sqm || 35,
      amenities: room.amenities || '',
      images: room.images || '',
      is_featured: room.is_featured ?? true,
    });
    setShowRoomModal(true);
  };

  // Stats
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
  const confirmedBookingsCount = bookings.filter((b) => b.booking_status === 'confirmed').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      <Navbar />

      {/* Admin Top Banner */}
      <div className="pt-36 pb-8 bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <BrandLogoMark size={54} className="hidden sm:block shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                  Yönetim Portalı
                </span>
                <span className="text-xs text-slate-400">UYUROOM HOTEL Otel Yönetimi</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Otel ve Rezervasyon Kontrol Merkezi
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/yonetim/takip">
              <Button variant="outline" size="sm" className="border-amber-500/50 text-amber-300 hover:text-amber-200 !bg-transparent text-xs">
                Takip Kodları
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white !bg-transparent text-xs">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Misafir Görünümüne Dön
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:text-white !bg-transparent text-xs"
              onClick={() => logoutAdmin().then(() => { window.location.href = '/yonetim'; })}
            >
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Toplam Rezervasyon</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{bookings.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Toplam Gelir Hacmi</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">₺{totalRevenue.toLocaleString('tr-TR')}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aktif Şube Sayısı</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{hotels.length} Şube</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Toplam Oda Sayısı</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{rooms.length} Oda</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <BedDouble className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'bookings'
                  ? 'bg-slate-900 text-amber-400 shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              Gelen Rezervasyonlar ({bookings.length})
            </button>

            <button
              onClick={() => setActiveTab('rooms')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'rooms'
                  ? 'bg-slate-900 text-amber-400 shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BedDouble className="w-4 h-4" />
              Oda Yönetimi ({rooms.length})
            </button>

            <button
              onClick={() => setActiveTab('hotels')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'hotels'
                  ? 'bg-slate-900 text-amber-400 shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Şube Yönetimi ({hotels.length})
            </button>

            <button
              onClick={() => setActiveTab('inquiries')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'inquiries'
                  ? 'bg-slate-900 text-amber-400 shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Gelen Mesajlar ({inquiries.length})
            </button>
          </div>

          <div>
            {activeTab === 'rooms' && (
              <Button
                onClick={() => {
                  setEditingRoomId(null);
                  setRoomForm({
                    hotel_id: hotels[0]?.id || 1,
                    name: '',
                    room_type: 'Deluxe Suite',
                    description: '',
                    price_per_night: 2500,
                    discounted_price: 2200,
                    capacity: 2,
                    bed_type: '1 Çift Kişilik King Yatak',
                    size_sqm: 40,
                    amenities: 'Klima, Jakuzi, Smart TV, Minibar, Wi-Fi',
                    images: '',
                    is_featured: true,
                  });
                  setShowRoomModal(true);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Yeni Oda Ekle
              </Button>
            )}

            {activeTab === 'hotels' && (
              <Button
                onClick={() => setShowHotelModal(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Yeni Otel Şubesi Ekle
              </Button>
            )}
          </div>
        </div>

        {/* Tab 1: Bookings List */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Gelen Rezervasyon Kayıtları</h3>
              <span className="text-xs text-slate-500">Kapıda Ödeme, Havale ve Online Kart Rezervasyonları</span>
            </div>

            {bookings.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                Henüz kayıtlı rezervasyon bulunmuyor.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-800 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">PNR / Tarih</th>
                      <th className="p-3.5">Misafir</th>
                      <th className="p-3.5">Şube & Oda</th>
                      <th className="p-3.5">Konaklama</th>
                      <th className="p-3.5">Tutar & Ödeme</th>
                      <th className="p-3.5">Ödeme Durumu</th>
                      <th className="p-3.5">Rezervasyon Durumu</th>
                      <th className="p-3.5 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((b) => {
                      const h = hotels.find((x) => x.id === b.hotel_id);
                      const r = rooms.find((x) => x.id === b.room_id);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5">
                            <span className="font-mono font-black text-amber-600 block text-sm">{b.booking_code}</span>
                            <span className="text-[10px] text-slate-400">{b.created_at?.slice(0, 10) || 'Bugün'}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 block">{b.guest_name}</span>
                            <span className="text-[11px] text-slate-500">{b.guest_phone}</span>
                            <span className="text-[10px] text-slate-400 block">{b.guest_email}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold text-slate-800 block">{h?.name || 'Şube'}</span>
                            <span className="text-[11px] text-slate-500">{r?.name || 'Oda'}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="block font-medium">{b.check_in_date} / {b.check_out_date}</span>
                            <span className="text-[11px] text-slate-400">
                              {b.night_count} Gece • {b.adult_count ?? b.guest_count} Yetişkin
                              {(b.child_count ?? 0) > 0 ? `, ${b.child_count} Çocuk` : ''}
                              {' '}(Toplam {b.guest_count} Kişi)
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-black text-slate-900 text-sm block">₺{b.total_price?.toLocaleString('tr-TR')}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-500">
                              {b.payment_method === 'pay_at_hotel' && 'Kapıda Ödeme'}
                              {b.payment_method === 'bank_transfer' && 'Havale / EFT'}
                              {b.payment_method === 'credit_card' && 'Online Kart'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.payment_status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.payment_status === 'awaiting_transfer'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {b.payment_status === 'completed' ? 'Ödendi' : b.payment_status === 'awaiting_transfer' ? 'Havale Bekleniyor' : 'Ödeme Bekleniyor'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.booking_status === 'confirmed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.booking_status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {b.booking_status === 'confirmed' ? 'Onaylandı' : b.booking_status === 'cancelled' ? 'İptal Edildi' : b.booking_status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1">
                            {b.payment_status !== 'completed' && (
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id!, b.booking_status, 'completed')}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold"
                                title="Ödendi olarak işaretle"
                              >
                                Ödendi Yap
                              </button>
                            )}
                            {b.booking_status !== 'cancelled' ? (
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id!, 'cancelled')}
                                className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-bold"
                                title="İptal Et"
                              >
                                İptal Et
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id!, 'confirmed')}
                                className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold"
                              >
                                Tekrar Onayla
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Rooms Management */}
        {activeTab === 'rooms' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Oda Kataloğu & Fiyat Düzenleme</h3>
                <p className="text-xs text-slate-500">Şubelere bağlı odaları listeleyin, yeni oda ekleyin veya güncelleyin.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {rooms.map((room) => {
                const h = hotels.find((x) => x.id === room.hotel_id);
                return (
                  <div key={room.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex flex-col justify-between">
                    <div>
                      <div className="aspect-[16/9] relative bg-slate-900">
                        <img
                          src={resolveRoomCoverUrl(room.images?.split(','), h?.image_url)}
                          onError={handleImageError}
                          alt={room.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-slate-900/80 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold">
                          {h?.city} - {h?.name}
                        </div>
                        <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-bold">
                          {room.room_type}
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <h4 className="font-bold text-slate-900 text-sm">{room.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{room.description}</p>
                        
                        <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                          <span className="text-slate-500">Gecelik:</span>
                          <span className="font-black text-amber-600 text-sm">₺{room.discounted_price || room.price_per_night}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Kapasite:</span>
                          <span className="font-bold text-slate-700">{room.capacity} Misafir</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditRoomClick(room)}
                        className="text-xs !bg-transparent"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Düzenle
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteRoom(room.id)}
                        className="text-xs text-red-600 border-red-200 hover:bg-red-50 !bg-transparent"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Hotels / Branches Management */}
        {activeTab === 'hotels' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Otel şubeleri</h3>
                <p className="text-xs text-slate-500">Şube bilgilerini buradan düzenleyebilir, yeni şube ekleyebilirsiniz.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {hotels.map((h) => (
                <div key={h.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={resolveImageUrl(h.image_url)}
                      onError={handleImageError}
                      alt={h.name}
                      className="w-24 h-20 rounded-xl object-cover"
                    />
                    <div>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                        {h.city} Şubesi
                      </span>
                      <h4 className="font-bold text-base text-slate-900 mt-1">{h.name}</h4>
                      <p className="text-xs text-slate-500">{h.phone || 'Telefon eklenmemiş'}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">{h.description}</p>
                  <p className="text-xs text-slate-500"><strong>Adres:</strong> {resolveBranchAddress(h.city, h.address)}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      type="button"
                      onClick={() => {
                        window.location.href = `/yonetim/tesis/${h.id}`;
                      }}
                      className="bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold text-xs min-h-[40px]"
                    >
                      Tesis yönetim merkezi
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingHotelId(Number(h.id));
                        setHotelForm({
                          ...emptyHotelForm,
                          ...Object.fromEntries(
                            Object.keys(emptyHotelForm).map((k) => [
                              k,
                              (h as unknown as Record<string, string | number>)[k] ??
                                (emptyHotelForm as Record<string, string | number>)[k],
                            ]),
                          ),
                        });
                        setShowHotelModal(true);
                      }}
                      className="font-bold text-xs min-h-[40px] !bg-transparent"
                    >
                      Bilgileri düzenle
                    </Button>
                    <a
                      href={buildBranchMapLink(h.city, h.address, h.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-md text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Konuma git
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Inquiries */}
        {activeTab === 'inquiries' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">İletişim & Destek Talepleri</h3>
            </div>

            {inquiries.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                Henüz gelen bir mesaj bulunmuyor.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {inquiries.map((iq) => (
                  <div key={iq.id} className="p-5 hover:bg-slate-50 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-sm">{iq.name} ({iq.email})</span>
                      <span className="text-slate-400">{iq.created_at?.slice(0, 10) || 'Yeni'}</span>
                    </div>
                    <p className="text-amber-600 font-semibold">{iq.subject}</p>
                    <p className="text-slate-600 bg-slate-100 p-3 rounded-xl">{iq.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hotel Create / Edit Modal */}
      {showHotelModal && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 sm:px-8 py-5 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">
                {editingHotelId ? 'Tesis Bilgilerini Düzenle' : 'Yeni Otel Şubesi Ekle'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Yıldızlı (*) alanlar zorunludur. Boş bıraktığınız alanlar sitede gösterilmez.
              </p>
            </div>

            <form onSubmit={handleSaveHotel} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-8 text-sm">
                {/* Temel bilgiler */}
                <fieldset className="space-y-4">
                  <legend className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 w-full">Temel bilgiler</legend>
                  <HotelField label="Şube adı *">
                    <input type="text" required value={hotelForm.name as string} onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })} placeholder="UYUROOM Hotel Uşak" className={hotelInput} />
                  </HotelField>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <HotelField label="Şehir *">
                      <input type="text" required value={hotelForm.city as string} onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value })} placeholder="Uşak" className={hotelInput} />
                    </HotelField>
                    <HotelField label="İlçe">
                      <input type="text" value={hotelForm.district as string} onChange={(e) => setHotelForm({ ...hotelForm, district: e.target.value })} placeholder="Merkez" className={hotelInput} />
                    </HotelField>
                    <HotelField label="Tesis tipi">
                      <select value={hotelForm.property_type as string} onChange={(e) => setHotelForm({ ...hotelForm, property_type: e.target.value })} className={hotelInput}>
                        <option value="">Seçin</option>
                        {Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </HotelField>
                  </div>
                  <HotelField label="Tanıtım metni" hint="Tesis sayfasında ve arama sonuçlarında görünür. 2-3 cümle yeterli.">
                    <textarea rows={3} value={hotelForm.description as string} onChange={(e) => setHotelForm({ ...hotelForm, description: e.target.value })} placeholder="Şehir merkezinde temiz ve konforlu odalar sunan otelimiz..." className={hotelArea} />
                  </HotelField>
                  <HotelField label="Öne çıkan olanaklar" hint="Virgülle ayırın. Örnek: Ücretsiz Wi-Fi, Klima, Kahvaltı Dahil, Ücretsiz Otopark">
                    <input type="text" value={hotelForm.features as string} onChange={(e) => setHotelForm({ ...hotelForm, features: e.target.value })} placeholder="Ücretsiz Wi-Fi, Klima, 7/24 Resepsiyon" className={hotelInput} />
                  </HotelField>
                </fieldset>

                {/* İletişim ve konum */}
                <fieldset className="space-y-4">
                  <legend className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 w-full">İletişim ve konum</legend>
                  <HotelField label="Açık adres">
                    <input type="text" value={hotelForm.address as string} onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })} placeholder="Mahalle, sokak, no, ilçe / il" className={hotelInput} />
                  </HotelField>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <HotelField label="Telefon">
                      <input type="tel" value={hotelForm.phone as string} onChange={(e) => setHotelForm({ ...hotelForm, phone: e.target.value })} placeholder="0553 122 22 79" className={hotelInput} />
                    </HotelField>
                    <HotelField label="WhatsApp numarası" hint="Başında 90 ile, boşluksuz">
                      <input type="tel" value={hotelForm.whatsapp as string} onChange={(e) => setHotelForm({ ...hotelForm, whatsapp: e.target.value })} placeholder="905531222279" className={hotelInput} />
                    </HotelField>
                    <HotelField label="E-posta">
                      <input type="email" value={hotelForm.email as string} onChange={(e) => setHotelForm({ ...hotelForm, email: e.target.value })} placeholder="ornek@uyuroom.com" className={hotelInput} />
                    </HotelField>
                    <HotelField label="Google Haritalar bağlantısı">
                      <input type="url" value={hotelForm.map_url as string} onChange={(e) => setHotelForm({ ...hotelForm, map_url: e.target.value })} placeholder="https://maps.app.goo.gl/..." className={hotelInput} />
                    </HotelField>
                  </div>
                </fieldset>

                {/* Fotoğraflar */}
                <fieldset className="space-y-3">
                  <legend className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 w-full">Fotoğraflar</legend>
                  <p className="text-xs text-slate-500">
                    Bilgisayarınızdan yükleyin. İlk sıradaki fotoğraf kapak görseli olur; sıralamayı ok butonlarıyla değiştirebilirsiniz.
                  </p>
                  <MediaUploader
                    label="Tesis fotoğrafları"
                    prefix={`hotel-${editingHotelId ?? 'new'}/gallery`}
                    value={parseList(hotelForm.gallery as string)}
                    onChange={(list: string[]) =>
                      setHotelForm({ ...hotelForm, gallery: serializeList(list), image_url: list[0] || '' })
                    }
                  />
                </fieldset>

                {/* Konaklama kuralları */}
                <fieldset className="space-y-4">
                  <legend className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 w-full">Konaklama kuralları</legend>
                  <div className="grid grid-cols-2 gap-4">
                    <HotelField label="Giriş saati">
                      <input type="time" value={hotelForm.check_in_time as string} onChange={(e) => setHotelForm({ ...hotelForm, check_in_time: e.target.value })} className={hotelInput} />
                    </HotelField>
                    <HotelField label="Çıkış saati">
                      <input type="time" value={hotelForm.check_out_time as string} onChange={(e) => setHotelForm({ ...hotelForm, check_out_time: e.target.value })} className={hotelInput} />
                    </HotelField>
                  </div>
                  <HotelField label="İptal politikası">
                    <textarea rows={3} value={hotelForm.cancellation_policy as string} onChange={(e) => setHotelForm({ ...hotelForm, cancellation_policy: e.target.value })} placeholder="Örn: Girişten 24 saat öncesine kadar ücretsiz iptal." className={hotelArea} />
                  </HotelField>
                  <HotelField label="Tesis kuralları">
                    <textarea rows={3} value={hotelForm.house_rules as string} onChange={(e) => setHotelForm({ ...hotelForm, house_rules: e.target.value })} placeholder="Örn: Odalarda sigara içilmez." className={hotelArea} />
                  </HotelField>
                  <HotelField label="Ödeme yöntemleri" hint="Virgülle ayırın.">
                    <input type="text" value={hotelForm.payment_methods as string} onChange={(e) => setHotelForm({ ...hotelForm, payment_methods: e.target.value })} placeholder="Otelde ödeme, Havale / EFT" className={hotelInput} />
                  </HotelField>
                  <p className="text-xs text-slate-500">
                    Banka hesapları (IBAN) için <strong>Tesis Yönetim Merkezi → Ayarlar & Kullanıcı</strong> bölümünü kullanın.
                  </p>
                </fieldset>

                {/* Yasal bilgiler */}
                <fieldset className="space-y-4">
                  <legend className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 w-full">Yasal bilgiler</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <HotelField label="Ticari ünvan">
                      <input type="text" value={hotelForm.legal_name as string} onChange={(e) => setHotelForm({ ...hotelForm, legal_name: e.target.value })} placeholder="Şirket veya işletme ünvanı" className={hotelInput} />
                    </HotelField>
                    <HotelField label="Vergi kimlik no">
                      <input type="text" inputMode="numeric" value={hotelForm.tax_number as string} onChange={(e) => setHotelForm({ ...hotelForm, tax_number: e.target.value })} placeholder="10 haneli vergi no" className={hotelInput} />
                    </HotelField>
                  </div>
                </fieldset>
              </div>

              <div className="px-5 sm:px-8 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowHotelModal(false);
                    setEditingHotelId(null);
                    setHotelForm(emptyHotelForm);
                  }}
                >
                  Vazgeç
                </Button>
                <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                  {editingHotelId ? 'Değişiklikleri kaydet' : 'Şubeyi ekle'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900">
              {editingRoomId ? 'Odayı Düzenle' : 'Yeni Oda Ekle'}
            </h3>
            <form onSubmit={handleSaveRoom} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block text-slate-700">Bağlı Olduğu Şube *</label>
                <select
                  value={roomForm.hotel_id}
                  onChange={(e) => setRoomForm({ ...roomForm, hotel_id: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1"
                >
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block text-slate-700">Oda Başlığı / Adı *</label>
                <input
                  type="text"
                  required
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  placeholder="Örn: Deluxe Jakuzili King Oda"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block text-slate-700">Gecelik Fiyat (TL) *</label>
                  <input
                    type="number"
                    required
                    value={roomForm.price_per_night}
                    onChange={(e) => setRoomForm({ ...roomForm, price_per_night: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold block text-slate-700">İndirimli Fiyat (TL)</label>
                  <input
                    type="number"
                    value={roomForm.discounted_price}
                    onChange={(e) => setRoomForm({ ...roomForm, discounted_price: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block text-slate-700">Maks. Misafir Kapasitesi</label>
                  <input
                    type="number"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold block text-slate-700">Oda Büyüklüğü (m²)</label>
                  <input
                    type="number"
                    value={roomForm.size_sqm}
                    onChange={(e) => setRoomForm({ ...roomForm, size_sqm: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block text-slate-700">Görsel URLleri (Virgülle ayrılmış)</label>
                <input
                  type="text"
                  value={roomForm.images}
                  onChange={(e) => setRoomForm({ ...roomForm, images: e.target.value })}
                  placeholder="https://... , https://..."
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1"
                />
              </div>

              <div>
                <label className="font-bold block text-slate-700">Oda Olanakları (Virgülle)</label>
                <input
                  type="text"
                  value={roomForm.amenities}
                  onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
                  placeholder="Jakuzi, Balkon, Smart TV, Minibar, Wi-Fi"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 mt-1"
                />
              </div>

              <div>
                <label className="font-bold block text-slate-700">Açıklama</label>
                <textarea
                  rows={2}
                  value={roomForm.description}
                  onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                  placeholder="Oda konforu ve özellikleri"
                  className="w-full p-2.5 rounded-xl border border-slate-200 mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setShowRoomModal(false)}>
                  İptal
                </Button>
                <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                  Kaydet
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminDashboard;