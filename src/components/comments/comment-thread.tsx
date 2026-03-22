"use client";

import { useActionState } from "react";
import { createPriceLogCommentAction, type ActionState } from "@/app/actions";
import { CommentVoteControls } from "@/components/comments/comment-vote-controls";
import { formatDate } from "@/lib/format";
import type { CommentThreadEntry } from "@/lib/models";

const initialState: ActionState = {
  message: "",
  status: "idle",
};

type CommentThreadProps = {
  comments: CommentThreadEntry[];
  logId: string;
};

export function CommentThread({ comments, logId }: CommentThreadProps) {
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
      <form action={formAction} className="stack-sm">
        <textarea
          className="textarea"
          name="body"
          placeholder="Add a comment about this price, the item, or the store..."
        />
        {state.status === "error" ? <p className="form-error">{state.message}</p> : null}
        <button className="button button-primary" type="submit">
          Post comment
        </button>
      </form>
      {comments.length === 0 ? (
        <div className="empty-state">No comments yet.</div>
      ) : (
        <div className="comment-list">
          {comments.map((entry) => (
            <article className="comment-row" key={entry.comment.id}>
              <CommentVoteControls commentId={entry.comment.id} summary={entry.voteSummary} />
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
