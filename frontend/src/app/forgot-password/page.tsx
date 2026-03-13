import Image from "next/image";
import Link from "next/link";
import AdminLoginBackground from "@/components/admin/AdminLoginBackground";
import ForgotPasswordForm from "@/components/users/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <AdminLoginBackground />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="text-center mb-10 space-y-3">
          <div className="inline-block mb-4">
            <Image
              src="/images/logos/adph-logo.png"
              alt="Arduino Day Philippines"
              width={96}
              height={96}
              className="opacity-95"
            />
          </div>
          <h1 className="text-[36px] sm:text-[44px] md:text-[48px] font-bold text-[#f5f5f5] tracking-tight leading-none">
            Forgot Password
          </h1>
          <p className="text-[#5dd8d8] text-[11px] tracking-[0.3em] uppercase font-semibold">
            Recover your account access
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="mt-4 text-center text-[11px] text-[rgba(200,230,230,0.75)]">
          Remembered your password?{" "}
          <Link
            href="/"
            className="text-[#6dd8d8] hover:text-[#8de5e5] underline-offset-4 hover:underline font-medium"
          >
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
