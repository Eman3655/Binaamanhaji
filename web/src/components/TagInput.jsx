// src/components/TagInput.jsx
import React from 'react';

export default function TagInput({ value = [], onChange, placeholder='أضف وسمًا…' }) {
  const [text, setText] = React.useState('');
  function add(t){ const v=t.trim(); if(!v) return; if(value.includes(v)) return; onChange?.([...value, v]); setText(''); }
  function del(t){ onChange?.(value.filter(x=>x!==t)); }
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 flex flex-wrap gap-2">
      {value.map(t=>(
        <span key={t} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
          {t}
          <button className="ml-1 text-slate-500 hover:text-red-600" onClick={()=>del(t)}>×</button>
        </span>
      ))}
      <input
        className="input flex-1 min-w-[160px]"
        placeholder={placeholder}
        value={text}
        onChange={e=>setText(e.target.value)}
        onKeyDown={e=>{
          if (e.key===',' || e.key==='Enter') { e.preventDefault(); add(text); }
          if (e.key==='Backspace' && !text && value.length) del(value[value.length-1]);
        }}
        onBlur={()=> add(text)}
      />
    </div>
  );
}
