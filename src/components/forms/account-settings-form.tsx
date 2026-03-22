"use client";

import { useActionState } from "react";
import { updateAccountSettingsAction, type ActionState } from "@/app/actions";
import { SubmitButton } from "@/components/forms/submit-button";

const initialState: ActionState = {
  message: "",
  status: "idle",
};

export function AccountSettingsForm({ defaultUsername }: { defaultUsername: string }) {
  const [state, formAction] = useActionState(updateAccountSettingsAction, initialState);

  return (
    <form action={formAction} className="stack-md">
      {state.status === "error" ? <p className="form-error">{state.message}</p> : null}
      <label className="form-field">
        <span>Username</span>
        <input
          className="input"
          defaultValue={defaultUsername}
          name="publicName"
          pattern="^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$"
          required
        />
        <span className="field-help">
          Public usernames use letters, numbers, and hyphens. This shows on comments
          and shared activity.
        </span>
        {state.fieldErrors?.publicName?.[0] ? (
          <span className="field-error">{state.fieldErrors.publicName[0]}</span>
        ) : null}
      </label>
      <SubmitButton>Save settings</SubmitButton>
    </form>
  );
}
