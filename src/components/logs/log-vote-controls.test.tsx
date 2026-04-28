import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { voteOnPriceLogAction } from "@/app/actions";
import { LogVoteControls } from "./log-vote-controls";

vi.mock("@/app/actions", () => ({
  voteOnPriceLogAction: vi.fn(async () => ({ message: "", status: "idle" })),
}));

describe("LogVoteControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("optimistically updates the score and flushes the requested vote", async () => {
    render(
      <LogVoteControls
        logId="log-1"
        summary={{
          downvotes: 1,
          score: 1,
          upvotes: 2,
          viewerVote: 0,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Upvote" }));

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3 up / 1 down")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(140);
      await Promise.resolve();
    });

    expect(voteOnPriceLogAction).toHaveBeenCalledWith("log-1", 1);
  });

  it("rolls back optimistic state when the vote action fails", async () => {
    vi.mocked(voteOnPriceLogAction).mockResolvedValueOnce({
      message: "Could not update vote.",
      status: "error",
    });

    render(
      <LogVoteControls
        logId="log-1"
        summary={{
          downvotes: 1,
          score: 1,
          upvotes: 2,
          viewerVote: 0,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Downvote" }));

    expect(screen.getByText("0")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(140);
      await Promise.resolve();
    });

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2 up / 1 down")).toBeInTheDocument();
  });
});
