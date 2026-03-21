"use client";

import { useEffect, useState } from "react";
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

function FlyToUserLocation({
  userLocation,
}: {
  userLocation: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    map.flyTo(userLocation, Math.max(map.getZoom(), 13), {
      duration: 0.8,
    });
  }, [map, userLocation]);

  return null;
}

export function ComparisonMap({
  entries,
  onSelectStore,
  selectedStoreId,
}: ComparisonMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState("");
  const mappedEntries = entries.filter(
    (entry) => entry.store.latitude !== null && entry.store.longitude !== null,
  );

  function locateUser() {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setLocationError("");
      },
      () => {
        setLocationError("Could not access your current location.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 300000,
        timeout: 10000,
      },
    );
  }

  if (mappedEntries.length === 0) {
    return <div className="map-empty">No mappable stores for this item yet.</div>;
  }

  return (
    <div className="map-canvas">
      <div className="map-overlay-actions">
        <button className="button button-secondary" onClick={locateUser} type="button">
          Show my location
        </button>
        {locationError ? <span className="field-help">{locationError}</span> : null}
      </div>
      <MapContainer center={TOKYO_CENTER} scrollWheelZoom zoom={12}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds entries={mappedEntries} />
        <FlyToUserLocation userLocation={userLocation} />
        {userLocation ? (
          <CircleMarker
            center={userLocation}
            fillColor="#2d6cdf"
            fillOpacity={0.85}
            pathOptions={{ color: "#19499a" }}
            radius={9}
            stroke
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
              <div className="map-tooltip__content">
                <strong>Your location</strong>
              </div>
            </Tooltip>
          </CircleMarker>
        ) : null}
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
              <Tooltip className="map-tooltip" direction="top" offset={[0, -10]} opacity={1} permanent>
                <div className="map-tooltip__content">
                  <strong>{entry.store.name}</strong>
                  <span>
                    {formatCurrency(entry.latestLog.normalized_price_yen)} /{" "}
                    {entry.item.comparison_basis_amount}
                    {entry.item.comparison_unit}
                  </span>
                </div>
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
