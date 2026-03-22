"use client";

import { useEffect, useRef, useState } from "react";
import { voteOnCommentAction } from "@/app/actions";
import type { VoteSummary } from "@/lib/models";

type CommentVoteControlsProps = {
  commentId: string;
  disabled?: boolean;
  summary: VoteSummary;
};

function applyVote(summary: VoteSummary, nextVote: -1 | 0 | 1): VoteSummary {
  let upvotes = summary.upvotes;
  let downvotes = summary.downvotes;

  if (summary.viewerVote === 1) {
    upvotes -= 1;
  } else if (summary.viewerVote === -1) {
    downvotes -= 1;
  }

  if (nextVote === 1) {
    upvotes += 1;
  } else if (nextVote === -1) {
    downvotes += 1;
  }

  return {
    downvotes,
    score: upvotes - downvotes,
    upvotes,
    viewerVote: nextVote,
  };
}

export function CommentVoteControls({
  commentId,
  disabled,
  summary,
}: CommentVoteControlsProps) {
  const [localSummary, setLocalSummary] = useState(summary);
  const desiredVoteRef = useRef<-1 | 0 | 1>(summary.viewerVote);
  const inflightVoteRef = useRef<-1 | 0 | 1 | null>(null);
  const flushTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
      }
    };
  }, []);

  function scheduleFlush() {
    if (flushTimerRef.current !== null) {
      window.clearTimeout(flushTimerRef.current);
    }

    flushTimerRef.current = window.setTimeout(async () => {
      if (inflightVoteRef.current !== null) {
        return;
      }

      const voteToSend = desiredVoteRef.current;
      inflightVoteRef.current = voteToSend;
      const result = await voteOnCommentAction(commentId, voteToSend);
      inflightVoteRef.current = null;

      if (result.status === "error") {
        desiredVoteRef.current = summary.viewerVote;
        setLocalSummary(summary);
        return;
      }

      if (desiredVoteRef.current !== voteToSend) {
        scheduleFlush();
      }
    }, 140);
  }

  return (
    <div className="comment-vote-controls">
      <button
        className={`vote-button ${localSummary.viewerVote === 1 ? "is-active" : ""}`}
        disabled={disabled}
        onClick={() => {
          if (disabled) {
            return;
          }
          setLocalSummary((current) => {
            const nextVote = current.viewerVote === 1 ? 0 : 1;
            desiredVoteRef.current = nextVote;
            scheduleFlush();
            return applyVote(current, nextVote);
          });
        }}
        type="button"
      >
        ▲
      </button>
      <span className="vote-score vote-score--comment">{localSummary.score}</span>
      <button
        className={`vote-button ${localSummary.viewerVote === -1 ? "is-active" : ""}`}
        disabled={disabled}
        onClick={() => {
          if (disabled) {
            return;
          }
          setLocalSummary((current) => {
            const nextVote = current.viewerVote === -1 ? 0 : -1;
            desiredVoteRef.current = nextVote;
            scheduleFlush();
            return applyVote(current, nextVote);
          });
        }}
        type="button"
      >
        ▼
      </button>
    </div>
  );
}
