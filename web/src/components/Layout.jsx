// src/layouts/Layout.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import logo from '../assets/logo2.png'; 

const API = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

function IconSun({ className = "w-5 h-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
function IconMoon({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="white" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79Z" />
    </svg>
  );
}

export default function Layout({ children }) {
  const { pathname } = useLocation();

  const [open, setOpen] = React.useState(false);
  const [dark, setDark] = React.useState(() =>
    document.documentElement.classList.contains("dark")
  );

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.theme = dark ? "dark" : "light";
  }, [dark]);

  const isActive = (to) => {
    if (to === "/") return pathname === "/";
    return pathname === to || pathname.startsWith(`${to}/`);
  };

  const NavLink = ({ to, children: label }) => {
    const active = isActive(to);

    return (
      <Link
        to={to}
        onClick={() => setOpen(false)}
        className={[
          "relative flex items-center gap-2 px-3 py-2 transition",
          "text-slate-300 hover:text-white",

          active
            ? "text-emerald-300"
            : "",
        ].join(" ")}
        aria-current={active ? "page" : undefined}
      >
        {label}

        <span
          aria-hidden="true"
          className={[
            "pointer-events-none absolute left-3 right-3 -bottom-[2px] h-[2px] rounded-full",
            "transition-opacity duration-200",
            active
              ? "opacity-100 bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.85)]"
              : "opacity-0",
          ].join(" ")}
        />
      </Link>
    );
  };


  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header
        className="
          sticky top-0 z-30 isolate
          bg-[#0b0b14] dark:bg-[#0b0b14]
          text-white border-b border-white/10
          backdrop-blur supports-[backdrop-filter]:bg-[#0b0b14]
        "
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="md:hidden rounded-xl p-2 ring-1 ring-white/10 bg-white/[0.06] hover:bg-white/[0.12]"
              aria-label="فتح القائمة"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" className="text-slate-200">
                <path fill="currentColor" d="M4 18h16v-2H4zm0-5h16v-2H4zm0-7v2h16V6z" />
              </svg>
            </button>

            <Link to="/" className="flex items-center gap-2">
            <img
                src={logo}
                alt="Logo"
                className="w-10 h-auto"
              />
              <div className="text-lg font-semibold tracking-tight text-white">
                مكتبة العطاء
              </div>
            </Link>
            

            <nav className="ml-auto hidden md:flex items-center gap-2" aria-label="التنقل الرئيسي">
              <NavLink to="/">الرئيسية</NavLink>
              <NavLink to="/browse">تصفّح</NavLink>
              <NavLink to="/admin">الإدارة</NavLink>

              <button
                onClick={() => setDark((d) => !d)}
                className="size-9 rounded-full bg-black ring-1 ring-white/15 flex items-center justify-center hover:bg-black/90 transition"
                aria-label="تبديل النمط"
                title="تبديل الثيم"
              >
                {dark ? <IconSun /> : <IconMoon />}
              </button>
            </nav>
          </div>
        </div>
      </header>

      
      <div

        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden ${
          open ? "block" : "hidden"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      >
        
        <aside
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-[#0b0b14] text-white p-4 border-l border-white/10"
          role="dialog"
          aria-label="القائمة الجانبية"
          
          
        >
          <div className="flex items-center justify-between">
            <div className="font-extrabold text-lg">القائمة</div>
            <button
              className="rounded-xl px-3 py-2 ring-1 ring-white/10 bg-white/[0.06] hover:bg-white/[0.12]"
              onClick={() => setOpen(false)}
              aria-label="إغلاق القائمة"
            >
              إغلاق
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-1">
            <NavLink to="/">الرئيسية</NavLink>
            <NavLink to="/browse">تصفّح</NavLink>
            <NavLink to="/admin">الإدارة</NavLink>
            <button
              onClick={() => setDark((d) => !d)}
              className="mt-3 size-10 rounded-full bg-black ring-1 ring-white/15 flex items-center justify-center hover:bg-black/90 transition"
              aria-label="تبديل النمط"
              title="تبديل الثيم"
            >
              {dark ? <IconSun /> : <IconMoon />}
            </button>
          </div>
        </aside>
        
      </div>

      <main className="py-0">
        {pathname === "/" ? (
          children
        ) : (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">{children}</div>
        )}
      </main>

      <footer className="mt-10 border-t border-[var(--border)]" />
    </div>
  );
}



