import React from 'react';

export default function SidePanel({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close overlay"
      />
      <div className="absolute inset-y-0 end-0 w-full max-w-3xl bg-white dark:bg-slate-900 shadow-2xl grid grid-rows-[auto,1fr]">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-4">
          <div className="font-bold text-base md:text-lg truncate">{title}</div>
          <button onClick={onClose} className="btn-ghost text-sm">إغلاق</button>
        </div>
        <div className="p-4 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
