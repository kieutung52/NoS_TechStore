/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  popupContent?: string;
}

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
}

export const MapComponent = ({
  center = [20.9628333, 105.7483611], 
  zoom = 13,
  markers = [],
  className = "h-96 w-full rounded-lg"
}: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    
    const map = L.map(mapRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    
    markers.forEach(marker => {
      const leafletMarker = L.marker([marker.lat, marker.lng]).addTo(map);
      
      if (marker.popupContent) {
        leafletMarker.bindPopup(marker.popupContent);
      } else {
        leafletMarker.bindPopup(`<b>${marker.label}</b>`);
      }
    });

    
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [center, zoom, markers]);

  return <div ref={mapRef} className={className} />;
};
