// src/pages/Admin.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

/* ======================== إعدادات أساسية ======================== */
const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

/** طلب JSON مع كوكيز الإدارة */
async function j(url, o = {}) {
  const res = await fetch(url, {
    ...o,
    headers: { 'Content-Type': 'application/json', ...(o.headers || {}) },
    credentials: 'include',
  });
  const txt = await res.text().catch(() => '');
  let data = null;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  if (!res.ok) {
    console.error('HTTP error', url, res.status, data);
    throw new Error(
      (data && (data.error || data.message)) || `HTTP ${res.status}`
    );
  }
  return data;
}

/** رفع بسيط إلى Cloudinary (unsigned) */
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

/* ======================== مكوّنات مساعدة داخل نفس الملف ======================== */

/** جدول بسيط مع بحث/ترقيم/فرز */
function DataTable({
  columns,
  rows,
  loading,
  page = 1,
  limit = 20,
  total = 0,
  onPageChange,
  onSortChange,
  sortBy,
  sortDir,
  onSearch,
  searchPlaceholder = 'ابحث...',
}) {
  const [q, setQ] = React.useState('');
  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 items-center justify-between mb-3">
        <input
          className="input w-64"
          placeholder={searchPlaceholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch?.(q)}
        />
        <div className="text-sm text-slate-500">
          {total ? `إجمالي: ${total}` : ''}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-[720px] w-full">
          <thead className="bg-slate-50 dark:bg-slate-900/30">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-right px-3 py-2 whitespace-nowrap"
                >
                  <button
                    className="hover:underline"
                    onClick={() =>
                      onSortChange?.(
                        col.key,
                        sortBy === col.key && sortDir === 'asc' ? 'desc' : 'asc'
                      )
                    }
                    title="فرز"
                    type="button"
                  >
                    {col.header}
                    {sortBy === col.key
                      ? sortDir === 'asc'
                        ? ' ▲'
                        : ' ▼'
                      : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-4">
                  جارِ التحميل…
                </td>
              </tr>
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
              <tr>
                <td colSpan={columns.length} className="p-4 text-slate-500">
                  لا توجد بيانات.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > limit && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <button
            className="btn btn-outline"
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
            disabled={page <= 1}
            type="button"
          >
            السابق
          </button>
          <div className="text-sm">
            صفحة {page} من {Math.ceil(total / limit)}
          </div>
          <button
            className="btn btn-outline"
            onClick={() => onPageChange?.(page + 1)}
            disabled={page * limit >= total}
            type="button"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}

/** إدخال وسوم على شكل Chips */
function TagInput({ value = [], onChange, placeholder = 'أضف وسمًا…' }) {
  const [text, setText] = React.useState('');
  function add(t) {
    const v = t.trim();
    if (!v) return;
    if (value.includes(v)) return;
    onChange?.([...value, v]);
    setText('');
  }
  function del(t) {
    onChange?.(value.filter((x) => x !== t));
  }
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 flex flex-wrap gap-2">
      {value.map((t) => (
        <span
          key={t}
          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs"
        >
          {t}
          <button
            className="ml-1 text-slate-500 hover:text-red-600"
            onClick={() => del(t)}
            type="button"
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="input flex-1 min-w-[160px]"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === ',' || e.key === 'Enter') {
            e.preventDefault();
            add(text);
          }
          if (e.key === 'Backspace' && !text && value.length) {
            del(value[value.length - 1]);
          }
        }}
        onBlur={() => add(text)}
      />
    </div>
  );
}

