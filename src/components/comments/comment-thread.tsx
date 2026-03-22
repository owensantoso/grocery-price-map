"use client";

import { useActionState } from "react";
import { createPriceLogCommentAction, type ActionState } from "@/app/actions";
import { CommentVoteControls } from "@/components/comments/comment-vote-controls";
import { SubmitButton } from "@/components/forms/submit-button";
import { formatDate } from "@/lib/format";
import type { CommentThreadEntry } from "@/lib/models";

const initialState: ActionState = {
  message: "",
  status: "idle",
};

type CommentThreadProps = {
  canInteract: boolean;
  comments: CommentThreadEntry[];
  logId: string;
};

export function CommentThread({ canInteract, comments, logId }: CommentThreadProps) {
  const [state, formAction] = useActionState(
    createPriceLogCommentAction.bind(null, logId),
    initialState,
  );

  return (
    <section className="panel stack-md">
      <div className="stack-xs">
        <h2 className="section-title">Comments</h2>
        <p className="muted">Discuss this log like a post thread.</p>
      </div>
      {canInteract ? (
        <form action={formAction} className="stack-sm">
          <textarea
            className="textarea"
            name="body"
            placeholder="Add a comment about this price, the item, or the store..."
          />
          {state.status === "error" ? <p className="form-error">{state.message}</p> : null}
          <SubmitButton pendingLabel="Submitting...">
            Post comment
          </SubmitButton>
        </form>
      ) : (
        <p className="field-help">Sign in to comment or vote.</p>
      )}
      {comments.length === 0 ? (
        <div className="empty-state">No comments yet.</div>
      ) : (
        <div className="comment-list">
          {comments.map((entry) => (
            <article className="comment-row" key={entry.comment.id}>
              <CommentVoteControls
                commentId={entry.comment.id}
                disabled={!canInteract}
                summary={entry.voteSummary}
              />
              <div className="stack-xs">
                <div className="comment-meta">
                  <p className="comment-author">{entry.authorLabel}</p>
                  <span className="muted">{formatDate(entry.comment.created_at)}</span>
                </div>
                <p>{entry.comment.body}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
