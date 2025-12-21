import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

export default function AdminLogin() {
  const nav = useNavigate();
  const loc = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setErr("بيانات غير صحيحة");
        return;
      }

      // تأكيد تثبيت الجلسة
      try {
        const me = await fetch(`${API}/admin/me`, { credentials: "include" });
        const data = await me.json().catch(() => ({}));
        if (!data?.ok) {
          setErr("لم يتم تثبيت الجلسة، حاول ثانية");
          return;
        }
      } catch {}

      const to = loc.state?.from?.pathname || "/admin";
      nav(to, { replace: true });
    } catch {
      setErr("تعذر الاتصال بالخادم، حاول لاحقًا");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div
          className="
            rounded-3xl border border-slate-200/70 dark:border-slate-800/70
            bg-white/80 dark:bg-slate-950/40
            shadow-[0_20px_80px_rgba(0,0,0,0.08)]
            dark:shadow-[0_20px_80px_rgba(0,0,0,0.35)]
            backdrop-blur
            overflow-hidden
          "
        >
          <div className="p-6 sm:p-7 border-b border-slate-200/70 dark:border-slate-800/70">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  تسجيل دخول الإدارة
                </h1>
              </div>

              <div
                className="
                  shrink-0 rounded-2xl px-3 py-2
                  bg-emerald-500/10 ring-1 ring-emerald-400/25
                  text-emerald-600 dark:text-emerald-300
                  text-xs font-semibold
                "
              >
                Admin
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="p-6 sm:p-7 space-y-4" dir="rtl">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  className="
                    w-full rounded-xl border border-slate-200 dark:border-slate-800
                    bg-white dark:bg-slate-900/60
                    px-3 py-2.5 pr-10
                    text-slate-900 dark:text-slate-100
                    placeholder:text-slate-400
                    outline-none
                    focus:ring-2 focus:ring-emerald-300/70 focus:border-emerald-300/60
                  "
                  placeholder="example@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 6h16v12H4V6Z"
                      className="stroke-current"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="m4 7 8 6 8-6"
                      className="stroke-current"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  className="
                    w-full rounded-xl border border-slate-200 dark:border-slate-800
                    bg-white dark:bg-slate-900/60
                    px-3 py-2.5 pr-10
                    text-slate-900 dark:text-slate-100
                    placeholder:text-slate-400
                    outline-none
                    focus:ring-2 focus:ring-emerald-300/70 focus:border-emerald-300/60
                  "
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M7 11V8a5 5 0 0 1 10 0v3"
                      className="stroke-current"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M6 11h12v10H6V11Z"
                      className="stroke-current"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>

            {err && (
              <div
                className="
                  rounded-xl border border-rose-200 dark:border-rose-900/50
                  bg-rose-50 dark:bg-rose-950/40
                  px-3 py-2 text-sm
                  text-rose-700 dark:text-rose-300
                "
              >
                {err}
              </div>
            )}
            <button
              disabled={loading}
              className="
                w-full rounded-xl py-2.5 font-semibold
                bg-slate-900 text-white
                hover:bg-slate-800
                disabled:opacity-60 disabled:cursor-not-allowed
                transition
              "
            >
              {loading ? "جارٍ تسجيل الدخول..." : "دخول"}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <Link
                to="/"
                className="hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                العودة للرئيسية
              </Link>
            </div>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
         هذه الصفحة فقط لمستخدمي الإدارة المصرح لهم.
        </p>
      </div>
    </div>
  );
}


