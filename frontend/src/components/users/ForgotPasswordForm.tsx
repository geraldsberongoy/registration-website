"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { forgotPasswordAction } from "@/actions/authActions";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, null);

  const error = state?.error ?? "";
  const successMessage =
    state?.success && state?.data && "message" in state.data
      ? (state.data.message as string)
      : "";

  return (
    <div
      className="
      relative overflow-hidden
      bg-[rgba(255,255,255,0.03)]
      backdrop-blur-md
      border border-[rgba(255,255,255,0.15)]
      rounded-[24px]
      p-8
      shadow-[0_8px_32px_rgba(0,0,0,0.4)]
    "
    >
      <form action={formAction} className="space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-3 mb-4">
            <p className="text-red-200 text-xs text-center">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl px-4 py-3 mb-4">
            <p className="text-emerald-200 text-xs text-center">{successMessage}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[#9dd5d5] text-[11px] font-medium block">Email</label>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            disabled={isPending}
            className={`
              w-full
              !bg-[rgba(15,30,30,0.9)]
              border ${
                focusedField === "email" ? "!border-[#7dc5c5]" : "!border-[#5da5a5]"
              }
              rounded-xl
              px-4 py-3
              !text-[#d5e5e5] text-sm
              !placeholder:text-[rgba(197,213,213,0.5)]
              outline-none
              transition-all duration-200
              focus:!border-[#7dc5c5]
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="
            w-full
            bg-[rgba(35,60,60,0.6)]
            hover:bg-[rgba(35,60,60,0.7)]
            text-[#95b5b5]
            font-semibold
            py-3.5
            rounded-xl
            transition-all duration-200
            text-sm
            mt-4
            disabled:opacity-60
            disabled:cursor-not-allowed
          "
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending reset link...
            </span>
          ) : (
            "Send Reset Link"
          )}
        </button>
      </form>

      <div className="mt-7 pt-6 border-t border-[rgba(139,197,197,0.15)]">
        <p className="text-[rgba(165,197,197,0.6)] text-[10px] text-center font-medium">
          We will send a secure, single-use reset link if your account exists.
        </p>
      </div>
    </div>
  );
}
