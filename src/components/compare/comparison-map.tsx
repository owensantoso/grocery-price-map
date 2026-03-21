"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { formatCurrency } from "@/lib/format";
import type { CompareEntry } from "@/lib/models";

type ComparisonMapProps = {
  entries: CompareEntry[];
  onSelectStore: (storeId: string) => void;
  selectedStoreId: string | null;
};

const TOKYO_CENTER: [number, number] = [35.6895, 139.6917];

function FitBounds({ entries }: { entries: CompareEntry[] }) {
  const map = useMap();

  useEffect(() => {
    if (entries.length === 0) {
      map.setView(TOKYO_CENTER, 11);
      return;
    }

    const bounds = entries.map((entry) => [entry.store.latitude, entry.store.longitude]) as [
      number,
      number,
    ][];
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [entries, map]);

  return null;
}

export function ComparisonMap({
  entries,
  onSelectStore,
  selectedStoreId,
}: ComparisonMapProps) {
  return (
    <div className="map-canvas">
      <MapContainer center={TOKYO_CENTER} scrollWheelZoom zoom={12}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds entries={entries} />
        {entries.map((entry) => {
          const isSelected = entry.store.id === selectedStoreId;

          return (
            <CircleMarker
              key={entry.store.id}
              center={[entry.store.latitude, entry.store.longitude]}
              eventHandlers={{
                click() {
                  onSelectStore(entry.store.id);
                },
              }}
              fillColor={isSelected ? "#2d7a51" : "#f0a23b"}
              fillOpacity={0.8}
              pathOptions={{
                color: isSelected ? "#235f40" : "#855a13",
              }}
              radius={isSelected ? 12 : 9}
              stroke
            >
              <Popup>
                <strong>{entry.store.name}</strong>
                <br />
                {formatCurrency(entry.latestLog.normalized_price_yen)} per{" "}
                {entry.item.comparison_basis_amount}
                {entry.item.comparison_unit}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
