import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Maximize2, Bed, Check, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Room, Hotel } from '@/lib/types';
import { resolveRoomCoverUrl, handleImageError } from '@/lib/media';

interface RoomCardProps {
  room: Room;
  hotel?: Hotel;
  /** Rezervasyon linkine taşınacak ek arama parametreleri (tarih, yetişkin, çocuk) */
  bookingQuery?: string;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, hotel, bookingQuery }) => {
  const amenitiesList = room.amenities
    ? room.amenities.split(',').map((a) => a.trim()).filter(Boolean).slice(0, 4)
    : [];
  const detailPath = `/room/${room.id}`;

  const imageUrl = resolveRoomCoverUrl(
    room.images?.split(',') || [],
    hotel?.image_url,
  );

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
      {/* Image & Badges */}
      <Link to={detailPath} className="relative block aspect-[16/10] overflow-hidden bg-slate-100 cursor-pointer" aria-label={`${room.name} detaylarını gör`}>
        <img
          src={imageUrl}
          onError={handleImageError}
          alt={room.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

        {/* Hotel Branch Badge */}
        {hotel && (
          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30">
            {hotel.city} Şubesi
          </div>
        )}

        {/* Room Type Badge */}
        <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-1 rounded-lg shadow">
          {room.room_type || 'Deluxe'}
        </div>

        {/* Capacity & Size in Image Footer */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
          <span className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-md">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            Maks. {room.capacity} Misafir
          </span>
          {room.size_sqm && (
            <span className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-md">
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              {room.size_sqm} m²
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link to={detailPath}>
                <h3 className="font-bold text-lg text-slate-900 group-hover:text-amber-600 transition-colors">
                  {room.name}
                </h3>
              </Link>
              {hotel && (
                <p className="text-xs text-slate-500 mt-0.5">{hotel.name}</p>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
            {room.description || ''}
          </p>

          {/* Bed info */}
          {room.bed_type && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-3 font-medium">
              <Bed className="w-4 h-4 text-slate-400" />
              <span>{room.bed_type}</span>
            </div>
          )}

          {/* Amenities pill */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {amenitiesList.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700"
              >
                <Check className="w-3 h-3 text-emerald-600" /> {item}
              </span>
            ))}
          </div>
        </div>

        {/* Price & Action */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Gecelik Fiyat</span>
            <div className="flex items-baseline gap-1.5">
              {room.discounted_price && room.discounted_price < room.price_per_night ? (
                <>
                  <span className="text-lg sm:text-xl font-black text-amber-600">
                    ₺{room.discounted_price.toLocaleString('tr-TR')}
                  </span>
                  <span className="text-xs text-slate-400 line-through">
                    ₺{room.price_per_night.toLocaleString('tr-TR')}
                  </span>
                </>
              ) : (
                <span className="text-lg sm:text-xl font-black text-slate-900">
                  ₺{room.price_per_night.toLocaleString('tr-TR')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to={detailPath}>
              <Button variant="outline" size="sm" className="text-xs font-semibold !bg-transparent">
                Detaylar
              </Button>
            </Link>
            
            <Link
              to={`/booking?room_id=${room.id}&hotel_id=${room.hotel_id}${
                bookingQuery ? `&${bookingQuery}` : ''
              }`}
            >
              <Button
                size="sm"
                className="bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold text-xs"
              >
                Rezervasyon
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};