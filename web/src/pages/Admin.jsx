import React from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

async function j(url, o = {}) {
  const res = await fetch(url, {
    ...o,
    headers: { 'Content-Type': 'application/json', ...(o.headers || {}) },
    credentials: 'include',
  });
  const txt = await res.text().catch(() => '');
  let data = null;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  if (!res.ok) throw new Error((data && (data.error || data.message)) || `HTTP ${res.status}`);
  return data;
}

async function uploadToCloudinary(file) {
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD;
  const preset = import.meta.env.VITE_CLOUDINARY_PRESET;
  if (!cloud || !preset) throw new Error('Cloudinary env missing');
  const url = `https://api.cloudinary.com/v1_1/${cloud}/auto/upload`;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', preset);
  const res = await fetch(url, { method: 'POST', body: fd });
  const jx = await res.json();
  if (!res.ok) throw new Error(jx?.error?.message || 'Upload failed');
  return {
    url: jx.secure_url,
    mime: file.type || (jx.format ? `application/${jx.format}` : ''),
    size: jx.bytes || file.size || null,
  };
}

function useToasts() {
  const [items, setItems] = React.useState([]);
  function push(msg, type = 'info') {
    const id = Math.random().toString(36).slice(2);
    setItems(s => [...s, { id, msg, type }]);
    setTimeout(() => setItems(s => s.filter(i => i.id !== id)), 3000);
  }
  return {
    Toasts: () => (
      <div className="fixed bottom-4 right-4 grid gap-2 z-50" dir="rtl">
        {items.map(t => (
          <div key={t.id} className={`px-3 py-2 rounded-lg shadow text-sm text-white
            ${t.type === 'ok' ? 'bg-emerald-600' :
              t.type === 'warn' ? 'bg-amber-600' :
              t.type === 'err' ? 'bg-rose-600' : 'bg-slate-800'}`}>
            {t.msg}
          </div>
        ))}
      </div>
    ),
    push,
  };
}

function Btn({ children, variant='primary', className='', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm transition';
  const styles = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800',
    outline: 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50/60',
    ghost: 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  };
  return <button className={`${base} ${styles[variant]||''} ${className}`} {...props}>{children}</button>;
}
function Input(props) { return <input {...props} className={`w-full rounded-lg border px-3 py-2 bg-white dark:bg-slate-900 ${props.className||''}`} />; }
function Select(props) { return <select {...props} className={`w-full rounded-lg border px-3 py-2 bg-white dark:bg-slate-900 ${props.className||''}`} />; }
function Textarea(props) { return <textarea {...props} className={`w-full rounded-lg border px-3 py-2 bg-white dark:bg-slate-900 ${props.className||''}`} />; }

