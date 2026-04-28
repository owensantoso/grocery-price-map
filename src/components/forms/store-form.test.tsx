import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StoreForm } from "./store-form";

vi.mock("next/dynamic", () => ({
  default: () =>
    function MockLocationPicker({
      onChange,
    }: {
      onChange: (value: { latitude: number; longitude: number }) => void;
    }) {
      return (
        <button
          onClick={() => onChange({ latitude: 35.6895, longitude: 139.6917 })}
          type="button"
        >
          Pick map location
        </button>
      );
    },
}));

vi.mock("@/app/actions", () => ({
  createStoreAction: vi.fn(),
}));

describe("StoreForm", () => {
  it("lets keyboard users enter physical store coordinates", () => {
    render(<StoreForm />);

    const latitude = screen.getByLabelText("Latitude");
    const longitude = screen.getByLabelText("Longitude");

    fireEvent.change(latitude, { target: { value: "35.6895" } });
    fireEvent.change(longitude, { target: { value: "139.6917" } });

    expect(latitude).toHaveValue("35.6895");
    expect(longitude).toHaveValue("139.6917");
    expect(screen.getByText("Pinned at 35.6895, 139.6917")).toBeInTheDocument();
  });

  it("preserves partial decimal and negative coordinate typing", () => {
    render(<StoreForm />);

    const latitude = screen.getByLabelText("Latitude");
    const longitude = screen.getByLabelText("Longitude");

    fireEvent.change(latitude, { target: { value: "-" } });
    expect(latitude).toHaveValue("-");

    fireEvent.change(latitude, { target: { value: "-35." } });
    expect(latitude).toHaveValue("-35.");

    fireEvent.change(latitude, { target: { value: "-35.6" } });
    fireEvent.change(longitude, { target: { value: "139." } });
    expect(longitude).toHaveValue("139.");

    fireEvent.change(longitude, { target: { value: "139.7" } });
    expect(screen.getByText("Pinned at -35.6, 139.7")).toBeInTheDocument();
  });

  it("keeps the numeric fields synced with the map picker", () => {
    render(<StoreForm />);

    fireEvent.click(screen.getByRole("button", { name: "Pick map location" }));

    expect(screen.getByLabelText("Latitude")).toHaveValue("35.6895");
    expect(screen.getByLabelText("Longitude")).toHaveValue("139.6917");
  });

  it("clears coordinate inputs when switching to online store mode", () => {
    render(<StoreForm />);

    fireEvent.change(screen.getByLabelText("Latitude"), { target: { value: "35.6895" } });
    fireEvent.change(screen.getByLabelText("Longitude"), { target: { value: "139.6917" } });
    fireEvent.change(screen.getByLabelText("Store type"), { target: { value: "online" } });

    expect(screen.queryByLabelText("Latitude")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Longitude")).not.toBeInTheDocument();
  });
});
