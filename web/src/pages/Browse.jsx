import React from 'react';
import ResourceCard from '../components/ResourceCard.jsx';
import TagsInput from '../components/TagsInput.jsx';
import ViewerModal from '../components/ViewerModal.jsx';
import useDebounce from '../hooks/useDebounce.js';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const SORTS = [
  { id: 'relevance', label: 'حسب الفلترة' },
  { id: 'newest', label: 'الأحدث' },
  { id: 'az', label: 'أبجديًا' },
];

export default function Browse() {
  const [filters, setFilters] = React.useState({ levels: [], stages: [], sciences: [], subjects: [] });
  const [filtersLoading, setFiltersLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const [selected, setSelected] = React.useState({
    level_id: '',
    stage_id: '',
    science_id: '',
    subject_id: '',
  });

  const [q, setQ] = React.useState('');
  const debouncedQ = useDebounce(q, 500);
  const [tagsInput, setTagsInput] = React.useState('');
  const [sort, setSort] = React.useState('relevance');
  const [view, setView] = React.useState('grid');

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(null);

  const [showFullDesc, setShowFullDesc] = React.useState(false);

  React.useEffect(() => {
    try {
      const usp = new URLSearchParams(window.location.search);
      const initial = {
        level_id: usp.get('level_id') || '',
        stage_id: usp.get('stage_id') || '',
        science_id: usp.get('science_id') || '',
        subject_id: usp.get('subject_id') || '',
      };
      setSelected(initial);
      setQ(usp.get('q') || '');
      setTagsInput(usp.get('tags') || '');
      setSort(usp.get('sort') || 'relevance');
      setView(usp.get('view') || 'grid');
    } catch {}
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        setFiltersLoading(true);
        const data = await getJson(`${API}/public/filters`);
        setFilters(data);
      } catch (e) {
        console.error('filters error', e);
        setError('تعذر تحميل بيانات الفلاتر.');
      } finally {
        setFiltersLoading(false);
      }
    })();
  }, []);

  function buildFullPdfSrc(u) {
    if (!u) return '';
    const [base, rawHash = ''] = String(u).split('#');
    const parts = rawHash ? rawHash.split('&').filter(Boolean) : [];

    const ensure = (k, v) => {
      const has = parts.some(p => p.startsWith(`${k}=`));
      if (!has) parts.push(`${k}=${v}`);
    };

    ensure('toolbar', '1');
    ensure('navpanes', '1');

    ensure('zoom', 'page-fit');     
    ensure('pagemode', 'thumbs');   

    return `${base}#${parts.join('&')}`;
  }

  const stagesForLevel = React.useMemo(() => {
    if (!selected.level_id) return filters.stages;
    const lid = Number(selected.level_id);
    return filters.stages.filter((s) => s.level_id === lid);
  }, [filters.stages, selected.level_id]);

  const subjectsForScience = React.useMemo(() => {
    if (!selected.science_id) return filters.subjects;
    const sid = Number(selected.science_id);
    return filters.subjects.filter((s) => s.science_ids?.includes(sid));
  }, [filters.subjects, selected.science_id]);

  async function loadResources() {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (debouncedQ) params.set('q', debouncedQ);
      if (selected.level_id) params.set('level_id', selected.level_id);
      if (selected.stage_id) params.set('stage_id', selected.stage_id);
      if (selected.science_id) params.set('science_id', selected.science_id);
      if (selected.subject_id) params.set('subject_id', selected.subject_id);
      const tags = tagsInput.split(',').map((s) => s.trim()).filter(Boolean);
      if (tags.length) params.set('tags', tags.join(','));
      params.set('sort', sort);
      params.set('view', view);

      const qs = params.toString();
      const url = `${API}/public/resources${qs ? `?${qs}` : ''}`;
      window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);

      const data = await getJson(url);
      const items = Array.isArray(data?.items) ? data.items : [];

      // client-side sort fallback
      const sorted = [...items];
      if (sort === 'az') {
        sorted.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'ar'));
      } else if (sort === 'newest') {
        const key = (x) => new Date(x.updated_at || x.created_at || 0).getTime() || Number(x.id) || 0;
        sorted.sort((a, b) => key(b) - key(a));
      }

      setRows(sorted);
    } catch (e) {
      console.error('resources error', e);
      setRows([]);
      setError('حدث خطأ أثناء تحميل النتائج.');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { loadResources(); }, []);
  React.useEffect(() => {
    loadResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, debouncedQ, tagsInput, sort, view]);

  function resetFilters() {
    setSelected({ level_id: '', stage_id: '', science_id: '', subject_id: '' });
    setQ('');
    setTagsInput('');
  }

  const activeUrl = active?.external_url || active?.file_url || active?.url || '';
  const activeMime = active?.mime || active?.mime_type || '';

  const hasChips =
    !!selected.level_id ||
    !!selected.stage_id ||
    !!selected.science_id ||
    !!selected.subject_id ||
    !!q ||
    !!tagsInput;

  return (
<section className="grid grid-cols-1 lg:grid-cols-[minmax(280px,300px),1fr] gap-8 items-start">
      <aside className="card p-4 h-fit lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] overflow-auto rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">تصفية الموارد</h2>
          {loading
            ? <span className="text-xs text-sky-500 animate-pulse">…جارِ التحميل</span>
            : <span className="text-xs text-slate-500">النتائج: {rows.length}</span>}
        </div>

        {filtersLoading ? (
          <FiltersSkeleton />
        ) : (
          <div className="grid gap-3">
            <Select label="المستوى" value={selected.level_id}
              onChange={(e) => setSelected((s) => ({ ...s, level_id: e.target.value, stage_id: '' }))}
              options={filters.levels} placeholder="كل المستويات" />

            <Select label="المرحلة" value={selected.stage_id}
              onChange={(e) => setSelected((s) => ({ ...s, stage_id: e.target.value }))}
              options={stagesForLevel} placeholder="كل المراحل" />

            <Select label="العِلم" value={selected.science_id}
              onChange={(e) => setSelected((s) => ({ ...s, science_id: e.target.value, subject_id: '' }))}
              options={filters.sciences} placeholder="كل العلوم" />

            <Select label="المقرر" value={selected.subject_id}
              onChange={(e) => setSelected((s) => ({ ...s, subject_id: e.target.value }))}
              options={subjectsForScience} placeholder="كل المقررات" disabled={!subjectsForScience.length} />

            <Input label="بحث نصّي" value={q} onChange={(e) => setQ(e.target.value)} placeholder="عنوان، كاتب، كلمة مفتاحية…" />
            <div><label className="text-xs text-slate-500">وسوم</label><TagsInput value={tagsInput} onChange={setTagsInput} /></div>

            <div className="grid grid-cols-2 gap-2 ">
              <button onClick={resetFilters} className="btn btn-outline">مسح الكل</button>
              <select className="select w-full border-slate-300 focus:ring-2 focus:ring-green-200 focus:border-green-300 hover:border-green-300 transition-all" value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
        )}
      </aside>

<div className="grid gap-4 pt-0 self-start">
        {hasChips && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(selected).map(([k, v]) =>
              v ? <button key={k} className="chip" onClick={() => setSelected((s) => ({ ...s, [k]: '' }))}>{k} ×</button> : null
            )}
            {tagsInput && <button className="chip" onClick={() => setTagsInput('')}>الوسوم ×</button>}
            {q && <button className="chip" onClick={() => setQ('')}>النص ×</button>}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {loading ? '…جارِ التحميل' : `النتائج: ${rows.length}`}
          </div>
          <div className="inline-flex rounded-full border border-slate-300/60 dark:border-slate-700/60 overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={`px-4 py-1.5 text-sm transition-colors ${view === 'grid'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'}`}
            >
              شبكة
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-1.5 text-sm transition-colors ${view === 'list'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'}`}
            >
              قائمة
            </button>
          </div>
        </div>

        {loading ? (
          <ResultsSkeleton view={view} />
        ) : rows.length === 0 ? (
          <div className="text-slate-500 text-center py-16 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
            لا توجد نتائج مطابقة حاليًا.<br />
            <span className="text-sm">خفّف الفلاتر أو جرّب كلمات أقل تحديدًا.</span>
          </div>
        ) : view === 'list' ? (
          <div className="grid gap-3 mt-0">
            {rows.map((r) => (
              <ResourceCard
                key={r.id}
                item={{ ...r, url: r.external_url || r.file_url || r.url, mime_type: r.mime || r.mime_type }}
                onOpen={(it) => { setActive(it); setShowFullDesc(false); setOpen(true); }}
                compact
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((r) => (
              <ResourceCard
                key={r.id}
                item={{ ...r, url: r.external_url || r.file_url || r.url, mime_type: r.mime || r.mime_type }}
                onOpen={(it) => { setActive(it); setShowFullDesc(false); setOpen(true); }}
              />
            ))}
          </div>
        )}
      </div>

      <ViewerModal
        open={open}
        onClose={() => { setOpen(false); setActive(null); setShowFullDesc(false); }}
        title={active?.title || 'المورد'}
      >
        {active && (
        <div className="flex flex-col gap-3 mt-0">
            {active.description && (
              <section className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/5 dark:bg-slate-900/20 p-3">
                <div className="text-xs text-slate-500 mb-2">الوصف</div>
                <div className={`prose dark:prose-invert max-w-none text-sm ${showFullDesc ? '' : 'line-clamp-3'}`}>
                  {active.description}
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => setShowFullDesc((s) => !s)}
                    className="btn-ghost text-xs"
                  >
                    {showFullDesc ? 'إخفاء' : 'قراءة المزيد'}
                  </button>
                </div>
              </section>
            )}

            <div className="text-sm flex flex-wrap gap-2">
              {active.type && <span className="badge">النوع: {active.type}</span>}
              {(active.mime || active.mime_type) && (
                <span className="badge">{active.mime || active.mime_type}</span>
              )}
            </div>

            {activeUrl && (
              <a
                className="btn btn-outline w-fit"
                href={activeUrl}
                target="_blank"
                rel="noreferrer"
              >
                فتح في تبويب جديد
              </a>
            )}

            {activeUrl && ((activeMime || '').includes('pdf') || activeUrl.toLowerCase().endsWith('.pdf')) && (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900/40">
                <iframe
                  src={buildFullPdfSrc(activeUrl)}
                  title="pdf"
                  className="w-full"
                  style={{ height: 'min(80vh, 1000px)' }}
                />
              </div>
            )}
          </div>
        )}
      </ViewerModal>
    </section>
  );
}

function Select({ label, options, value, onChange, placeholder, disabled }) {
  return (
    <div>
      <label className="text-xs text-slate-500">{label}</label>
      <select
        className="select w-full border-slate-300 focus:ring-2 focus:ring-green-200 focus:border-green-300 hover:border-green-300 transition-all"
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs text-slate-500">{label}</label>
      <input
        className="input w-full border-slate-300 focus:ring-2 focus:ring-green-200 focus:border-green-300 hover:border-green-300 transition-all"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}


function FiltersSkeleton() {
  return (
    <div className="grid gap-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="grid gap-2">
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function ResultsSkeleton({ view }) {
  const CardSkeleton = () => (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
        <div className="flex-1 grid gap-2">
          <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-800 rounded" />
          <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
      </div>
      <div className="mt-4 h-9 bg-slate-100 dark:bg-slate-800 rounded" />
    </div>
  );
  return (
    <div className={`grid gap-4 ${view === 'list' ? '' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
      {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}

