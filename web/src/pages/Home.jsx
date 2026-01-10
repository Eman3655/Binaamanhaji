// src/pages/Home.jsx
import { useEffect, useRef, useLayoutEffect, useState } from "react";
import { ArrowRight, FolderOpen, ShieldCheck, Search, Layers, BookOpen, FileText } from "lucide-react";
import heroImg from "../assets/background.jpg";

const copy = {
  hero: {
    titleTop: "مكتبة البناء المنهجي",
    titleAccent: "دفعة العطاء — الدفعة الثالثة",
    sub: "منصة تجمع ملفات الدروس والمقررات والملخصات من مصادرها الموثوقة، توحّد الإصدارات، وتنظمها لتسهيل الوصول السريع والدقيق.",
    ctaPrimary: "استعرض المقررات",
    ctaSecondary: "ارفع / اقترح ملفًا",
  },
  grid: [
    { icon: FolderOpen, title: "جمع الملفات",      desc: "تجميع ملفات الطلاب في مكان واحد منظم." },
    { icon: Layers,     title: "توحيد الإصدارات",  desc: "نسخة مرجعية ثابتة لكل ملف/درس." },
    { icon: Search,     title: "وصول سريع",        desc: "بحث وفلترة ذكية بحسب العلم والمقرر." },
    { icon: BookOpen,   title: "هيكلة منهجية",     desc: "تقسيم حسب العلوم والمستويات والفصول." },
    { icon: ShieldCheck,title: "مساهمة في إثراء الأرشيف",      desc: "ساهم في إثراء الأرشيف المنهجي الموحّد." },
    { icon: FileText,   title: "ملخصات مركّزة",    desc: "تلخيصات ونقاط أساسية للرجوع السريع." },
  ],
  roadmap: {
    title: "كيف تستفيد بسرعة؟",
    steps: [
      { k: "1", t: "اختر العلم والمقرر",   d: "ابدأ من العلم أو المستوى المناسب لك." },
      { k: "2", t: "حمّل النسخة", d: "حمل النسخة المناسبة من المقررات." },
      { k: "3", t: "أضف ملفًا",    d: "ساهم في إثراء الأرشيف المنهجي الموحّد." },
    ],
    button: "انتقل إلى الأرشيف المنظَّم",
  },
};

function Feature({ icon: Icon, title, desc }) {
  return (
    <div
      className="
        group rounded-3xl p-5
        bg-white dark:bg-slate-900
        ring-1 ring-slate-200/70 dark:ring-slate-800
        transition-all duration-300 will-change-transform
        hover:-translate-y-0.5
        hover:ring-emerald-400/30
        hover:shadow-emerald-500/10 dark:hover:shadow-emerald-400/5
      "
    >
      <div className="size-11 rounded-2xl grid place-items-center bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200/80 dark:ring-slate-700">
      <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{desc}</p>
    </div>
  );
}


function HeroLanding() {
  return (
    <section
      className="
        relative overflow-hidden
        w-screen h-[100svh]
        ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]
      "
    >
      <img
        src={heroImg}
        alt="خلفية المنصة"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />

      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70" />

      <div className="relative z-10 h-full">
        <div className="h-full mx-auto max-w-7xl px-4 flex flex-col items-center justify-center text-center text-white">
          <div className="mb-5 flex flex-wrap justify-center gap-2">
            <span className="rounded-full px-3 py-1 text-xs font-medium bg-white/10 ring-1 ring-white/20 backdrop-blur">
              الدفعة الثالثة – دفعة العطاء
            </span>
            <span className="rounded-full px-3 py-1 text-xs font-medium bg-white/10 ring-1 ring-white/20 backdrop-blur">
              أرشيف موحّد وموثّق
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight drop-shadow-lg max-w-5xl">
            منصّة <span className="text-emerald-400">مكتبة العطاء</span> لتجميع ملفات الدراسة
          </h1>

          <p className="mt-5 text-lg md:text-xl text-white/95 max-w-3xl leading-relaxed">
            نجمع الدروس والمقرّرات والملخّصات من مصادرها الموثوقة، 
            ونوفّر بحثًا سريعًا حسب المستوى والعِلم والمقرّر — لتصل إلى النسخة الصحيحة في ثوانٍ.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="/browse"
              className="px-6 py-3 rounded-xl font-semibold text-white bg-emerald-500 hover:bg-emerald-400 shadow-[0_10px_30px_-12px_rgba(16,185,129,.45)] transition"
            >
              استعرض المقررات
            </a>
            <a
              href="/admin"
              className="px-6 py-3 rounded-xl font-semibold border border-white/40 bg-white/10 hover:bg-white/20 text-white transition"
            >
              ارفع المقررات
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] relative overflow-hidden">
      <HeroLanding />

      <section id="browse" className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {copy.grid.map((f, i) => {
            const Icon = f.icon;
            return <Feature key={i} icon={Icon} title={f.title} desc={f.desc} />;
          })}
        </div>
      </section>

<section className="mx-auto max-w-7xl px-4 pb-16">
  <div className="rounded-3xl px-6 py-8 md:px-10 md:py-12 ring-1 ring-slate-200/70 dark:ring-slate-800 bg-white dark:bg-slate-900">
    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
      {copy.roadmap.title}
    </h2>

    <div className="mt-6 grid md:grid-cols-3 gap-4">
      {copy.roadmap.steps.map((s, i) => (
        <div
          key={i}
          className="
            rounded-2xl p-5 
            bg-slate-50 dark:bg-slate-800 
            ring-1 ring-emerald-200/60 dark:ring-emerald-400/30 
            transition-all duration-300 hover:-translate-y-0.5 
            hover:shadow-lg hover:shadow-emerald-400/10
          "
        >
          <div className="flex items-start gap-3">
            <div
              className="
                size-9 rounded-xl grid place-items-center 
                bg-emerald-100 dark:bg-emerald-900/30 
                ring-1 ring-emerald-200 dark:ring-emerald-600 
                text-emerald-600 dark:text-emerald-400 font-extrabold
              "
            >
              {s.k}
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {s.t}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {s.d}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="mt-6">
      <a
        href="/browse"
        className="
          inline-flex items-center gap-2 
          rounded-xl px-5 py-3 font-medium text-white 
          bg-emerald-500 hover:bg-emerald-400 
          shadow-[0_10px_30px_-12px_rgba(16,185,129,.45)] transition
        "
      >
        {copy.roadmap.button} <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  </div>
</section>


      <footer className="mx-auto max-w-7xl px-4 pb-10 text-sm text-slate-600 dark:text-slate-400 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6">
        <span>© {new Date().getFullYear()} مكتبة العطاء</span>
        <div className="flex gap-4">
          <a className="hover:text-sky-600 dark:hover:text-sky-400">
            الخصوصية
          </a>
          <a className="hover:text-sky-600 dark:hover:text-sky-400">
            الشروط
          </a>
        </div>
      </footer>
    </main>
  );
}


