"use client";

import { useEffect, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useDebugFlag } from "@/components/debug/use-debug-flag";
import { formatCurrency } from "@/lib/format";
import type { CompareEntry } from "@/lib/models";

type ComparisonMapProps = {
  entries: CompareEntry[];
  onSelectStore: (storeId: string) => void;
  selectedStoreId: string | null;
};

const TOKYO_CENTER: [number, number] = [35.6895, 139.6917];

const selectedStorePin = L.divIcon({
  className: "compare-pin-icon compare-pin-icon--selected",
  html: '<span class="compare-pin-icon__dot"></span>',
  iconAnchor: [12, 28],
  iconSize: [24, 28],
});

const storePin = L.divIcon({
  className: "compare-pin-icon",
  html: '<span class="compare-pin-icon__dot"></span>',
  iconAnchor: [12, 28],
  iconSize: [24, 28],
});

function bindMediaQuery(
  mediaQuery: MediaQueryList,
  listener: () => void,
) {
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }

  mediaQuery.addListener(listener);
  return () => mediaQuery.removeListener(listener);
}

function FitBounds({ entries }: { entries: CompareEntry[] }) {
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (hasFittedRef.current) {
      return;
    }

    if (entries.length === 0) {
      map.setView(TOKYO_CENTER, 11);
      hasFittedRef.current = true;
      return;
    }

    const bounds = entries
      .filter((entry) => entry.store.latitude !== null && entry.store.longitude !== null)
      .map((entry) => [entry.store.latitude!, entry.store.longitude!]) as [number, number][];

    if (bounds.length === 0) {
      map.setView(TOKYO_CENTER, 11);
      hasFittedRef.current = true;
      return;
    }

    map.fitBounds(bounds, { padding: [48, 48] });
    hasFittedRef.current = true;
  }, [entries, map]);

  return null;
}

function InvalidateMapSize() {
  const map = useMap();

  useEffect(() => {
    const refresh = () => {
      window.setTimeout(() => {
        try {
          const container = map.getContainer?.();
          const maybeMap = map as typeof map & { _loaded?: boolean };

          if (!maybeMap._loaded || !container || !container.isConnected) {
            return;
          }

          map.invalidateSize();
        } catch {
          // Leaflet can briefly tear down internals during mount/unmount cycles.
        }
      }, 0);
    };

    refresh();
    window.setTimeout(refresh, 250);
    window.addEventListener("resize", refresh);
    window.addEventListener("orientationchange", refresh);

    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("orientationchange", refresh);
    };
  }, [map]);

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
  const debugEnabled = useDebugFlag();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState("");
  const [showPermanentLabels, setShowPermanentLabels] = useState(true);
  const [tileLoads, setTileLoads] = useState(0);
  const [tileErrors, setTileErrors] = useState(0);
  const [containerSize, setContainerSize] = useState("unknown");
  const [debugNote, setDebugNote] = useState("mounting");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mappedEntries = entries.filter(
    (entry) => entry.store.latitude !== null && entry.store.longitude !== null,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 720px)");
    const update = () => setShowPermanentLabels(!mediaQuery.matches);

    update();
    return bindMediaQuery(mediaQuery, update);
  }, []);

  useEffect(() => {
    const updateContainerSize = () => {
      const node = containerRef.current;

      if (!node) {
        setContainerSize("missing");
        return;
      }

      setContainerSize(`${Math.round(node.clientWidth)}x${Math.round(node.clientHeight)}`);
    };

    updateContainerSize();
    window.setTimeout(updateContainerSize, 100);
    window.setTimeout(updateContainerSize, 600);
    window.addEventListener("resize", updateContainerSize);
    window.addEventListener("orientationchange", updateContainerSize);

    return () => {
      window.removeEventListener("resize", updateContainerSize);
      window.removeEventListener("orientationchange", updateContainerSize);
    };
  }, []);

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
    <div className="map-canvas" ref={containerRef}>
      <div className="map-overlay-actions">
        <button className="button button-secondary" onClick={locateUser} type="button">
          Show my location
        </button>
        {locationError ? <span className="field-help">{locationError}</span> : null}
      </div>
      {debugEnabled ? (
        <div className="debug-panel debug-panel--overlay">
          <strong>Map debug</strong>
          <span>entries: {entries.length}</span>
          <span>mappedEntries: {mappedEntries.length}</span>
          <span>selectedStoreId: {selectedStoreId ?? "(none)"}</span>
          <span>showPermanentLabels: {String(showPermanentLabels)}</span>
          <span>container: {containerSize}</span>
          <span>tileLoads: {tileLoads}</span>
          <span>tileErrors: {tileErrors}</span>
          <span>note: {debugNote}</span>
        </div>
      ) : null}
      <MapContainer center={TOKYO_CENTER} scrollWheelZoom zoom={12}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          eventHandlers={{
            load() {
              setDebugNote("tile layer loaded");
            },
            loading() {
              setDebugNote("tile layer loading");
            },
            tileerror() {
              setTileErrors((count) => count + 1);
              setDebugNote("tile error");
            },
            tileload() {
              setTileLoads((count) => count + 1);
              setDebugNote("tile loaded");
            },
          }}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <InvalidateMapSize />
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
            <Tooltip
              className="map-label"
              direction={showPermanentLabels ? "right" : "top"}
              offset={showPermanentLabels ? [12, 0] : [0, -10]}
              opacity={1}
              permanent={showPermanentLabels}
            >
              <div className="map-tooltip__content">
                <strong>Your location</strong>
              </div>
            </Tooltip>
          </CircleMarker>
        ) : null}
        {mappedEntries.map((entry) => {
          const isSelected = entry.store.id === selectedStoreId;

          return (
            <Marker
              key={entry.store.id}
              icon={isSelected ? selectedStorePin : storePin}
              position={[entry.store.latitude!, entry.store.longitude!]}
              eventHandlers={{
                click() {
                  onSelectStore(entry.store.id);
                },
              }}
            >
              <Tooltip
                className="map-label"
                direction={showPermanentLabels ? "right" : "top"}
                offset={showPermanentLabels ? [12, 0] : [0, -10]}
                opacity={1}
                permanent={showPermanentLabels}
              >
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
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
