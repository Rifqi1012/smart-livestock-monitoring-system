"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Milk, User, Lock, Eye, EyeOff, Thermometer, Droplets, Wind } from "lucide-react";

// Neumorphic surfaces built on the #F0F0F0 base.
const RAISED = "shadow-[8px_8px_16px_#c9c9c9,-8px_-8px_16px_#ffffff]";
const INSET = "shadow-[inset_5px_5px_10px_#d6d6d6,inset_-5px_-5px_10px_#ffffff]";

export default function LoginPage() {
  // useSearchParams() must be inside a Suspense boundary (Next 16 build rule).
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const callbackUrl = useSearchParams().get("callbackUrl") || "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Username atau password salah");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F0F0F0] p-4">
      {/* Logo + title */}
      <div className="flex flex-col items-center">
        <div className={`flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#F0F0F0] ${RAISED}`}>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
            <Milk size={28} className="text-[#10B981]" aria-hidden />
          </span>
        </div>
        <h1 className="mt-5 text-3xl font-bold text-[#1F2937]">SLMS</h1>
        <p className="text-sm text-[#6B7280]">Smart Livestock Monitoring System</p>
      </div>

      {/* Card */}
      <form
        onSubmit={onSubmit}
        className={`w-full max-w-md rounded-[28px] bg-[#F0F0F0] p-8 ${RAISED}`}
      >
        <h2 className="text-center text-2xl font-bold text-[#1F2937]">Selamat datang kembali</h2>
        <p className="mt-1 text-center text-sm text-[#6B7280]">
          Masuk untuk mengakses dashboard monitoring kandang.
        </p>

        {error && (
          <p className={`mt-5 rounded-2xl bg-[#F0F0F0] px-4 py-2.5 text-sm text-red-600 ${INSET}`}>
            {error}
          </p>
        )}

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Username
            </span>
            <div className={`flex items-center gap-3 rounded-2xl bg-[#F0F0F0] px-4 py-3 ${INSET}`}>
              <User size={18} className="shrink-0 text-[#9CA3AF]" aria-hidden />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="admin"
                required
                className="w-full bg-transparent text-sm text-[#1F2937] outline-none placeholder:text-[#9CA3AF]"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Password
            </span>
            <div className={`flex items-center gap-3 rounded-2xl bg-[#F0F0F0] px-4 py-3 ${INSET}`}>
              <Lock size={18} className="shrink-0 text-[#9CA3AF]" aria-hidden />
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                className="w-full bg-transparent text-sm text-[#1F2937] outline-none placeholder:text-[#9CA3AF]"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Sembunyikan password" : "Tampilkan password"}
                className="shrink-0 text-[#9CA3AF] hover:text-[#6B7280]"
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-7 w-full rounded-2xl bg-[#10B981] py-3.5 text-sm font-semibold text-white shadow-[4px_4px_12px_#c9c9c9] transition hover:bg-[#0ea371] disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      {/* Decorative sensor tiles (illustrative only) */}
      {/* <div className="flex gap-4">
        {[
          { label: "Suhu", Icon: Thermometer },
          { label: "Kelembapan", Icon: Droplets },
          { label: "Amonia", Icon: Wind },
        ].map(({ label, Icon }) => (
          <div
            key={label}
            className={`flex flex-col items-center gap-2 rounded-2xl bg-[#F0F0F0] px-8 py-5 ${RAISED}`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <Icon size={18} className="text-[#10B981]" aria-hidden />
            </span>
            <span className="text-sm font-semibold text-[#1F2937]">{label}</span>
          </div>
        ))}
      </div> */}

      <p className="text-xs text-[#9CA3AF] text-center">
        © 2026 SMKN 5 Pangalengan — Sistem Monitoring Kandang Sapi Perah
      </p>
    </main>
  );
}
