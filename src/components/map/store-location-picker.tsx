"use client";

import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import { InvalidateMapSize } from "@/components/map/invalidate-map-size";

type StoreLocationPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onChange: (value: { latitude: number; longitude: number }) => void;
};

const DEFAULT_CENTER: [number, number] = [35.6895, 139.6917];

const pinIcon = L.divIcon({
  className: "store-pin-icon",
  html: '<span class="store-pin-icon__dot"></span>',
  iconAnchor: [16, 32],
  iconSize: [32, 32],
});

function ClickCapture({
  onChange,
}: {
  onChange: (value: { latitude: number; longitude: number }) => void;
}) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  return null;
}

function SyncMapCenter({ position }: { position: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [map, position]);

  return null;
}

export function StoreLocationPicker({
  latitude,
  longitude,
  onChange,
}: StoreLocationPickerProps) {
  const position =
    latitude !== null && longitude !== null ? ([latitude, longitude] as [number, number]) : null;
  const center = position ?? DEFAULT_CENTER;

  return (
    <div className="map-canvas">
      <MapContainer center={center} scrollWheelZoom zoom={12}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <InvalidateMapSize />
        <ClickCapture onChange={onChange} />
        <SyncMapCenter position={position} />
        {position ? (
          <Marker
            draggable
            eventHandlers={{
              dragend(event) {
                const marker = event.target;
                const nextPosition = marker.getLatLng();
                onChange({
                  latitude: Number(nextPosition.lat.toFixed(6)),
                  longitude: Number(nextPosition.lng.toFixed(6)),
                });
              },
            }}
            icon={pinIcon}
            position={position}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