function DataTable({ columns, rows, loading }) {
  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-[720px] w-full">
          <thead className="bg-slate-50 dark:bg-slate-900/30">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="text-right px-3 py-2 whitespace-nowrap">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={columns.length} className="p-4">جارِ التحميل…</td></tr>
            ) : rows.length ? (
              rows.map((r, idx) => (
                <tr key={r.id || idx} className="hover:bg-slate-50/60">
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-2 align-top">
                      {col.render ? col.render(r) : r[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr><td colSpan={columns.length} className="p-4 text-slate-500">لا توجد بيانات.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TagInput({ value = [], onChange, placeholder = 'أضف وسمًا…' }) {
  const [text, setText] = React.useState('');
  function add(t) {
    const v = t.trim();
    if (!v) return;
    if (value.includes(v)) return;
    onChange?.([...value, v]);
    setText('');
  }
  function del(t) { onChange?.(value.filter((x) => x !== t)); }
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 flex flex-wrap gap-2">
      {value.map((t) => (
        <span key={t} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
          {t}
          <button className="ml-1 text-slate-500 hover:text-red-600" onClick={() => del(t)} type="button">×</button>
        </span>
      ))}
      <input
        className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-slate-900 flex-1 min-w-[160px]"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === ',' || e.key === 'Enter') { e.preventDefault(); add(text); }
          if (e.key === 'Backspace' && !text && value.length) { del(value[value.length - 1]); }
        }}
        onBlur={() => add(text)}
      />
    </div>
  );
}

function FileDropzone({ onUploaded, uploader }) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  async function handleFiles(fs) {
    if (!fs || !fs.length) return;
    setErr('');
    setBusy(true);
    try {
      const f = fs[0];
      const res = await uploader?.(f);
      if (res?.url) onUploaded?.(res);
    } catch (e) {
      setErr(e?.message || 'فشل الرفع');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-4 text-center ${busy ? 'opacity-60' : ''}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="mb-2">اسحب ملفًا هنا أو اختر يدويًا</div>
      <label className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm border cursor-pointer">
        اختيار ملف
        <input
          hidden
          type="file"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>
      {err && <div className="text-red-600 mt-2 text-sm">{err}</div>}
    </div>
  );
}


function ResourceDrawer({
  open,
  onClose,
  onSubmit,
  initial,
  subjects = [],
  scope = {},
  setScope,
  uploader,
  // جديد:
  filters,
  reloadFilters,
}) {
  const [f, setF] = React.useState({
    title: '',
    type: 'SUMMARY',
    description: '',
    file_url: '',
    external_url: '',
    mime: '',
    language: '',
    tags: [],
    ...(initial || {}),
  });

  const [pick, setPick] = React.useState({
    level_id: '',
    stage_id: '',
    science_id: '',
    subject_id: '',
  });

  const [subjectOptions, setSubjectOptions] = React.useState([]);
  const [subjLoading, setSubjLoading] = React.useState(false);

  React.useEffect(() => { if (initial) setF((s) => ({ ...s, ...initial })); }, [initial]);

  React.useEffect(() => {
    if (open) {
      const init = {
        level_id: scope.level_id || '',
        stage_id: scope.stage_id || '',
        science_id: scope.science_id || '',
        subject_id: scope.subject_id || '',
      };
      setPick(init);
    }
  }, [open, scope.level_id, scope.stage_id, scope.science_id, scope.subject_id]);

  React.useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const loadSubjectsByFilters = React.useCallback(async (p) => {
    const params = new URLSearchParams();
    if (p.level_id)   params.set('level_id', p.level_id);
    if (p.stage_id)   params.set('stage_id', p.stage_id);
    if (p.science_id) params.set('science_id', p.science_id);

    setSubjLoading(true);
    try {
      const rows = await j(`${API}/public/subjects-by-filters?${params.toString()}`);
      setSubjectOptions(rows || []);
    } catch (e) {
      console.error(e);
      setSubjectOptions([]);
    } finally {
      setSubjLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSubjectsByFilters(pick);
  }, [pick.level_id, pick.stage_id, pick.science_id, loadSubjectsByFilters]);

  const levels   = filters?.levels   || [];
  const stages   = filters?.stages   || [];
  const sciences = filters?.sciences || [];

  const RESOURCE_TYPES = [
    'ORIGINAL',
    'SUMMARY',
    'TRANSCRIPT',
    'TABLE',
    'TREE',
    'COURSE_LINK',
    'AUDIO',
    'SLIDES',
    'IMAGE',
    'EXERCISES',
    'SOLUTION',
    'NOTES',
    'OTHER',
  ];

  return (
    <div className={`fixed inset-0 z-40 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-slate-900 shadow-xl
                    transition-transform ${open ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
        dir="rtl"
        role="dialog"
        aria-label="مورد جديد"
      >
        <div className="flex-none p-4 border-b flex items-center justify-between">
          <div className="font-bold">{initial ? 'تحرير مورد' : 'مورد جديد'}</div>
          <Btn variant="ghost" onClick={onClose}>إغلاق</Btn>
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid gap-3" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
          <Input placeholder="العنوان *" value={f.title} onChange={(e) => setF((s) => ({ ...s, title: e.target.value }))} />

          <Select value={f.type} onChange={(e) => setF((s) => ({ ...s, type: e.target.value }))}>
            {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>

          <div className="grid gap-2 md:grid-cols-3">
            <Select
              value={pick.level_id}
              onChange={(e) => setPick((s) => ({ ...s, level_id: e.target.value, stage_id: '', subject_id: '' }))}
            >
              <option value="">— اختر مستوى —</option>
              {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>

            <Select
              value={pick.stage_id}
              onChange={(e) => setPick((s) => ({ ...s, stage_id: e.target.value, subject_id: '' }))}
              disabled={!pick.level_id}
            >
              <option value="">— اختر مرحلة —</option>
              {stages
                .filter(st => !pick.level_id || st.level_id === Number(pick.level_id))
                .map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
            </Select>

            <Select
              value={pick.science_id}
              onChange={(e) => setPick((s) => ({ ...s, science_id: e.target.value, subject_id: '' }))}
            >
              <option value="">— اختر علم —</option>
              {sciences.map((sc) => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
            </Select>
          </div>

          <Select
            value={pick.subject_id}
            onChange={(e) => setPick((s) => ({ ...s, subject_id: e.target.value }))}
          >
            <option value="">{subjLoading ? '…جارِ التحميل' : '— اختر مقرر —'}</option>
            {subjectOptions.map((su) => (
              <option key={su.id} value={su.id}>{su.name}</option>
            ))}
          </Select>

          <Textarea rows={3} placeholder="الوصف" value={f.description} onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))} />

          <FileDropzone
            uploader={uploader}
            onUploaded={(u) => setF((s) => ({ ...s, file_url: u.url, mime: u.mime || s.mime }))}
          />

          <Input placeholder="File URL (اختياري)" value={f.file_url} onChange={(e) => setF((s) => ({ ...s, file_url: e.target.value }))} />
          <Input placeholder="External URL (اختياري)" value={f.external_url} onChange={(e) => setF((s) => ({ ...s, external_url: e.target.value }))} />
          <Input placeholder="MIME" value={f.mime} onChange={(e) => setF((s) => ({ ...s, mime: e.target.value }))} />
          <Input placeholder="اللغة" value={f.language} onChange={(e) => setF((s) => ({ ...s, language: e.target.value }))} />

          <div>
            <div className="text-xs text-slate-500 mb-1">وسوم</div>
            <TagInput value={f.tags} onChange={(tags) => setF((s) => ({ ...s, tags }))} />
          </div>
        </div>

        <div className="flex-none p-4 border-t flex gap-2">
          <Btn
            onClick={() => {
              if (!f.title) return alert('العنوان مطلوب');
              if (!pick.subject_id) return alert('اختر مقررًا');
              const payload = { ...f, subject_id: Number(pick.subject_id) };
              onSubmit?.(payload);
            }}
          >حفظ</Btn>
          <Btn variant="ghost" onClick={onClose}>إلغاء</Btn>
        </div>
      </div>
    </div>
  );
}

function StructurePanel({ toast, onChanged }) {
  const [tab, setTab] = React.useState('levels');
  const [levels, setLevels] = React.useState([]);
  const [stages, setStages] = React.useState([]);
  const [sciences, setSciences] = React.useState([]);
  const [subjects, setSubjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  const [levelName, setLevelName] = React.useState('');
  const [stageName, setStageName] = React.useState('');
  const [stageLevelId, setStageLevelId] = React.useState('');
  const [scienceName, setScienceName] = React.useState('');
  const [subjectName, setSubjectName] = React.useState('');
  const [subjectLevelId, setSubjectLevelId] = React.useState('');
  const [subjectStageId, setSubjectStageId] = React.useState('');
  const [subjectScienceId, setSubjectScienceId] = React.useState('');

  const reload = React.useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const [lv, st, sc, su] = await Promise.all([
        j(`${API}/admin/levels`),
        j(`${API}/admin/stages`),
        j(`${API}/admin/sciences`),
        j(`${API}/admin/subjects`),
      ]);
      setLevels(Array.isArray(lv) ? lv : []);
      setStages(Array.isArray(st) ? st : []);
      setSciences(Array.isArray(sc) ? sc : []);
      setSubjects(Array.isArray(su) ? su : []);
    } catch (e) {
      console.error(e);
      setErr('تعذّر تحميل بيانات الهيكلة');
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { reload(); }, [reload]);

  async function addLevel() {
    if (!levelName.trim()) return;
    try {
      await j(`${API}/admin/levels`, { method: 'POST', body: JSON.stringify({ name: levelName.trim() }) });
      setLevelName(''); toast('تمت إضافة المستوى', 'ok'); reload(); onChanged?.();
    } catch (e) { toast(e.message || 'فشل إضافة المستوى', 'err'); }
  }
  async function deleteLevel(id) {
    if (!window.confirm('حذف هذا المستوى؟ قد يسبّب مشاكل في البيانات.')) return;
    try { await j(`${API}/admin/levels/${id}`, { method: 'DELETE' }); toast('تم الحذف', 'ok'); reload(); onChanged?.(); }
    catch (e) { toast(e.message || 'فشل حذف المستوى', 'err'); }
  }

  async function addStage() {
    const lid = Number(subjectLevelId || stageLevelId || 0);
    if (!stageName.trim() || !lid) return;
    try {
      await j(`${API}/admin/stages`, { method: 'POST', body: JSON.stringify({ level_id: lid, name: stageName.trim() }) });
      setStageName(''); toast('تمت إضافة المرحلة', 'ok'); reload(); onChanged?.();
    } catch (e) { toast(e.message || 'فشل إضافة المرحلة', 'err'); }
  }
  async function deleteStage(id) {
    if (!window.confirm('حذف هذه المرحلة؟')) return;
    try { await j(`${API}/admin/stages/${id}`, { method: 'DELETE' }); toast('تم الحذف', 'ok'); reload(); onChanged?.(); }
    catch (e) { toast(e.message || 'فشل حذف المرحلة', 'err'); }
  }

  async function addScience() {
    if (!scienceName.trim()) return;
    try {
      await j(`${API}/admin/sciences`, { method: 'POST', body: JSON.stringify({ name: scienceName.trim() }) });
      setScienceName(''); toast('تمت إضافة العلم', 'ok'); reload(); onChanged?.();
    } catch (e) { toast(e.message || 'فشل إضافة العلم', 'err'); }
  }
  async function deleteScience(id) {
    if (!window.confirm('حذف هذا العلم؟')) return;
    try { await j(`${API}/admin/sciences/${id}`, { method: 'DELETE' }); toast('تم الحذف', 'ok'); reload(); onChanged?.(); }
    catch (e) { toast(e.message || 'فشل حذف العلم', 'err'); }
  }

  async function addSubject() {
    if (!subjectName.trim()) return;
    const payload = {
      name: subjectName.trim(),
      level_id: subjectLevelId ? Number(subjectLevelId) : null,
      stage_id: subjectStageId ? Number(subjectStageId) : null,
      science_ids: subjectScienceId ? [Number(subjectScienceId)] : [],
    };
    try {
      await j(`${API}/admin/subjects`, { method: 'POST', body: JSON.stringify(payload) });
      setSubjectName('');
      toast('تمت إضافة المقرر', 'ok'); reload(); onChanged?.();
    } catch (e) { toast(e.message || 'فشل إضافة المقرر', 'err'); }
  }
  async function deleteSubject(id) {
    if (!window.confirm('حذف هذا المقرر؟')) return;
    try { await j(`${API}/admin/subjects/${id}`, { method: 'DELETE' }); toast('تم الحذف', 'ok'); reload(); onChanged?.(); }
    catch (e) { toast(e.message || 'فشل حذف المقرر', 'err'); }
  }

  return (
    <section className="rounded-2xl border p-4 bg-white dark:bg-slate-950">
      <div className="flex items-center justify-between mb-4">
        <div className="font-bold">هيكلة المنهج</div>
        {loading && <span className="text-xs text-slate-500">جارِ التحميل…</span>}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['levels','stages','sciences','subjects'].map(key => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-full text-sm ${
              tab === key ? 'bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700'
            }`}
          >
            {key === 'levels' ? 'المستويات' :
             key === 'stages' ? 'المراحل' :
             key === 'sciences' ? 'العلوم' : 'المقررات'}
          </button>
        ))}
      </div>

      {err && <div className="mb-3 text-xs text-red-600">{err}</div>}

      {tab === 'levels' && (
        <div className="grid gap-3">
          <div className="flex gap-2">
            <Input placeholder="اسم المستوى" value={levelName} onChange={(e) => setLevelName(e.target.value)} className="flex-1" />
            <Btn onClick={addLevel}>+ إضافة</Btn>
          </div>
          <ul className="space-y-1 text-sm">
            {levels.map((l) => (
              <li key={l.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 rounded-lg px-3 py-1.5">
                <span>{l.name} <span className="text-xs text-slate-500">(#{l.id})</span></span>
                <Btn variant="outline" className="!px-2 !py-1" onClick={() => deleteLevel(l.id)}>حذف</Btn>
              </li>
            ))}
            {!levels.length && !loading && <li className="text-xs text-slate-500">لا توجد مستويات بعد.</li>}
          </ul>
        </div>
      )}

      {tab === 'stages' && (
        <div className="grid gap-3">
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr),200px,auto]">
            <Input placeholder="اسم المرحلة" value={stageName} onChange={(e) => setStageName(e.target.value)} />
            <Select value={stageLevelId} onChange={(e) => setStageLevelId(e.target.value)}>
              <option value="">اختر مستوى</option>
              {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
            <Btn onClick={addStage}>+ إضافة</Btn>
          </div>
          <ul className="space-y-1 text-sm">
            {stages.map((st) => (
              <li key={st.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 rounded-lg px-3 py-1.5">
                <span>{st.name} <span className="text-xs text-slate-500">
                  (مستوى: {(levels.find((l) => l.id === st.level_id)?.name) ?? st.level_id})
                </span></span>
                <Btn variant="outline" className="!px-2 !py-1" onClick={() => deleteStage(st.id)}>حذف</Btn>
              </li>
            ))}
            {!stages.length && !loading && <li className="text-xs text-slate-500">لا توجد مراحل بعد.</li>}
          </ul>
        </div>
      )}

      {tab === 'sciences' && (
        <div className="grid gap-3">
          <div className="flex gap-2">
            <Input placeholder="اسم العلم" value={scienceName} onChange={(e) => setScienceName(e.target.value)} className="flex-1" />
            <Btn onClick={addScience}>+ إضافة</Btn>
          </div>
          <ul className="space-y-1 text-sm">
            {sciences.map((sc) => (
              <li key={sc.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 rounded-lg px-3 py-1.5">
                <span>{sc.name} <span className="text-xs text-slate-500">(#{sc.id})</span></span>
                <Btn variant="outline" className="!px-2 !py-1" onClick={() => deleteScience(sc.id)}>حذف</Btn>
              </li>
            ))}
            {!sciences.length && !loading && <li className="text-xs text-slate-500">لا توجد علوم بعد.</li>}
          </ul>
        </div>
      )}

      {tab === 'subjects' && (
        <div className="grid gap-3">
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr),200px,200px,200px,auto]">
            <Input placeholder="اسم المقرر" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
            <Select value={subjectLevelId} onChange={(e) => setSubjectLevelId(e.target.value)}>
              <option value="">مستوى (اختياري)</option>
              {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
            <Select value={subjectStageId} onChange={(e) => setSubjectStageId(e.target.value)}>
              <option value="">مرحلة (اختياري)</option>
              {stages
                .filter(st => !subjectLevelId || st.level_id === Number(subjectLevelId))
                .map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
            </Select>
            <Select value={subjectScienceId} onChange={(e) => setSubjectScienceId(e.target.value)}>
              <option value="">علم (اختياري)</option>
              {sciences.map((sc) => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
            </Select>
            <Btn onClick={addSubject}>+ إضافة</Btn>
          </div>

          <ul className="space-y-1 text-sm">
            {subjects.map((su) => (
              <li key={su.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 rounded-lg px-3 py-1.5">
                <span>
                  {su.name}{' '}
                  <span className="text-xs text-slate-500">
                    (مستوى: {((levels.find(l=>l.id===su.level_id)?.name) ?? su.level_id) || '—'},
                     مرحلة: {((stages.find(st=>st.id===su.stage_id)?.name) ?? su.stage_id) || '—'})
                  </span>
                </span>
                <Btn variant="outline" className="!px-2 !py-1" onClick={() => deleteSubject(su.id)}>حذف</Btn>
              </li>
            ))}
            {!subjects.length && !loading && <li className="text-xs text-slate-500">لا توجد مقررات بعد.</li>}
          </ul>
        </div>
      )}
    </section>
  );
}

function ResourcesPanel({ scope, subjects, toast, filters, reloadFilters }) {
  const [state, setState] = React.useState({ rows: [], loading: true, q: '' });
  const [open, setOpen] = React.useState(false);

  const [drawerScope, setDrawerScope] = React.useState({ subject_id: '' });

  React.useEffect(() => {
    if (open) setDrawerScope({ subject_id: scope.subject_id || '' });
  }, [open, scope.subject_id]);

  const filteredSubjects = React.useMemo(() => {
    return subjects.filter(su =>
      (!scope.level_id  || su.level_id  === Number(scope.level_id)) &&
      (!scope.stage_id  || su.stage_id  === Number(scope.stage_id)) &&
      (!scope.science_id|| (su.science_ids ? su.science_ids.includes(Number(scope.science_id)) : su.science_id === Number(scope.science_id)))
    );
  }, [subjects, scope.level_id, scope.stage_id, scope.science_id]);

  async function load() {
    setState(s => ({ ...s, loading: true }));
    const qs = new URLSearchParams();
    if (scope.subject_id) qs.set('subject_id', scope.subject_id);
    if (state.q) qs.set('q', state.q);
    const d = await j(`${API}/admin/resources?${qs.toString()}`);
    const rows = d.rows || d.items || d || [];
    setState({ rows, loading: false, q: state.q });
  }

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, [scope.subject_id]);

  const cols = [
    { key: 'title', header: 'العنوان' },
    { key: 'type', header: 'النوع' },
    { key: 'mime', header: 'MIME' },
    {
      key: 'created_at',
      header: 'أُنشئ',
      render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString() : '-',
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex gap-2 justify-end">
          {r.external_url && <a className="inline-flex items-center justify-center rounded-lg px-2 py-1 text-sm border" href={r.external_url} target="_blank" rel="noreferrer">فتح</a>}
          {r.file_url && <a className="inline-flex items-center justify-center rounded-lg px-2 py-1 text-sm border" href={r.file_url} target="_blank" rel="noreferrer">تنزيل</a>}
          <Btn
            variant="outline"
            className="!px-2 !py-1"
            onClick={async () => {
              if (!window.confirm('حذف هذا المورد؟')) return;
              await j(`${API}/admin/resources/${r.id}`, { method: 'DELETE' });
              toast('تم الحذف', 'ok');
              load();
            }}
          >حذف</Btn>
        </div>
      ),
    },
  ];

  return (
    <section className="rounded-2xl border p-4 bg-white dark:bg-slate-950">
      <div className="flex items-center justify-between mb-3">
        <div className="font-bold">الموارد</div>
        <Btn onClick={() => setOpen(true)}>+ مورد</Btn>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Input placeholder="ابحث في العنوان/الوصف…" value={state.q} onChange={e=>setState(s=>({...s,q:e.target.value}))}/>
        <Btn variant="outline" onClick={load}>بحث</Btn>
      </div>

      <DataTable columns={cols} rows={state.rows} loading={state.loading} />

      <ResourceDrawer
        open={open}
        onClose={() => setOpen(false)}
        subjects={filteredSubjects}
        scope={drawerScope}
        setScope={setDrawerScope}
        uploader={uploadToCloudinary}
        onSubmit={async (payload) => {
          await j(`${API}/admin/resources`, { method: 'POST', body: JSON.stringify(payload) });
          setOpen(false);
          toast('تم الحفظ', 'ok');
          load();
        }}
        // جديد:
        filters={filters}
        reloadFilters={reloadFilters}
      />
    </section>
  );
}

export default function Admin() {
  const nav = useNavigate();
  const { Toasts, push } = useToasts();

  async function handleLogout() {
    try { await fetch(`${API}/admin/logout`, { method: 'POST', credentials: 'include' }); }
    catch (e) {}
    finally { nav('/admin-login', { replace: true }); }
  }

  const [filters, setFilters] = React.useState({ levels: [], stages: [], sciences: [], subjects: [] });
  const [scope, setScope] = React.useState({
    level_id: '', stage_id: '', science_id: '', subject_id: '',
  });

  const reloadFilters = React.useCallback(async () => {
    try {
      const data = await j(`${API}/admin/_filters`);
      setFilters(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  React.useEffect(() => {
    reloadFilters();
  }, [reloadFilters]);

  const subjectsFiltered = React.useMemo(() => {
    return filters.subjects.filter(su =>
      (!scope.level_id  || su.level_id  === Number(scope.level_id)) &&
      (!scope.stage_id  || su.stage_id  === Number(scope.stage_id)) &&
      (!scope.science_id|| (su.science_ids ? su.science_ids.includes(Number(scope.science_id)) : su.science_id === Number(scope.science_id)))
    );
  }, [filters.subjects, scope.level_id, scope.stage_id, scope.science_id]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-6">
      <Toasts />

      <aside className="rounded-2xl border p-4 bg-white dark:bg-slate-950 grid gap-3">
        <div className="font-bold mb-1">التصفية</div>

        <div>
          <div className="text-xs text-slate-500 mb-1">المستوى</div>
          <Select
            value={scope.level_id}
            onChange={(e) =>
              setScope((s) => ({
                ...s,
                level_id: e.target.value,
                stage_id: '',
                subject_id: '',
              }))
            }
          >
            <option value="">— الكل —</option>
            {filters.levels.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <div className="text-xs text-slate-500 mb-1">المرحلة</div>
          <Select
            value={scope.stage_id}
            onChange={(e) =>
              setScope((s) => ({
                ...s,
                stage_id: e.target.value,
                subject_id: '',
              }))
            }
          >
            <option value="">— الكل —</option>
            {filters.stages
              .filter(st => !scope.level_id || st.level_id === Number(scope.level_id))
              .map((st) => <option key={st.id} value={st.id}>{st.name}</option>)
            }
          </Select>
        </div>

        <div>
          <div className="text-xs text-slate-500 mb-1">العلم</div>
          <Select
            value={scope.science_id}
            onChange={(e) =>
              setScope((s) => ({
                ...s,
                science_id: e.target.value,
                subject_id: '',
              }))
            }
          >
            <option value="">— الكل —</option>
            {filters.sciences.map((sc) => (
              <option key={sc.id} value={sc.id}>{sc.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <div className="text-xs text-slate-500 mb-1">المقرر</div>
          <Select
            value={scope.subject_id}
            onChange={(e) => setScope((s) => ({ ...s, subject_id: e.target.value }))}
          >
            <option value="">— الكل —</option>
            {subjectsFiltered.map((su) => (
              <option key={su.id} value={su.id}>{su.name}</option>
            ))}
          </Select>
        </div>

        <Btn variant="danger" className="mt-2" onClick={handleLogout}>تسجيل الخروج</Btn>
      </aside>

      <main className="grid gap-6">
        <StructurePanel toast={push} onChanged={reloadFilters} />
        <ResourcesPanel scope={scope} subjects={subjectsFiltered} toast={push} filters={filters} reloadFilters={reloadFilters} />
      </main>
    </div>
  );
}

