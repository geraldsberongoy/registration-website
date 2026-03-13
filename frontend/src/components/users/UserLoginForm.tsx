"use client";

import { useActionState, useEffect, useRef } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { loginAction } from "@/actions/authActions";
import { getUserRoleAction } from "@/actions/authActions";
import { getLastViewedEventSlug } from "@/utils/last-viewed-event";
import { useUserStore } from "@/store/useUserStore";

type UserLoginFormProps = { showRegisteredMessage?: boolean };

export default function UserLoginForm({
  showRegisteredMessage,
}: UserLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const redirectDone = useRef(false);

  const [state, formAction, isPending] = useActionState(loginAction, null);
  const error = state?.error ?? "";

  useEffect(() => {
    if (!state?.success || redirectDone.current) return;
    redirectDone.current = true;
    let cancelled = false;
    (async () => {
      const res = await getUserRoleAction();
      if (cancelled) return;
      const data: any = res.data ?? {};
      
      // Update global store
      const userRole = data?.role === "admin" ? "admin" : data?.role === "user" ? "user" : null;
      useUserStore.getState().setUser(userRole, data?.userId ?? null);

      if (userRole === "admin") {
        router.replace("/dashboard");
        return;
      }
      const lastSlug = getLastViewedEventSlug();
      router.replace(lastSlug ? `/event/${lastSlug}` : "/dashboard");
    })();
    return () => {
      cancelled = true;
    };
  }, [state?.success, router]);

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
      {showRegisteredMessage && (
        <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-400/30 px-4 py-3 text-center">
          <p className="text-emerald-200 text-xs">
            Account created. Login to continue.
          </p>
        </div>
      )}
      
      {state?.success && (
        <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-400/30 px-4 py-3 text-center">
          <p className="text-emerald-200 text-xs">
            Login successful. Please wait...
          </p>
        </div>
      )}
      <form action={formAction} className="space-y-5">
        {/* error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-3 mb-4">
            <p className="text-red-200 text-xs text-center">{error}</p>
          </div>
        )}

        {/* email input */}
        <div className="space-y-2">
          <label className="text-[#9dd5d5] text-[11px] font-medium block">
            Email
          </label>
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
                focusedField === "email"
                  ? "!border-[#7dc5c5]"
                  : "!border-[#5da5a5]"
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

        {/* password input */}
        <div className="space-y-2">
          <label className="text-[#9dd5d5] text-[11px] font-medium block">
            Password
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              disabled={isPending}
              className={`
                w-full
                !bg-[rgba(15,30,30,0.9)]
                border ${
                  focusedField === "password"
                    ? "!border-[#7dc5c5]"
                    : "!border-[#5da5a5]"
                }
                rounded-xl
                px-4 py-3 pr-12
                !text-[#d5e5e5] text-sm
                !placeholder:text-[rgba(197,213,213,0.5)]
                outline-none
                transition-all duration-200
                focus:!border-[#7dc5c5]
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            />

            {/* show password toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isPending}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7dc5c5] hover:text-[#9dd5d5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="text-right pt-1">
            <Link
              href="/forgot-password"
              className="text-[11px] text-[#80d7d7] hover:text-[#a2e6e6] underline-offset-4 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        {/* submit button */}
        <button
          type="submit"
          disabled={isPending || !!state?.success}
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
              Logging in...
            </span>
          ) : state?.success ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecting...
            </span>
          ) : (
            "Login"
          )}
        </button>
      </form>

      {/* Footer Text inside card */}
      <div className="mt-7 pt-6 border-t border-[rgba(139,197,197,0.15)]">
        <p className="text-[rgba(165,197,197,0.6)] text-[10px] text-center font-medium">
          Welcome back · Arduino Day Philippines
        </p>
      </div>
    </div>
  );
}