/** منطقة سحب وإفلات للرفع */
function FileDropzone({ onUploaded, uploader }) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  async function handleFiles(fs) {
    if (!fs || !fs.length) return;
    setErr('');
    setBusy(true);
    try {
      const f = fs[0];
      const res = await uploader?.(f); // { url, mime, size }
      if (res?.url) onUploaded?.(res);
    } catch (e) {
      setErr(e?.message || 'فشل الرفع');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-4 text-center ${
        busy ? 'opacity-60' : ''
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="mb-2">اسحب ملفًا هنا أو اختر يدويًا</div>
      <label className="btn btn-outline">
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

/** Drawer لإنشاء/تحرير موارد — نسخة قابلة للتمرير */
function ResourceDrawer({
  open,
  onClose,
  onSubmit,
  initial,
  materials = [],
  units = [],
  scope = {},
  setScope,
  uploader,
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

  React.useEffect(() => {
    if (initial) setF((s) => ({ ...s, ...initial }));
  }, [initial]);

  // قفل تمرير الخلفية عند الفتح
  React.useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-40 ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* ظل */}
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* اللوحة */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-slate-900 shadow-xl
                    transition-transform ${
                      open ? 'translate-x-0' : 'translate-x-full'
                    }
                    flex flex-col`}
        dir="rtl"
      >
        {/* رأس */}
        <div className="flex-none p-4 border-b flex items-center justify-between">
          <div className="font-bold">مورد جديد</div>
          <button className="btn btn-ghost" onClick={onClose} type="button">
            إغلاق
          </button>
        </div>

        {/* المحتوى */}
        <div
          className="flex-1 overflow-y-auto p-4 grid gap-3"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          <input
            className="input"
            placeholder="العنوان *"
            value={f.title}
            onChange={(e) =>
              setF((s) => ({ ...s, title: e.target.value }))
            }
          />
          <select
            className="select"
            value={f.type}
            onChange={(e) =>
              setF((s) => ({ ...s, type: e.target.value }))
            }
          >
            {[
              'ORIGINAL',
              'SUMMARY',
              'TRANSCRIPT',
              'NOTES',
              'EXERCISES',
              'SOLUTION',
              'SLIDES',
              'IMAGE',
              'OTHER',
            ].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <select
              className="select"
              value={scope.material_id || ''}
              onChange={(e) =>
                setScope((s) => ({
                  ...s,
                  material_id: e.target.value,
                  unit_id: '',
                }))
              }
            >
              <option value="">— اختر مادة —</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
            <select
              className="select"
              value={scope.unit_id || ''}
              onChange={(e) =>
                setScope((s) => ({ ...s, unit_id: e.target.value }))
              }
              disabled={!scope.material_id}
            >
              <option value="">— على مستوى المادة —</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  حلقة #{u.order_index} — {u.title}
                </option>
              ))}
            </select>
          </div>

          <textarea
            rows={3}
            className="input"
            placeholder="الوصف"
            value={f.description}
            onChange={(e) =>
              setF((s) => ({ ...s, description: e.target.value }))
            }
          />

          <FileDropzone
            uploader={uploader}
            onUploaded={(u) =>
              setF((s) => ({
                ...s,
                file_url: u.url,
                mime: u.mime || s.mime,
              }))
            }
          />

          <input
            className="input"
            placeholder="File URL (اختياري)"
            value={f.file_url}
            onChange={(e) =>
              setF((s) => ({ ...s, file_url: e.target.value }))
            }
          />
          <input
            className="input"
            placeholder="External URL (اختياري)"
            value={f.external_url}
            onChange={(e) =>
              setF((s) => ({ ...s, external_url: e.target.value }))
            }
          />
          <input
            className="input"
            placeholder="MIME"
            value={f.mime}
            onChange={(e) =>
              setF((s) => ({ ...s, mime: e.target.value }))
            }
          />
          <input
            className="input"
            placeholder="اللغة"
            value={f.language}
            onChange={(e) =>
              setF((s) => ({ ...s, language: e.target.value }))
            }
          />

          <div>
            <div className="text-xs text-slate-500 mb-1">وسوم</div>
            <TagInput
              value={f.tags}
              onChange={(tags) => setF((s) => ({ ...s, tags }))}
            />
          </div>
        </div>

        {/* ذيل */}
        <div className="flex-none p-4 border-t flex gap-2">
          <button
            className="btn-primary"
            onClick={() => {
              const payload = { ...f };
              const material_id = scope.unit_id
                ? null
                : scope.material_id
                ? Number(scope.material_id)
                : null;
              const unit_id = scope.unit_id ? Number(scope.unit_id) : null;
              onSubmit?.({ ...payload, material_id, unit_id });
            }}
            type="button"
          >
            حفظ
          </button>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            type="button"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======================== لوحة إدارة الهيكلة ======================== */

function StructurePanel() {
  const [tab, setTab] = React.useState('levels'); // levels | stages | sciences | subjects
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
  const [subjectScienceId, setSubjectScienceId] = React.useState('');

  const reload = React.useCallback(async () => {
    setLoading(true);
    setErr('');
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
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    reload();
  }, [reload]);

  async function addLevel() {
    if (!levelName.trim()) return;
    try {
      await j(`${API}/admin/levels`, {
        method: 'POST',
        body: JSON.stringify({ name: levelName.trim() }),
      });
      setLevelName('');
      reload();
    } catch (e) {
      alert(e.message || 'فشل إضافة المستوى');
    }
  }

  async function deleteLevel(id) {
    if (!window.confirm('حذف هذا المستوى؟ قد يسبّب مشاكل في البيانات.')) return;
    try {
      await j(`${API}/admin/levels/${id}`, { method: 'DELETE' });
      reload();
    } catch (e) {
      alert(e.message || 'فشل حذف المستوى (تأكد من عدم وجود مراحل/مواد مرتبطة)');
    }
  }

  async function addStage() {
    const lid = Number(stageLevelId);
    if (!stageName.trim() || !lid) return;
    try {
      await j(`${API}/admin/stages`, {
        method: 'POST',
        body: JSON.stringify({ level_id: lid, name: stageName.trim() }),
      });
      setStageName('');
      reload();
    } catch (e) {
      alert(e.message || 'فشل إضافة المرحلة');
    }
  }

  async function deleteStage(id) {
    if (!window.confirm('حذف هذه المرحلة؟')) return;
    try {
      await j(`${API}/admin/stages/${id}`, { method: 'DELETE' });
      reload();
    } catch (e) {
      alert(e.message || 'فشل حذف المرحلة (تأكد من عدم وجود مواد مرتبطة)');
    }
  }

  async function addScience() {
    if (!scienceName.trim()) return;
    try {
      await j(`${API}/admin/sciences`, {
        method: 'POST',
        body: JSON.stringify({ name: scienceName.trim() }),
      });
      setScienceName('');
      reload();
    } catch (e) {
      alert(e.message || 'فشل إضافة العلم');
    }
  }

  async function deleteScience(id) {
    if (!window.confirm('حذف هذا العلم؟')) return;
    try {
      await j(`${API}/admin/sciences/${id}`, { method: 'DELETE' });
      reload();
    } catch (e) {
      alert(e.message || 'فشل حذف العلم (تأكد من عدم وجود مقررات مرتبطة)');
    }
  }

  async function addSubject() {
    if (!subjectName.trim()) return;
    const sid = Number(subjectScienceId);
    try {
      await j(`${API}/admin/subjects`, {
        method: 'POST',
        body: JSON.stringify({
          name: subjectName.trim(),
          science_ids: sid ? [sid] : [],
        }),
      });
      setSubjectName('');
      reload();
    } catch (e) {
      alert(e.message || 'فشل إضافة المقرر');
    }
  }

  async function deleteSubject(id) {
    if (!window.confirm('حذف هذا المقرر؟')) return;
    try {
      await j(`${API}/admin/subjects/${id}`, { method: 'DELETE' });
      reload();
    } catch (e) {
      alert(e.message || 'فشل حذف المقرر (تأكد من عدم وجود مواد مرتبطة)');
    }
  }

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="font-bold">هيكلة المنهج</div>
        {loading && (
          <span className="text-xs text-slate-500">جارِ التحميل…</span>
        )}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          type="button"
          onClick={() => setTab('levels')}
          className={`px-3 py-1.5 rounded-full text-sm ${
            tab === 'levels'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700'
          }`}
        >
          المستويات
        </button>
        <button
          type="button"
          onClick={() => setTab('stages')}
          className={`px-3 py-1.5 rounded-full text-sm ${
            tab === 'stages'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700'
          }`}
        >
          المراحل
        </button>
        <button
          type="button"
          onClick={() => setTab('sciences')}
          className={`px-3 py-1.5 rounded-full text-sm ${
            tab === 'sciences'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700'
          }`}
        >
          العلوم
        </button>
        <button
          type="button"
          onClick={() => setTab('subjects')}
          className={`px-3 py-1.5 rounded-full text-sm ${
            tab === 'subjects'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700'
          }`}
        >
          المقررات
        </button>
      </div>

      {err && <div className="mb-3 text-xs text-red-600">{err}</div>}

      {/* المستويات */}
      {tab === 'levels' && (
        <div className="grid gap-3">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="اسم المستوى"
              value={levelName}
              onChange={(e) => setLevelName(e.target.value)}
            />
            <button
              className="btn-primary"
              type="button"
              onClick={addLevel}
            >
              + إضافة
            </button>
          </div>
          <ul className="space-y-1 text-sm">
            {levels.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 rounded-lg px-3 py-1.5"
              >
                <span>
                  {l.name}{' '}
                  <span className="text-xs text-slate-500">
                    (#{l.id})
                  </span>
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => deleteLevel(l.id)}
                >
                  حذف
                </button>
              </li>
            ))}
            {!levels.length && !loading && (
              <li className="text-xs text-slate-500">
                لا توجد مستويات بعد.
              </li>
            )}
          </ul>
        </div>
      )}

      {/* المراحل */}
      {tab === 'stages' && (
        <div className="grid gap-3">
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr),200px,auto]">
            <input
              className="input"
              placeholder="اسم المرحلة"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
            />
            <select
              className="select"
              value={stageLevelId}
              onChange={(e) => setStageLevelId(e.target.value)}
            >
              <option value="">اختر مستوى</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <button
              className="btn-primary"
              type="button"
              onClick={addStage}
            >
              + إضافة
            </button>
          </div>
          <ul className="space-y-1 text-sm">
            {stages.map((st) => (
              <li
                key={st.id}
                className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 rounded-lg px-3 py-1.5"
              >
                <span>
                  {st.name}{' '}
                  <span className="text-xs text-slate-500">
                    (مستوى:{' '}
                    {
                      levels.find((l) => l.id === st.level_id)?.name ??
                      st.level_id
                    }
                    )
                  </span>
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => deleteStage(st.id)}
                >
                  حذف
                </button>
              </li>
            ))}
            {!stages.length && !loading && (
              <li className="text-xs text-slate-500">
                لا توجد مراحل بعد.
              </li>
            )}
          </ul>
        </div>
      )}

      {/* العلوم */}
      {tab === 'sciences' && (
        <div className="grid gap-3">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="اسم العلم"
              value={scienceName}
              onChange={(e) => setScienceName(e.target.value)}
            />
            <button
              className="btn-primary"
              type="button"
              onClick={addScience}
            >
              + إضافة
            </button>
          </div>
          <ul className="space-y-1 text-sm">
            {sciences.map((sc) => (
              <li
                key={sc.id}
                className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 rounded-lg px-3 py-1.5"
              >
                <span>
                  {sc.name}{' '}
                  <span className="text-xs text-slate-500">
                    (#{sc.id})
                  </span>
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => deleteScience(sc.id)}
                >
                  حذف
                </button>
              </li>
            ))}
            {!sciences.length && !loading && (
              <li className="text-xs text-slate-500">
                لا توجد علوم بعد.
              </li>
            )}
          </ul>
        </div>
      )}

      {/* المقررات */}
      {tab === 'subjects' && (
        <div className="grid gap-3">
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr),200px,auto]">
            <input
              className="input"
              placeholder="اسم المقرر"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
            />
            <select
              className="select"
              value={subjectScienceId}
              onChange={(e) => setSubjectScienceId(e.target.value)}
            >
              <option value="">اختر علمًا (اختياري)</option>
              {sciences.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
            <button
              className="btn-primary"
              type="button"
              onClick={addSubject}
            >
              + إضافة
            </button>
          </div>
          <ul className="space-y-1 text-sm">
            {subjects.map((su) => (
              <li
                key={su.id}
                className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 rounded-lg px-3 py-1.5"
              >
                <span>
                  {su.name}{' '}
                  <span className="text-xs text-slate-500">
                    (#{su.id})
                  </span>
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => deleteSubject(su.id)}
                >
                  حذف
                </button>
              </li>
            ))}
            {!subjects.length && !loading && (
              <li className="text-xs text-slate-500">
                لا توجد مقررات بعد.
              </li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
}

/* ======================== الصفحة الرئيسية للإدارة ======================== */

export default function Admin() {
  const nav = useNavigate();

  async function handleLogout() {
    try {
      await fetch(`${API}/admin/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      nav('/admin-login', { replace: true });
    }
  }

  const [filters, setFilters] = React.useState({
    levels: [],
    stages: [],
    sciences: [],
    subjects: [],
  });
  const [scope, setScope] = React.useState({
    level_id: '',
    stage_id: '',
    science_id: '',
    subject_id: '',
    material_id: '',
    unit_id: '',
  });

  // تحميل شجرة الفلاتر (للاستخدام في الشريط الجانبي فقط)
  React.useEffect(() => {
    (async () => {
      try {
        const f = await j(`${API}/admin/_filters`);
        setFilters(f);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // المواد المرتبطة بالتصفية
  const [materials, setMaterials] = React.useState([]);
  React.useEffect(() => {
    (async () => {
      const qs = new URLSearchParams();
      if (scope.subject_id) qs.set('subject_id', scope.subject_id);
      if (scope.science_id) qs.set('science_id', scope.science_id);
      if (scope.stage_id) qs.set('stage_id', scope.stage_id);
      const d = await j(`${API}/admin/materials?${qs.toString()}`);
      setMaterials(Array.isArray(d) ? d : []);
    })();
  }, [scope.subject_id, scope.science_id, scope.stage_id]);

  // وحدات المادة المختارة
  const [units, setUnits] = React.useState([]);
  React.useEffect(() => {
    (async () => {
      if (!scope.material_id) return setUnits([]);
      const d = await j(
        `${API}/admin/units?material_id=${scope.material_id}`
      );
      setUnits(Array.isArray(d) ? d : []);
    })();
  }, [scope.material_id]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-6">
      {/* الشريط الجانبي: شجرة فلاتر */}
      <aside className="card p-4 grid gap-3">
        <div className="font-bold mb-1">التصفية</div>

        <div>
          <div className="text-xs text-slate-500 mb-1">المستوى</div>
          <select
            className="select w-full"
            value={scope.level_id}
            onChange={(e) =>
              setScope((s) => ({
                ...s,
                level_id: e.target.value,
                stage_id: '',
                subject_id: '',
                material_id: '',
                unit_id: '',
              }))
            }
          >
            <option value="">— الكل —</option>
            {filters.levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-xs text-slate-500 mb-1">المرحلة</div>
          <select
            className="select w-full"
            value={scope.stage_id}
            onChange={(e) =>
              setScope((s) => ({
                ...s,
                stage_id: e.target.value,
                subject_id: '',
                material_id: '',
                unit_id: '',
              }))
            }
          >
            <option value="">— الكل —</option>
            {filters.stages
              .filter(
                (st) =>
                  !scope.level_id ||
                  st.level_id === Number(scope.level_id)
              )
              .map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <div className="text-xs text-slate-500 mb-1">العلم</div>
          <select
            className="select w-full"
            value={scope.science_id}
            onChange={(e) =>
              setScope((s) => ({
                ...s,
                science_id: e.target.value,
                material_id: '',
                unit_id: '',
              }))
            }
          >
            <option value="">— الكل —</option>
            {filters.sciences.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-xs text-slate-500 mb-1">المقرر</div>
          <select
            className="select w-full"
            value={scope.subject_id}
            onChange={(e) =>
              setScope((s) => ({
                ...s,
                subject_id: e.target.value,
                material_id: '',
                unit_id: '',
              }))
            }
          >
            <option value="">— الكل —</option>
            {filters.subjects.map((su) => (
              <option key={su.id} value={su.id}>
                {su.name}
              </option>
            ))}
          </select>
        </div>

        {!!materials.length && (
          <div>
            <div className="text-xs text-slate-500 mb-1">المادة</div>
            <select
              className="select w-full"
              value={scope.material_id || ''}
              onChange={(e) =>
                setScope((s) => ({
                  ...s,
                  material_id: e.target.value,
                  unit_id: '',
                }))
              }
            >
              <option value="">— لا شيء —</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {!!units.length && (
          <div>
            <div className="text-xs text-slate-500 mb-1">حلقة</div>
            <select
              className="select w-full"
              value={scope.unit_id || ''}
              onChange={(e) =>
                setScope((s) => ({ ...s, unit_id: e.target.value }))
              }
              disabled={!scope.material_id}
            >
              <option value="">— على مستوى المادة —</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  #{u.order_index} — {u.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="mt-4 rounded bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-sm"
          type="button"
        >
          تسجيل الخروج
        </button>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="grid gap-6">
        <StructurePanel />
        <MaterialsPanel scope={scope} />
        <ResourcesPanel scope={scope} materials={materials} units={units} />
      </main>
    </div>
  );
}

/* ======================== لوحة المواد (مع إضافة/حذف) ======================== */

function MaterialsPanel({ scope }) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  const [newTitle, setNewTitle] = React.useState('');
  const [newProvider, setNewProvider] = React.useState('');

  const reload = React.useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const qs = new URLSearchParams();
      if (scope.subject_id) qs.set('subject_id', scope.subject_id);
      if (scope.science_id) qs.set('science_id', scope.science_id);
      if (scope.stage_id) qs.set('stage_id', scope.stage_id);
      const d = await j(`${API}/admin/materials?${qs.toString()}`);
      setRows(Array.isArray(d) ? d : []);
    } catch (e) {
      console.error(e);
      setErr('تعذّر تحميل المواد');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [scope.subject_id, scope.science_id, scope.stage_id]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  async function createMaterial() {
    if (!newTitle.trim()) return;
    try {
      await j(`${API}/admin/materials`, {
        method: 'POST',
        body: JSON.stringify({
          subject_id: scope.subject_id ? Number(scope.subject_id) : null,
          title: newTitle.trim(),
          kind: 'COURSE',
          provider: newProvider || null,
          science_ids: scope.science_id ? [Number(scope.science_id)] : [],
          stage_ids: scope.stage_id ? [Number(scope.stage_id)] : [],
        }),
      });
      setNewTitle('');
      setNewProvider('');
      reload();
    } catch (e) {
      alert(e.message || 'فشل إضافة المادة');
    }
  }

  async function deleteMaterial(id) {
    if (!window.confirm('حذف هذه المادة؟')) return;
    try {
      await j(`${API}/admin/materials/${id}`, { method: 'DELETE' });
      reload();
    } catch (e) {
      alert(e.message || 'فشل حذف المادة');
    }
  }

  const cols = [
    { key: 'title', header: 'العنوان' },
    { key: 'kind', header: 'النوع' },
    { key: 'provider', header: 'الجهة' },
    {
      key: 'created_at',
      header: 'أُنشئت',
      render: (r) =>
        r.created_at
          ? new Date(r.created_at).toLocaleDateString()
          : '-',
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button
          type="button"
          className="btn btn-outline btn-xs"
          onClick={() => deleteMaterial(r.id)}
        >
          حذف
        </button>
      ),
    },
  ];

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-bold">المواد</div>
      </div>

      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr),220px,auto] mb-4">
        <input
          className="input"
          placeholder="عنوان مادة جديدة"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <input
          className="input"
          placeholder="الجهة (اختياري)"
          value={newProvider}
          onChange={(e) => setNewProvider(e.target.value)}
        />
        <button
          className="btn-primary"
          type="button"
          onClick={createMaterial}
        >
          + إضافة مادة
        </button>
      </div>

      {err && <div className="mb-2 text-xs text-red-600">{err}</div>}

      <DataTable
        columns={cols}
        rows={rows}
        loading={loading}
        page={1}
        limit={rows.length || 1}
        total={rows.length}
        onPageChange={() => {}}
        onSortChange={() => {}}
      />
    </section>
  );
}

/* ======================== لوحة الموارد ======================== */

function ResourcesPanel({ scope, materials, units }) {
  const [state, setState] = React.useState({
    rows: [],
    page: 1,
    limit: 20,
    total: 0,
    loading: true,
    q: '',
    sortBy: 'created_at',
    sortDir: 'desc',
  });
  const [open, setOpen] = React.useState(false);

  // حالة مستقلة لنطاق الـDrawer
  const [drawerScope, setDrawerScope] = React.useState({
    material_id: '',
    unit_id: '',
  });

  // عند الفتح: نهيّئ من الشريط الجانبي
  React.useEffect(() => {
    if (open) {
      setDrawerScope({
        material_id: scope.material_id || '',
        unit_id: scope.unit_id || '',
      });
    }
  }, [open, scope.material_id, scope.unit_id]);

  // تحميل وحدات المادة المختارة داخل الـDrawer
  const [drawerUnits, setDrawerUnits] = React.useState([]);
  React.useEffect(() => {
    (async () => {
      if (!drawerScope.material_id) return setDrawerUnits([]);
      const d = await j(
        `${API}/admin/units?material_id=${drawerScope.material_id}`
      );
      setDrawerUnits(Array.isArray(d) ? d : []);
    })();
  }, [drawerScope.material_id]);

  async function load({ page = state.page, q = state.q } = {}) {
    setState((s) => ({ ...s, loading: true }));
    const qs = new URLSearchParams({ page, limit: state.limit });
    if (q) qs.set('q', q);
    if (scope.material_id) qs.set('material_id', scope.material_id);
    if (scope.unit_id) qs.set('unit_id', scope.unit_id);
    const d = await j(`${API}/admin/resources?${qs.toString()}`);
    setState((s) => ({
      ...s,
      loading: false,
      rows: d.rows || d,
      total: d.total || (d.rows ? d.rows.length : 0),
      page,
      q,
    }));
  }

  React.useEffect(() => {
    load({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.material_id, scope.unit_id]);

  const cols = [
    { key: 'title', header: 'العنوان' },
    { key: 'type', header: 'النوع' },
    { key: 'mime', header: 'MIME' },
    {
      key: 'created_at',
      header: 'أُنشئ',
      render: (r) =>
        r.created_at
          ? new Date(r.created_at).toLocaleDateString()
          : '-',
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex gap-2 justify-end">
          {r.external_url && (
            <a
              className="btn btn-outline btn-xs"
              href={r.external_url}
              target="_blank"
              rel="noreferrer"
            >
              فتح
            </a>
          )}
          {r.file_url && (
            <a
              className="btn btn-outline btn-xs"
              href={r.file_url}
              target="_blank"
              rel="noreferrer"
            >
              تنزيل
            </a>
          )}
          <button
            className="btn btn-outline btn-xs"
            type="button"
            onClick={async () => {
              if (!window.confirm('حذف هذا المورد؟')) return;
              await j(`${API}/admin/resources/${r.id}`, {
                method: 'DELETE',
              });
              load();
            }}
          >
            حذف
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-bold">الموارد</div>
        <button
          className="btn-primary"
          type="button"
          onClick={() => setOpen(true)}
        >
          + مورد
        </button>
      </div>

      <DataTable
        columns={cols}
        rows={state.rows}
        loading={state.loading}
        page={state.page}
        limit={state.limit}
        total={state.total}
        onPageChange={(p) => load({ page: p })}
        onSortChange={() => {}}
        onSearch={(q) => load({ page: 1, q })}
      />

      <ResourceDrawer
        open={open}
        onClose={() => setOpen(false)}
        materials={materials}
        units={drawerUnits}
        scope={drawerScope}
        setScope={setDrawerScope}
        uploader={uploadToCloudinary}
        onSubmit={async (payload) => {
          if (!payload.title) return alert('العنوان مطلوب');
          if (!payload.material_id && !payload.unit_id)
            return alert('اختر مادة/حلقة');

          await j(`${API}/admin/resources`, {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          setOpen(false);
          load({ page: 1 });
        }}
      />
    </section>
  );
}

