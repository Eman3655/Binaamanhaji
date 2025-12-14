import React from 'react';

export default function ResourceCard({ item, onOpen, compact = false }) {
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

  if (compact) {
    return (
<div className="grid grid-cols-[auto,1fr,auto] items-center gap-3 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 min-h-[90px]">

        <div
          className={`size-10 shrink-0 rounded-xl grid place-items-center ${
            isPdf ? 'bg-red-50 text-red-600' : 'bg-sky-50 text-sky-600'
          } dark:bg-slate-800`}
        >
          {icon}
        </div>

        <div className="min-w-0 grid grid-rows-[auto,1fr,auto]">
          <div className="font-semibold leading-snug truncate" title={item.title}>
            {item.title}
          </div>

          <div className="min-h-0">
            {item.description && (
              <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                {item.description}
              </div>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {item.type && <span className="badge">{item.type}</span>}
            {item.mime_type && <span className="badge">{item.mime_type}</span>}
            {domain && <span className="badge">{domain}</span>}
          </div>
        </div>

        <div className="flex flex-col gap-2 self-stretch justify-center">
          <button onClick={() => onOpen(item)} className="btn-primary px-3 py-1.5">
            معاينة
          </button>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="btn-outline px-3 py-1.5 text-center"
          >
            فتح
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="card rounded-2xl border border-slate-200 dark:border-slate-800 p-4 grid grid-rows-[auto,1fr,auto] min-h-[260px]">
      <div className="flex items-start gap-3">
        <div
          className={`size-10 rounded-xl grid place-items-center ${
            isPdf ? 'bg-red-50 text-red-600' : 'bg-sky-50 text-sky-600'
          } dark:bg-slate-800`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold leading-snug line-clamp-2" title={item.title}>
            {item.title}
          </div>
        </div>
      </div>

      <div className="mt-1 min-h-0">
        {item.description && (
          <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
            {item.description}
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {item.mime_type && <span className="badge">{item.mime_type}</span>}
          {item.type && <span className="badge">{item.type}</span>}
          {domain && <span className="badge">{domain}</span>}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={() => onOpen(item)} className="btn-primary h-10">
          معاينة
        </button>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="btn-outline h-10 grid place-items-center"
        >
          فتح
        </a>
      </div>
    </div>
  );
}



