"use client";

import { useActionState } from "react";
import { KeyRound, LoaderCircle } from "lucide-react";
import { updatePassword, type UpdatePasswordState } from "@/actions/auth";

const initialState: UpdatePasswordState = {};

export function UpdatePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    updatePassword,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <label className="block space-y-2 text-sm font-semibold text-slate-700" htmlFor="password">
        Nueva contraseña
        <input
          autoComplete="new-password"
          className="h-12 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          id="password"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>
      <label className="block space-y-2 text-sm font-semibold text-slate-700" htmlFor="confirmPassword">
        Confirma tu nueva contraseña
        <input
          autoComplete="new-password"
          className="h-12 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          id="confirmPassword"
          minLength={8}
          name="confirmPassword"
          required
          type="password"
        />
      </label>
      {state.error && <p className="text-sm text-rose-700">{state.error}</p>}
      <button
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 font-bold text-white transition hover:bg-indigo-700 disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        {isPending ? "Actualizando..." : "Actualizar contraseña"}
      </button>
    </form>
  );
}
