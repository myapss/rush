"use client";

import { useActionState } from "react";
import { deleteAccount, type DeleteState } from "@/lib/actions/profile";

export function DeleteAccount() {
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccount, { status: "idle" });
  return (
    <form action={action} className="grid max-w-sm gap-3">
      <label className="label">
        Type DELETE to confirm
        <input className="input" name="confirm" autoComplete="off" required />
      </label>
      {state.status === "error" && (
        <p role="alert" className="error-text">
          {state.message}
        </p>
      )}
      <button type="submit" className="btn btn-danger" disabled={pending}>
        {pending ? "Deleting…" : "Permanently delete my account"}
      </button>
    </form>
  );
}
