"use client";

import dynamic from "next/dynamic";
import type { StoreRecord } from "@/lib/models";

const DynamicStoreDirectoryMap = dynamic(
  () =>
    import("@/components/stores/store-directory-map").then(
      (module) => module.StoreDirectoryMap,
    ),
  {
    loading: () => <div className="map-canvas" />,
    ssr: false,
  },
);

export function StoreDirectoryMapLoader({ stores }: { stores: StoreRecord[] }) {
  return <DynamicStoreDirectoryMap stores={stores} />;
}
