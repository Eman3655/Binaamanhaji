import React from 'react';

export default function ResourceCard({ item, onOpen, compact = false }) {
  const [open, setOpen] = React.useState(false);

  const isPdf =
    (item.mime_type || '').includes('pdf') ||
    String(item.url || '').toLowerCase().endsWith('.pdf');

  const domain = (() => {
    try {
      return item.url ? new URL(item.url).hostname.replace('www.', '') : '';
    } catch {
      return '';
    }
  })();

  const icon = isPdf ? 'PDF' : '🔗';

  const glow =
    `transition-all duration-300 
     hover:border-emerald-300/70 dark:hover:border-emerald-300/45
     hover:shadow-[0_0_0_3px_rgba(110,231,183,0.18),0_16px_50px_rgba(0,0,0,0.18)]
     dark:hover:shadow-[0_0_0_3px_rgba(110,231,183,0.12),0_16px_50px_rgba(0,0,0,0.45)]
     hover:-translate-y-0.5`;

  const glowActive = open
    ? `border-emerald-300/70 dark:border-emerald-300/45
       shadow-[0_0_0_3px_rgba(110,231,183,0.18),0_16px_50px_rgba(0,0,0,0.18)]
       dark:shadow-[0_0_0_3px_rgba(110,231,183,0.12),0_16px_50px_rgba(0,0,0,0.45)]`
    : '';

  if (!compact) {
    const h = open ? 'h-[260px]' : 'h-[150px]';
    return (
      <div
        className={`rounded-2xl border border-slate-200 dark:border-slate-800
        bg-white/70 dark:bg-slate-900/50 overflow-hidden ${glow} ${glowActive} ${h}`}
      >
        <div className="p-3 grid grid-rows-[auto,1fr,auto] gap-2 h-full">
          <div className="flex items-start gap-3">
            <div
              className={`size-10 shrink-0 rounded-xl grid place-items-center ${
                isPdf ? 'bg-red-50 text-red-600' : 'bg-sky-50 text-sky-600'
              } dark:bg-slate-800`}
            >
              {icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold leading-snug line-clamp-2 text-slate-800 dark:text-slate-100" title={item.title}>
                {item.title}
              </div>
              <div
                className="mt-1 text-xs text-slate-500 cursor-pointer select-none"
                role="button"
                tabIndex={0}
                aria-expanded={open}
                onClick={() => setOpen(v => !v)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(v => !v); }}
              >
                {open ? 'أقل' : 'التفاصيل'}
              </div>
            </div>
          </div>

          {open && (
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {item.description && <div className="line-clamp-4">{item.description}</div>}
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {item.mime_type && <span className="badge">{item.mime_type}</span>}
                {item.type && <span className="badge">{item.type}</span>}
                {domain && <span className="badge">{domain}</span>}
              </div>
            </div>
          )}

          <div className="mt-auto grid grid-cols-2 gap-2">
            <button onClick={() => onOpen(item)} className="btn-primary h-9">معاينة</button>
            <a href={item.url} target="_blank" rel="noreferrer" className="btn-outline h-9 grid place-items-center">فتح</a>
          </div>
        </div>
      </div>
    );
  }

  const h = open ? 'h-[140px]' : 'h-[90px]';
  return (
    <div
      className={`grid grid-cols-[auto,1fr,auto] items-start gap-3 px-3 py-2 rounded-xl
      border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60
      overflow-hidden ${glow} ${glowActive} ${h}`}
    >
      <div
        className={`size-10 shrink-0 rounded-xl grid place-items-center ${
          isPdf ? 'bg-red-50 text-red-600' : 'bg-sky-50 text-sky-600'
        } dark:bg-slate-800`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <div className="font-semibold leading-snug truncate text-slate-800 dark:text-slate-100" title={item.title}>
          {item.title}
        </div>
        <div
          className="mt-0.5 text-xs text-slate-500 cursor-pointer select-none"
          role="button"
          tabIndex={0}
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(v => !v); }}
        >
          {open ? 'أقل' : 'التفاصيل'}
        </div>

        {open && (
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {item.description && <div className="line-clamp-2">{item.description}</div>}
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
              {item.type && <span className="badge">{item.type}</span>}
              {item.mime_type && <span className="badge">{item.mime_type}</span>}
              {domain && <span className="badge">{domain}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 self-stretch justify-center">
        <button onClick={() => onOpen(item)} className="btn-primary px-3 py-1.5 text-sm">معاينة</button>
        <a href={item.url} target="_blank" rel="noreferrer" className="btn-outline px-3 py-1.5 text-center text-sm">فتح</a>
      </div>
    </div>
  );
}



