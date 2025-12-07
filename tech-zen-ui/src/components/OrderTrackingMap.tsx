import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { LatLngExpression, LatLngTuple } from 'leaflet';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import RoutingMachine from './RoutingMachine';

const AutoFitBounds = ({ bounds }: { bounds: L.LatLngBounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);
  return null;
};

const createIcon = (className: string, iconHtml: string) => {
  return L.divIcon({
    html: `<div class="${cn("h-10 w-10 rounded-full flex items-center justify-center text-white shadow-lg", className)}">
             ${iconHtml}
           </div>`,
    className: 'bg-transparent border-0',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

const storeIcon = createIcon('bg-primary', '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><path d="M12 22.08V12"/></svg>');
const userIcon = createIcon('bg-gray-600', '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>');
const shipperIcon = createIcon('bg-green-600', '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>');

interface OrderTrackingMapProps {
  storeCoords: LatLngTuple;
  userCoords: LatLngTuple;
  shipperCoords?: LatLngTuple;
  className?: string;
}

export const OrderTrackingMap = ({
  storeCoords,
  userCoords,
  shipperCoords,
  className
}: OrderTrackingMapProps) => {
  
  const positions: LatLngTuple[] = [storeCoords, userCoords];
  if (shipperCoords) {
    positions.push(shipperCoords);
  }

  const bounds = L.latLngBounds(positions);

  return (
    <MapContainer
      center={storeCoords}
      zoom={13}
      className={cn("h-full w-full rounded-lg z-0", className)}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* SỬA: Xóa <Polyline> và thay bằng component RoutingMachine */}
      <RoutingMachine 
        start={storeCoords}
        end={userCoords}
        shipper={shipperCoords}
      />
      
      {/* Chúng ta vẫn giữ 3 Markers này, 
        vì RoutingMachine đã được cấu hình ẩn marker A/B 
      */}
      
      {/* Marker Cửa hàng */}
      <Marker position={storeCoords} icon={storeIcon}>
        <Popup>Cửa hàng TechStore</Popup>
      </Marker>
      
      {/* Marker Người nhận */}
      <Marker position={userCoords} icon={userIcon}>
        <Popup>Địa chỉ của bạn</Popup>
      </Marker>

      {/* Marker Shipper (nếu có) */}
      {shipperCoords && (
        <Marker position={shipperCoords} icon={shipperIcon}>
          <Popup>Đơn hàng đang ở đây</Popup>
        </Marker>
      )}

      <AutoFitBounds bounds={bounds} />
    </MapContainer>
  );
};