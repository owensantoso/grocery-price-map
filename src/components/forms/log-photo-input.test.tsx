import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LogPhotoInput } from "./log-photo-input";

describe("LogPhotoInput", () => {
  it("warns contributors that uploaded log photos are public", () => {
    render(<LogPhotoInput />);

    expect(
      screen.getByText(/photos added to price logs are public/i),
    ).toBeInTheDocument();
  });
});
