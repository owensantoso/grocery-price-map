"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  block?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
};

export function SubmitButton({
  block = false,
  children,
  variant = "primary",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`button ${variant === "primary" ? "button-primary" : "button-secondary"} ${
        block ? "button-block" : ""
      }`}
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving..." : children}
    </button>
  );
}
