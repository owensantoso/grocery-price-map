import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InvalidateMapSize } from "./invalidate-map-size";

type MockMap = {
  _loaded?: boolean;
  getContainer: () => HTMLElement;
  invalidateSize: ReturnType<typeof vi.fn>;
};

let currentMap: MockMap;

vi.mock("react-leaflet", () => ({
  useMap: () => currentMap,
}));

describe("InvalidateMapSize", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("invalidates the map on mount, resize, and orientation changes", () => {
    const container = document.createElement("div");
    document.body.append(container);
    currentMap = {
      _loaded: true,
      getContainer: () => container,
      invalidateSize: vi.fn(),
    };

    render(<InvalidateMapSize />);

    act(() => {
      vi.runOnlyPendingTimers();
    });
    const callsAfterMount = currentMap.invalidateSize.mock.calls.length;

    window.dispatchEvent(new Event("resize"));
    act(() => {
      vi.runOnlyPendingTimers();
    });

    window.dispatchEvent(new Event("orientationchange"));
    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(callsAfterMount).toBeGreaterThan(0);
    expect(currentMap.invalidateSize.mock.calls.length).toBeGreaterThan(
      callsAfterMount + 1,
    );
  });

  it("skips invalidation while Leaflet is unloaded or disconnected", () => {
    const container = document.createElement("div");
    currentMap = {
      _loaded: false,
      getContainer: () => container,
      invalidateSize: vi.fn(),
    };

    render(<InvalidateMapSize />);

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(currentMap.invalidateSize).not.toHaveBeenCalled();
  });
});
