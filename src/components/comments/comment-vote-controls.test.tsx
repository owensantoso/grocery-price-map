import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommentVoteControls } from "./comment-vote-controls";

vi.mock("@/app/actions", () => ({
  voteOnCommentAction: vi.fn(async () => ({ message: "", status: "idle" })),
}));

describe("CommentVoteControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("exposes accessible vote names and pressed state", () => {
    render(
      <CommentVoteControls
        commentId="comment-1"
        summary={{
          downvotes: 1,
          score: 1,
          upvotes: 2,
          viewerVote: 0,
        }}
      />,
    );

    const upvoteButton = screen.getByRole("button", { name: "Upvote comment" });
    const downvoteButton = screen.getByRole("button", { name: "Downvote comment" });

    expect(upvoteButton).toHaveAttribute("aria-pressed", "false");
    expect(downvoteButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(upvoteButton);

    expect(upvoteButton).toHaveAttribute("aria-pressed", "true");
    expect(downvoteButton).toHaveAttribute("aria-pressed", "false");
  });
});
