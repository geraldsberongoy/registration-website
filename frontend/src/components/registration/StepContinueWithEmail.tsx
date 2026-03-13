"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, UserPlus, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { checkEmailAction } from "@/actions/authActions";

type Phase = "email" | "password" | "register_required";

interface StepContinueWithEmailProps {
  eventSlug: string;
  onSuccess: () => void;
}

export function StepContinueWithEmail({
  eventSlug,
  onSuccess,
}: StepContinueWithEmailProps) {
  const [phase, setPhase] = useState<Phase>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Create-account form (when register_required)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      const result = await checkEmailAction({ email: trimmed });
      if (!result.success) {
        setError(result.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      setEmail(trimmed);
      setPhase(result.data?.exists ? "password" : "register_required");
    } catch {
      setError("Could not check email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      if (signInError) {
        setError(signInError.message || "Invalid password.");
        setLoading(false);
        return;
      }
      onSuccess();
    } catch {
      setError("Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const backToEmail = () => {
    setPhase("email");
    setPassword("");
    setError("");
    setFirstName("");
    setLastName("");
    setRegisterPassword("");
    setConfirmPassword("");
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first || !last) {
      setError("First name and last name are required.");
      return;
    }
    if (!registerPassword.trim()) {
      setError("Please enter a password.");
      return;
    }
    if (registerPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: registerPassword.trim(),
        options: {
          data: {
            first_name: first,
            last_name: last,
            full_name: `${first} ${last}`.trim() || null,
            role: "user",
          },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      // Redirect so the page reloads with the new session and user continues the flow
      window.location.href = `/event/${eventSlug}/register`;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full !bg-[rgba(15,30,30,0.9)] border border-[#5da5a5] rounded-xl px-4 py-3 !text-[#d5e5e5] text-sm !placeholder:text-[rgba(197,213,213,0.5)] outline-none transition-all duration-200 focus:border-[#7dc5c5] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  const labelClass = "block text-[#9dd5d5] text-[11px] font-medium mb-1.5";
  const btnPrimary =
    "w-full bg-[rgba(35,60,60,0.6)] hover:bg-[rgba(35,60,60,0.7)] text-[#95b5b5] font-semibold py-3.5 rounded-xl transition-all duration-200 text-sm disabled:opacity-60 disabled:cursor-not-allowed";
  const btnSecondary =
    "flex-1 py-3.5 rounded-xl border border-[rgba(139,197,197,0.4)] hover:bg-[rgba(20,40,40,0.9)] text-[#95b5b5] font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex flex-col items-center text-center mb-3 sm:mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[rgba(93,216,216,0.15)] border border-[#5da5a5] flex items-center justify-center mb-2 sm:mb-3">
          {phase === "email" && <Mail size={20} className="text-[#5dd8d8] sm:w-6 sm:h-6" />}
          {phase === "password" && <Lock size={20} className="text-[#5dd8d8] sm:w-6 sm:h-6" />}
          {phase === "register_required" && <UserPlus size={20} className="text-[#5dd8d8] sm:w-6 sm:h-6" />}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#f5f5f5] tracking-tight">
          {phase === "email" && "Continue with email"}
          {phase === "password" && "Enter your password"}
          {phase === "register_required" && "Create an account"}
        </h2>
      </div>

      <p className="text-[rgba(197,213,213,0.8)] mb-4 leading-relaxed text-[11px] sm:text-sm text-center">
        {phase === "email" && "Enter the email address you use for your account. We’ll check if you’re already registered."}
        {phase === "password" && "This email is already registered. Sign in with your password to continue."}
        {phase === "register_required" && "No account was found with this email. Please create an account to register for this event."}
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-400/30">
          <p className="text-red-200 text-[11px] sm:text-sm text-center">{error}</p>
        </div>
      )}

      {phase === "email" && (
        <form onSubmit={handleCheckEmail} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="continue-email" className={labelClass}>Email</label>
            <input
              id="continue-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className={inputClass}
            />
          </div>
          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? "Checking…" : "Continue"}
          </button>
        </form>
      )}

      {phase === "password" && (
        <form onSubmit={handleSignIn} className="space-y-5">
          <div className="space-y-2">
            <label className={labelClass}>Email</label>
            <p className="text-[#d5e5e5] text-sm py-2">{email}</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="continue-password" className={labelClass}>Password</label>
            <div className="relative">
              <input
                id="continue-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className={inputClass + " pr-12"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7dc5c5] hover:text-[#9dd5d5] transition-colors disabled:opacity-50"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="pt-1 text-right">
              <Link
                href="/forgot-password"
                className="text-[11px] text-[#80d7d7] hover:text-[#a2e6e6] underline-offset-4 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          </div>
          <div className="flex gap-3 items-stretch pt-1">
            <button
              type="button"
              onClick={backToEmail}
              disabled={loading}
              className="flex-1 min-w-0 py-3.5 rounded-xl border border-[rgba(139,197,197,0.4)] hover:bg-[rgba(20,40,40,0.9)] text-[#95b5b5] font-semibold text-sm transition-all duration-200 whitespace-nowrap"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="flex-1 min-w-0 py-3.5 rounded-xl bg-[rgba(35,60,60,0.7)] hover:bg-[rgba(35,60,60,0.8)] text-[#95b5b5] font-semibold text-sm transition-all duration-200"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>
      )}

      {phase === "register_required" && (
        <form id="create-account-form" onSubmit={handleCreateAccount} className="space-y-4">
          <p className="text-[rgba(197,213,213,0.9)] text-sm leading-relaxed">
            No account was found. Fill in the form below to create one and continue.
          </p>
          <div className="space-y-2">
            <label htmlFor="reg-first-name" className={labelClass}>First name</label>
            <input
              id="reg-first-name"
              type="text"
              autoComplete="given-name"
              placeholder="Juan"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={loading}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="reg-last-name" className={labelClass}>Last name</label>
            <input
              id="reg-last-name"
              type="text"
              autoComplete="family-name"
              placeholder="Dela Cruz"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={loading}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Email</label>
            <p className="text-[#d5e5e5] text-sm py-2">{email}</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="reg-password" className={labelClass}>Password</label>
            <div className="relative">
              <input
                id="reg-password"
                type={showRegisterPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                disabled={loading}
                className={inputClass + " pr-12"}
              />
              <button
                type="button"
                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7dc5c5] hover:text-[#9dd5d5] transition-colors disabled:opacity-50"
                aria-label={showRegisterPassword ? "Hide password" : "Show password"}
              >
                {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="reg-confirm-password" className={labelClass}>Confirm password</label>
            <div className="relative">
              <input
                id="reg-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className={inputClass + " pr-12"}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7dc5c5] hover:text-[#9dd5d5] transition-colors disabled:opacity-50"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="flex gap-3 items-stretch">
            <button
              type="button"
              onClick={backToEmail}
              className="flex-1 min-w-0 py-3.5 rounded-xl border border-[rgba(139,197,197,0.4)] hover:bg-[rgba(20,40,40,0.9)] text-[#95b5b5] font-semibold text-sm transition-all duration-200 whitespace-nowrap"
            >
              Use different email
            </button>
            <button
              type="submit"
              form="create-account-form"
              disabled={loading || !firstName.trim() || !lastName.trim() || !registerPassword || registerPassword !== confirmPassword}
              className="flex-1 min-w-0 py-3.5 rounded-xl bg-[rgba(35,60,60,0.6)] hover:bg-[rgba(35,60,60,0.7)] text-[#95b5b5] font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-1.5"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
