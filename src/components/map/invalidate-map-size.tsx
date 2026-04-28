"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

type LeafletMapWithLoadState = ReturnType<typeof useMap> & {
  _loaded?: boolean;
};

export function invalidateMapSizeWhenReady(map: ReturnType<typeof useMap>) {
  try {
    const container = map.getContainer?.();
    const maybeMap = map as LeafletMapWithLoadState;

    if (!maybeMap._loaded || !container || !container.isConnected) {
      return false;
    }

    map.invalidateSize();
    return true;
  } catch {
    // Leaflet can briefly tear down internals during mount/unmount cycles.
    return false;
  }
}

export function InvalidateMapSize() {
  const map = useMap();

  useEffect(() => {
    const timeoutIds: number[] = [];
    const scheduleRefresh = (delay = 0) => {
      const timeoutId = window.setTimeout(() => {
        invalidateMapSizeWhenReady(map);
      }, delay);

      timeoutIds.push(timeoutId);
    };

    const refresh = () => scheduleRefresh();

    refresh();
    scheduleRefresh(250);
    window.addEventListener("resize", refresh);
    window.addEventListener("orientationchange", refresh);

    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("orientationchange", refresh);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [map]);

  return null;
}
