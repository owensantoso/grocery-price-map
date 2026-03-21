"use client";

import { startTransition, useEffect, useMemo, useOptimistic, useRef, useState } from "react";
import { voteOnPriceLogAction } from "@/app/actions";
import type { VoteSummary } from "@/lib/models";

type LogVoteControlsProps = {
  compact?: boolean;
  disabled?: boolean;
  logId: string;
  summary: VoteSummary;
};

type LocalVoteState = VoteSummary;

function applyVote(summary: VoteSummary, nextVote: -1 | 0 | 1): LocalVoteState {
  const previousVote = summary.viewerVote;
  let upvotes = summary.upvotes;
  let downvotes = summary.downvotes;

  if (previousVote === 1) {
    upvotes -= 1;
  } else if (previousVote === -1) {
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

function getToggledVote(currentVote: -1 | 0 | 1, targetVote: -1 | 1): -1 | 0 | 1 {
  return currentVote === targetVote ? 0 : targetVote;
}

export function LogVoteControls({
  compact,
  disabled,
  logId,
  summary,
}: LogVoteControlsProps) {
  const [optimisticSummary, setOptimisticSummary] = useOptimistic(
    summary,
    (_currentSummary, nextSummary: VoteSummary) => nextSummary,
  );
  const desiredVoteRef = useRef<-1 | 0 | 1>(summary.viewerVote);
  const inflightVoteRef = useRef<-1 | 0 | 1 | null>(null);
  const flushTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    desiredVoteRef.current = summary.viewerVote;
  }, [summary]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;

      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
      }
    };
  }, []);

  const helperText = useMemo(
    () => `${optimisticSummary.upvotes} up / ${optimisticSummary.downvotes} down`,
    [optimisticSummary.downvotes, optimisticSummary.upvotes],
  );

  function queueFlush() {
    if (flushTimerRef.current !== null) {
      window.clearTimeout(flushTimerRef.current);
    }

    flushTimerRef.current = window.setTimeout(async () => {
      if (inflightVoteRef.current !== null) {
        return;
      }

      const voteToSend = desiredVoteRef.current;
      inflightVoteRef.current = voteToSend;
      setIsSyncing(true);

      const result = await voteOnPriceLogAction(logId, voteToSend);

      if (!mountedRef.current) {
        return;
      }

      inflightVoteRef.current = null;
      setIsSyncing(false);

      if (result.status === "error") {
        desiredVoteRef.current = summary.viewerVote;
        startTransition(() => {
          setOptimisticSummary(summary);
        });
        return;
      }

      if (desiredVoteRef.current !== voteToSend) {
        queueFlush();
      }
    }, 160);
  }

  function handleVote(targetVote: -1 | 1) {
    if (disabled) {
      return;
    }

    startTransition(() => {
      const nextVote = getToggledVote(optimisticSummary.viewerVote, targetVote);
      desiredVoteRef.current = nextVote;
      queueFlush();
      setOptimisticSummary(applyVote(optimisticSummary, nextVote));
    });
  }

  return (
    <div className={`vote-stack ${compact ? "vote-stack--compact" : ""}`}>
      <div className="vote-controls" aria-label="Vote on this log">
        <button
          aria-label="Upvote"
          className={`vote-button ${optimisticSummary.viewerVote === 1 ? "is-active" : ""}`}
          disabled={disabled}
          onClick={() => handleVote(1)}
          type="button"
        >
          ▲
        </button>
        <span className="vote-score">{optimisticSummary.score}</span>
        <button
          aria-label="Downvote"
          className={`vote-button ${optimisticSummary.viewerVote === -1 ? "is-active" : ""}`}
          disabled={disabled}
          onClick={() => handleVote(-1)}
          type="button"
        >
          ▼
        </button>
      </div>
      <span className="field-help">
        {helperText}
        {isSyncing ? " • syncing" : ""}
      </span>
    </div>
  );
}
