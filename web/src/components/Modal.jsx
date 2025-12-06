import React from 'react'

export default function Modal({ open, onClose, children, title }){
  if(!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-4 md:p-8" onClick={onClose}>
      <div className="card max-w-4xl mx-auto p-0 overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-4">
          <div className="font-bold">{title}</div>
          <button onClick={onClose} className="btn-ghost">إغلاق</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
