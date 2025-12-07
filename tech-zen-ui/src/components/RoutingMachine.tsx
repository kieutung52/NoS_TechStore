import { useEffect } from "react";
import L from "leaflet";
import "leaflet-routing-machine";
import { useMap } from "react-leaflet";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RoutingMachineProps {
  start: L.LatLngTuple;
  end: L.LatLngTuple;
  shipper?: L.LatLngTuple;
}

const RoutingMachine = ({ start, end, shipper }: RoutingMachineProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const waypoints = [
      L.latLng(start[0], start[1]),
    ];

    if (shipper) {
      waypoints.push(L.latLng(shipper[0], shipper[1]));
    }

    waypoints.push(L.latLng(end[0], end[1]));

    const routingControl = L.Routing.control({
      waypoints: waypoints,
      addWaypoints: false, 
      show: false, 
      draggableWaypoints: false,
      
      lineOptions: {
        styles: [
          { color: 'hsl(var(--primary))', opacity: 0.8, weight: 6 }
        ],
        extendToWaypoints: undefined, 
        missingRouteTolerance: undefined 
      },

      createMarker: () => { return null; }
      
    } as unknown).addTo(map);

    return () => {
      map.removeControl(routingControl);
    };
  }, [map, start, end, shipper]);

  return null;
};

export default RoutingMachine;