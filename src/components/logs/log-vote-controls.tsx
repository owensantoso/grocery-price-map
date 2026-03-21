"use client";

import { useEffect, useRef, useState } from "react";
import { voteOnPriceLogAction } from "@/app/actions";
import type { VoteSummary } from "@/lib/models";

type LogVoteControlsProps = {
  compact?: boolean;
  disabled?: boolean;
  logId: string;
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

function getNextVote(currentVote: -1 | 0 | 1, targetVote: -1 | 1): -1 | 0 | 1 {
  return currentVote === targetVote ? 0 : targetVote;
}

export function LogVoteControls({
  compact,
  disabled,
  logId,
  summary,
}: LogVoteControlsProps) {
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

      const result = await voteOnPriceLogAction(logId, voteToSend);
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

  function handleVote(targetVote: -1 | 1) {
    if (disabled) {
      return;
    }

    setLocalSummary((currentSummary) => {
      const nextVote = getNextVote(currentSummary.viewerVote, targetVote);
      desiredVoteRef.current = nextVote;
      scheduleFlush();
      return applyVote(currentSummary, nextVote);
    });
  }

  return (
    <div className={`vote-stack ${compact ? "vote-stack--compact" : ""}`}>
      <div className="vote-controls" aria-label="Vote on this log">
        <button
          aria-label="Upvote"
          className={`vote-button ${localSummary.viewerVote === 1 ? "is-active" : ""}`}
          disabled={disabled}
          onClick={() => handleVote(1)}
          type="button"
        >
          ▲
        </button>
        <span className="vote-score">{localSummary.score}</span>
        <button
          aria-label="Downvote"
          className={`vote-button ${localSummary.viewerVote === -1 ? "is-active" : ""}`}
          disabled={disabled}
          onClick={() => handleVote(-1)}
          type="button"
        >
          ▼
        </button>
      </div>
      {!compact ? (
        <span className="field-help">
          {localSummary.upvotes} up / {localSummary.downvotes} down
        </span>
      ) : null}
    </div>
  );
}
