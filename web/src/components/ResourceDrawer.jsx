// src/components/ResourceDrawer.jsx
import React from 'react';
import TagInput from './TagInput.jsx';
import FileDropzone from './FileDropzone.jsx';

export default function ResourceDrawer({
  open, onClose, onSubmit, initial = {},
  materials = [], units = [], scope = {}, setScope,
  uploader,
}) {
  const [f, setF] = React.useState({
    title:'', type:'SUMMARY', description:'',
    file_url:'', external_url:'', mime:'', language:'', tags:[],
    ...initial
  });

  React.useEffect(()=>{ setF(s=>({ ...s, ...initial })); },[initial]);

  return (
    <div className={`fixed inset-0 z-40 ${open?'pointer-events-auto':'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity ${open?'opacity-100':'opacity-0'}`}
        onClick={onClose}
      />
      <div className={`absolute right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-slate-900 shadow-xl transition-transform ${open?'translate-x-0':'translate-x-full'}`}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-bold">مورد جديد</div>
          <button className="btn btn-ghost" onClick={onClose}>إغلاق</button>
        </div>

        <div className="p-4 grid gap-3">
          <input className="input" placeholder="العنوان *" value={f.title} onChange={e=>setF(s=>({...s,title:e.target.value}))}/>
          <select className="select" value={f.type} onChange={e=>setF(s=>({...s,type:e.target.value}))}>
            {['ORIGINAL','SUMMARY','TRANSCRIPT','NOTES','EXERCISES','SOLUTION','SLIDES','IMAGE','OTHER'].map(t=> <option key={t} value={t}>{t}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <select className="select" value={scope.material_id||''} onChange={e=> setScope(s=>({...s, material_id:e.target.value, unit_id:''}))}>
              <option value="">— اختر مادة —</option>
              {materials.map(m=> <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
            <select className="select" value={scope.unit_id||''} onChange={e=> setScope(s=>({...s, unit_id:e.target.value}))} disabled={!scope.material_id}>
              <option value="">— على مستوى المادة —</option>
              {units.map(u=> <option key={u.id} value={u.id}>حلقة #{u.order_index} — {u.title}</option>)}
            </select>
          </div>

          <textarea rows={3} className="input" placeholder="الوصف" value={f.description} onChange={e=>setF(s=>({...s,description:e.target.value}))}/>

          <FileDropzone
            uploader={uploader}
            onUploaded={(u)=> setF(s=>({...s, file_url:u.url, mime: u.mime || s.mime}))}
          />

          <input className="input" placeholder="File URL (اختياري)" value={f.file_url} onChange={e=>setF(s=>({...s,file_url:e.target.value}))}/>
          <input className="input" placeholder="External URL (اختياري)" value={f.external_url} onChange={e=>setF(s=>({...s,external_url:e.target.value}))}/>
          <input className="input" placeholder="MIME" value={f.mime} onChange={e=>setF(s=>({...s,mime:e.target.value}))}/>
          <input className="input" placeholder="اللغة" value={f.language} onChange={e=>setF(s=>({...s,language:e.target.value}))}/>

          <div>
            <div className="text-xs text-slate-500 mb-1">وسوم</div>
            <TagInput value={f.tags} onChange={(tags)=> setF(s=>({...s,tags}))}/>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              className="btn-primary"
              onClick={()=>{
                const payload = { ...f };
                const material_id = scope.unit_id ? null : (scope.material_id ? Number(scope.material_id) : null);
                const unit_id = scope.unit_id ? Number(scope.unit_id) : null;
                onSubmit?.({ ...payload, material_id, unit_id });
              }}
            >حفظ</button>
            <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
          </div>
        </div>
      </div>
    </div>
  );
}
