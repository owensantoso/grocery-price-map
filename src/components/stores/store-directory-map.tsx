"use client";

import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import { InvalidateMapSize } from "@/components/map/invalidate-map-size";
import type { StoreRecord } from "@/lib/models";

type StoreDirectoryMapProps = {
  stores: StoreRecord[];
};

const TOKYO_CENTER: [number, number] = [35.6895, 139.6917];

function FitBounds({ stores }: { stores: StoreRecord[] }) {
  const map = useMap();

  useEffect(() => {
    const bounds = stores
      .filter((store) => store.latitude !== null && store.longitude !== null)
      .map((store) => [store.latitude!, store.longitude!]) as [number, number][];

    if (bounds.length === 0) {
      map.setView(TOKYO_CENTER, 11);
      return;
    }

    map.fitBounds(bounds, { padding: [36, 36] });
  }, [map, stores]);

  return null;
}

export function StoreDirectoryMap({ stores }: StoreDirectoryMapProps) {
  const physicalStores = stores.filter(
    (store) => store.latitude !== null && store.longitude !== null,
  );

  if (physicalStores.length === 0) {
    return <div className="map-empty">No physical stores to map yet.</div>;
  }

  return (
    <div className="map-canvas">
      <MapContainer center={TOKYO_CENTER} scrollWheelZoom zoom={12}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <InvalidateMapSize />
        <FitBounds stores={physicalStores} />
        {physicalStores.map((store) => (
          <CircleMarker
            key={store.id}
            center={[store.latitude!, store.longitude!]}
            fillColor="#2d7a51"
            fillOpacity={0.82}
            pathOptions={{ color: "#235f40" }}
            radius={10}
            stroke
          >
            <Popup>
              <strong>{store.name}</strong>
              <br />
              <a href={store.store_url} rel="noreferrer" target="_blank">
                Open store link
              </a>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
