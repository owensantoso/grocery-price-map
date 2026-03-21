"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
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

    const bounds = entries
      .filter((entry) => entry.store.latitude !== null && entry.store.longitude !== null)
      .map((entry) => [entry.store.latitude!, entry.store.longitude!]) as [number, number][];

    if (bounds.length === 0) {
      map.setView(TOKYO_CENTER, 11);
      return;
    }

    map.fitBounds(bounds, { padding: [48, 48] });
  }, [entries, map]);

  return null;
}

export function ComparisonMap({
  entries,
  onSelectStore,
  selectedStoreId,
}: ComparisonMapProps) {
  const mappedEntries = entries.filter(
    (entry) => entry.store.latitude !== null && entry.store.longitude !== null,
  );

  if (mappedEntries.length === 0) {
    return <div className="map-empty">No mappable stores for this item yet.</div>;
  }

  return (
    <div className="map-canvas">
      <MapContainer center={TOKYO_CENTER} scrollWheelZoom zoom={12}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds entries={mappedEntries} />
        {mappedEntries.map((entry) => {
          const isSelected = entry.store.id === selectedStoreId;

          return (
            <CircleMarker
              key={entry.store.id}
              center={[entry.store.latitude!, entry.store.longitude!]}
              eventHandlers={{
                click() {
                  onSelectStore(entry.store.id);
                },
              }}
              fillColor={isSelected ? "#2d7a51" : "#f0a23b"}
              fillOpacity={0.84}
              pathOptions={{
                color: isSelected ? "#235f40" : "#855a13",
              }}
              radius={isSelected ? 14 : 11}
              stroke
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
                {formatCurrency(entry.latestLog.normalized_price_yen)} /{" "}
                {entry.item.comparison_basis_amount}
                {entry.item.comparison_unit}
              </Tooltip>
              <Popup>
                <strong>{entry.store.name}</strong>
                <br />
                {formatCurrency(entry.latestLog.normalized_price_yen)} /{" "}
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
