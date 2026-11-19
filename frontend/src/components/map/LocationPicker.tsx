import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { HP_CENTER, HP_ZOOM } from "../../utils/constants";
import { createPinIcon } from "./markerIcon";

const pinIcon = createPinIcon();

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), 12), { animate: true });
  }, [center[0], center[1], map]);
  return null;
}

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (event) => onPick(event.latlng.lat, event.latlng.lng),
  });
  return null;
}

export function LocationPicker({
  value,
  onChange,
  className = "h-64 w-full",
}: {
  value: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}) {
  const center: [number, number] = value ? [value.lat, value.lng] : HP_CENTER;
  return (
    <div className={className}>
      <MapContainer
        center={center as LatLngExpression}
        zoom={value ? 13 : HP_ZOOM}
        zoomControl={false}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={center} />
        <ClickHandler onPick={onChange} />
        <ZoomControl position="bottomright" />
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const position = event.target.getLatLng();
                onChange(position.lat, position.lng);
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
