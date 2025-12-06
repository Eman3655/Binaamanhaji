import React from 'react'

export default function ResourceCard({ item, onOpen }){
  const isPdf = (item.mime_type||'').includes('pdf') || String(item.url||'').toLowerCase().endsWith('.pdf')
  return (
    <div className="card p-4 flex flex-col">
      <div className="flex items-start gap-3">
        <div className={`size-10 rounded-xl grid place-items-center ${isPdf?'bg-red-50 text-red-600':'bg-sky-50 text-sky-600'} dark:bg-slate-800`}>
          {isPdf ? 'PDF' : '🔗'}
        </div>
        <div className="flex-1">
          <div className="font-bold leading-snug">{item.title}</div>
          {item.description && <div className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{item.description}</div>}
          {item.mime_type && <div className="mt-2 badge">{item.mime_type}</div>}
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={()=>onOpen(item)} className="btn-primary flex-1">عرض</button>
        <a href={item.url} target="_blank" rel="noreferrer" className="btn-outline flex-1">فتح</a>
      </div>
    </div>
  )
}
