// src/components/DataTable.jsx
import React from 'react';

export default function DataTable({
  columns, rows, loading, page, limit, total,
  onPageChange, onSortChange, sortBy, sortDir,
  onSearch, searchPlaceholder = 'ابحث...',
}) {
  const [q, setQ] = React.useState('');
  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 items-center justify-between mb-3">
        <input
          className="input w-64"
          placeholder={searchPlaceholder}
          value={q}
          onChange={e=>setQ(e.target.value)}
          onKeyDown={e=> e.key==='Enter' && onSearch?.(q)}
        />
        <div className="text-sm text-slate-500">
          {total ? `إجمالي: ${total}` : ''}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-[700px] w-full">
          <thead className="bg-slate-50 dark:bg-slate-900/30">
            <tr>
              {columns.map(col=>(
                <th key={col.key} className="text-right px-3 py-2 whitespace-nowrap">
                  <button
                    className="hover:underline"
                    onClick={()=> onSortChange?.(col.key, sortBy===col.key && sortDir==='asc' ? 'desc' : 'asc')}
                    title="فرز"
                  >
                    {col.header}{sortBy===col.key ? (sortDir==='asc' ? ' ▲' : ' ▼') : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={columns.length} className="p-4">جارِ التحميل…</td></tr>
            ) : rows.length ? rows.map((r, idx)=>(
              <tr key={r.id || idx} className="hover:bg-slate-50/60">
                {columns.map(col=>(
                  <td key={col.key} className="px-3 py-2 align-top">
                    {col.render ? col.render(r) : r[col.key]}
                  </td>
                ))}
              </tr>
            )) : (
              <tr><td colSpan={columns.length} className="p-4 text-slate-500">لا توجد بيانات.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(total > limit) && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <button className="btn btn-outline" onClick={()=> onPageChange?.(Math.max(1, page-1))} disabled={page<=1}>السابق</button>
          <div className="text-sm">صفحة {page} من {Math.ceil(total/limit)}</div>
          <button className="btn btn-outline" onClick={()=> onPageChange?.(page+1)} disabled={(page*limit)>=total}>التالي</button>
        </div>
      )}
    </div>
  );
}
