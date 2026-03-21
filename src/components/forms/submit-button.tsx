"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
};

export function SubmitButton({
  children,
  variant = "primary",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`button ${variant === "primary" ? "button-primary" : "button-secondary"}`}
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving..." : children}
    </button>
  );
}
